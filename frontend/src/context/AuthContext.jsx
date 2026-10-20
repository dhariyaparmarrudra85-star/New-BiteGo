import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

import { API_BASE_URL } from "../services/api";

export const getRedirectPathForUser = (user) => {
  if (!user) return "/login";

  switch (user.role) {
    case "superadmin":
      return "/superadmin";
    case "admin":
      return "/admin";
    case "merchant":
      if (user.verificationStatus === "approved") return "/merchant";
      if (user.verificationStatus === "rejected") return "/verification-rejected";
      return "/verification-pending";
    case "delivery":
      if (user.verificationStatus === "approved") return "/fleet";
      if (user.verificationStatus === "rejected") return "/verification-rejected";
      return "/verification-pending";
    case "customer":
    default:
      return "/";
  }
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("bitego_token"));
  const [loading, setLoading] = useState(true);

  // Verify and fetch fresh user data on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem("bitego_token");
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.success && data.user) {
          setUser(data.user);
          setToken(storedToken);
        } else {
          // Token invalid or user suspended
          localStorage.removeItem("bitego_token");
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error("Auth verification failed:", err);
        // Fallback: don't clear immediately on network hiccup if user was set
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Login handler
  const login = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Login failed. Please check credentials.");
    }

    localStorage.setItem("bitego_token", data.token);
    setToken(data.token);
    setUser(data.user);

    return data.user;
  };

  // Register handler
  const register = async ({ name, email, password, phone, role = "customer" }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone, role }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Registration failed.");
    }

    return { success: true };
  };

  // Apply for Merchant
  const applyMerchant = async (merchantData) => {
    const activeToken = token || localStorage.getItem("bitego_token");
    const response = await fetch(`${API_BASE_URL}/merchant/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${activeToken}`,
      },
      body: JSON.stringify(merchantData),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Merchant application submission failed.");
    }

    // Refresh user state
    await refreshUser();
    return data;
  };

  // Apply for Delivery Partner
  const applyDelivery = async (deliveryData) => {
    const activeToken = token || localStorage.getItem("bitego_token");
    const response = await fetch(`${API_BASE_URL}/delivery/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${activeToken}`,
      },
      body: JSON.stringify(deliveryData),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Delivery partner application submission failed.");
    }

    // Refresh user state
    await refreshUser();
    return data;
  };

  // Toggle delivery duty status
  const toggleDeliveryDuty = async (isOnline) => {
    const activeToken = token || localStorage.getItem("bitego_token");
    const response = await fetch(`${API_BASE_URL}/delivery/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${activeToken}`,
      },
      body: JSON.stringify({ isOnline }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              isOnline: data.isOnline,
              isAvailable: data.isAvailable,
            }
          : prev
      );
    }
    return data;
  };

  // Refresh user from backend
  const refreshUser = async () => {
    const storedToken = token || localStorage.getItem("bitego_token");
    if (!storedToken) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success && data.user) {
        setUser(data.user);
        return data.user;
      }
    } catch (err) {
      console.error("Refresh user error:", err);
    }
    return null;
  };

  // Send Phone OTP
  const sendPhoneOtp = async (phone, countryCode = "+91") => {
    const response = await fetch(`${API_BASE_URL}/auth/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, countryCode }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const err = new Error(data.message || "Failed to send verification code.");
      err.retryAfter = data.retryAfter;
      throw err;
    }

    return data;
  };

  // Verify Phone OTP
  const verifyPhoneOtp = async (phone, otp, countryCode = "+91") => {
    const response = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp, countryCode }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "OTP verification failed.");
    }

    localStorage.setItem("bitego_token", data.token);
    setToken(data.token);
    setUser(data.user);

    return data;
  };

  // Google OAuth Login
  const loginWithGoogle = async (credential) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error(`Server connection error (${response.status}). Please try again.`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Google sign-in failed.");
      }

      localStorage.setItem("bitego_token", data.token);
      setToken(data.token);
      setUser(data.user);

      return data;
    } catch (err) {
      console.error("[AuthContext] Google sign-in failed:", err.message);
      throw err;
    }
  };

  // Apple Sign-In
  const loginWithApple = async (identityToken, userData = null) => {
    const response = await fetch(`${API_BASE_URL}/auth/apple`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identityToken, user: userData }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Apple sign-in failed.");
    }

    localStorage.setItem("bitego_token", data.token);
    setToken(data.token);
    setUser(data.user);

    return data;
  };

  // Logout handler
  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem("bitego_token");
      setToken(null);
      setUser(null);
      navigate("/login", { replace: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        sendPhoneOtp,
        verifyPhoneOtp,
        loginWithGoogle,
        loginWithApple,
        logout,
        applyMerchant,
        applyDelivery,
        toggleDeliveryDuty,
        refreshUser,
        getRedirectPathForUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
