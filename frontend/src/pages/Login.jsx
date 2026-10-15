import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, getRedirectPathForUser } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [successMsg, setSuccessMsg] = useState(location.state?.message || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);
      let redirectPath = getRedirectPathForUser(user);
      const requestedPath = location.state?.from?.pathname;
      if (
        requestedPath &&
        requestedPath !== "/unauthorized" &&
        requestedPath !== "/verification-pending" &&
        requestedPath !== "/verification-rejected" &&
        requestedPath !== "/login"
      ) {
        if (
          user.role === "customer" &&
          !requestedPath.startsWith("/merchant") &&
          !requestedPath.startsWith("/fleet") &&
          !requestedPath.startsWith("/admin") &&
          !requestedPath.startsWith("/superadmin")
        ) {
          redirectPath = requestedPath;
        } else if (
          (user.role === "admin" || user.role === "superadmin") &&
          requestedPath.startsWith("/admin")
        ) {
          redirectPath = requestedPath;
        } else if (
          user.role === "superadmin" &&
          requestedPath.startsWith("/superadmin")
        ) {
          redirectPath = requestedPath;
        } else if (
          user.role === "merchant" &&
          user.verificationStatus === "approved" &&
          requestedPath.startsWith("/merchant")
        ) {
          redirectPath = requestedPath;
        } else if (
          user.role === "delivery" &&
          user.verificationStatus === "approved" &&
          requestedPath.startsWith("/fleet")
        ) {
          redirectPath = requestedPath;
        }
      }
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (testEmail, testPassword) => {
    setEmail(testEmail);
    setPassword(testPassword);
    setError("");
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-primary selection:text-on-primary">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center text-on-primary font-bold text-xl shadow-md">
            🔥
          </div>
          <span className="text-3xl font-black tracking-tight text-on-surface">
            Bite<span className="text-primary">Go</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-on-surface mt-2">
          Welcome to BiteGo Platform
        </h2>
        <p className="text-sm text-secondary mt-1">
          One unified portal for Customers, Merchants, Fleet &amp; Administrators
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface-container-lowest py-8 px-6 sm:px-10 shadow-sm rounded-2xl border border-surface-container-high/60">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-error-container text-on-error-container text-sm font-semibold flex items-center gap-2 border border-error/20">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-green-50 text-green-700 text-sm font-semibold flex items-center gap-2 border border-green-200">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  mail
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50 focus:bg-surface-container-lowest transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  lock
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50 focus:bg-surface-container-lowest transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to BiteGo</span>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-8 pt-6 border-t border-surface-container-high/60">
            <span className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 text-center">
              Quick Test Credentials (5 Roles)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin("superadmin@bitego.com", "SuperAdmin@123")}
                className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-left transition-colors border border-surface-container-high/40 cursor-pointer"
              >
                <div className="font-bold text-primary flex items-center gap-1">
                  <span>👑</span> Super Admin
                </div>
                <div className="text-[11px] text-secondary truncate">superadmin@bitego.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin@bitego.com", "Admin@123")}
                className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-left transition-colors border border-surface-container-high/40 cursor-pointer"
              >
                <div className="font-bold text-on-surface flex items-center gap-1">
                  <span>🛡️</span> Admin
                </div>
                <div className="text-[11px] text-secondary truncate">admin@bitego.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("merchant@darkroast.com", "Merchant@123")}
                className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-left transition-colors border border-surface-container-high/40 cursor-pointer"
              >
                <div className="font-bold text-tertiary flex items-center gap-1">
                  <span>🍕</span> Merchant (Approved)
                </div>
                <div className="text-[11px] text-secondary truncate">merchant@darkroast.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("pendingmerchant@pizzeria.com", "Merchant@123")}
                className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-left transition-colors border border-surface-container-high/40 cursor-pointer"
              >
                <div className="font-bold text-amber-700 flex items-center gap-1">
                  <span>⏳</span> Merchant (Pending)
                </div>
                <div className="text-[11px] text-secondary truncate">pendingmerchant@pizzeria.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("delivery@bitego.com", "Delivery@123")}
                className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-left transition-colors border border-surface-container-high/40 cursor-pointer"
              >
                <div className="font-bold text-tertiary flex items-center gap-1">
                  <span>🛵</span> Fleet (Approved)
                </div>
                <div className="text-[11px] text-secondary truncate">delivery@bitego.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("customer@bitego.com", "Customer@123")}
                className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-left transition-colors border border-surface-container-high/40 cursor-pointer"
              >
                <div className="font-bold text-on-surface flex items-center gap-1">
                  <span>👤</span> Customer
                </div>
                <div className="text-[11px] text-secondary truncate">customer@bitego.com</div>
              </button>
            </div>
          </div>

          {/* Registration Links */}
          <div className="mt-6 pt-5 border-t border-surface-container-high/60 text-center space-y-2 text-xs text-secondary">
            <p>
              New customer?{" "}
              <Link to="/register" className="font-bold text-primary hover:underline">
                Create Customer Account
              </Link>
            </p>
            <div className="flex justify-center gap-4 text-xs font-semibold">
              <Link to="/become-merchant" className="text-tertiary hover:underline">
                Partner as Restaurant →
              </Link>
              <span>•</span>
              <Link to="/become-delivery-partner" className="text-secondary hover:underline">
                Deliver with BiteGo →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
