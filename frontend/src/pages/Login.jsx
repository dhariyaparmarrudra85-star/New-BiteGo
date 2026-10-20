import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, getRedirectPathForUser } from "../context/AuthContext";
import BiteGoLogo from "../components/BiteGoLogo";

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", label: "India (+91)" },
  { code: "+1", flag: "🇺🇸", label: "USA / Canada (+1)" },
  { code: "+44", flag: "🇬🇧", label: "UK (+44)" },
  { code: "+971", flag: "🇦🇪", label: "UAE (+971)" },
  { code: "+65", flag: "🇸🇬", label: "Singapore (+65)" },
  { code: "+61", flag: "🇦🇺", label: "Australia (+61)" },
];

export default function Login() {
  const { user, login, sendPhoneOtp, verifyPhoneOtp, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: "phone" (default for fastest onboarding) or "email" (backward compatibility)
  const [authMode, setAuthMode] = useState("phone");

  // Phone OTP Flow State
  const [phoneStep, setPhoneStep] = useState(1); // 1 = enter phone, 2 = verify OTP
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [devSandboxNote, setDevSandboxNote] = useState("");

  // Email Flow State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Feedback State
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);

  // Modals for external provider setup and legal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showAppleModal, setShowAppleModal] = useState(false);
  const [legalModal, setLegalModal] = useState(null); // 'terms' | 'privacy' | null
  const [showDevCredentials, setShowDevCredentials] = useState(false);

  const otpInputRefs = useRef([]);
  const googleButtonRef = useRef(null);
  const googleInitializedRef = useRef(false);
  const [googleReady, setGoogleReady] = useState(false);

  // Auto-redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      const requestedPath = location.state?.from?.pathname;
      let target = getRedirectPathForUser(user);

      if (
        requestedPath &&
        requestedPath !== "/unauthorized" &&
        requestedPath !== "/verification-pending" &&
        requestedPath !== "/verification-rejected" &&
        requestedPath !== "/login"
      ) {
        // Enforce role-based boundaries
        if (
          user.role === "customer" &&
          !requestedPath.startsWith("/merchant") &&
          !requestedPath.startsWith("/fleet") &&
          !requestedPath.startsWith("/admin") &&
          !requestedPath.startsWith("/superadmin")
        ) {
          target = requestedPath;
        } else if (
          (user.role === "admin" || user.role === "superadmin") &&
          requestedPath.startsWith("/admin")
        ) {
          target = requestedPath;
        } else if (
          user.role === "superadmin" &&
          requestedPath.startsWith("/superadmin")
        ) {
          target = requestedPath;
        } else if (
          user.role === "merchant" &&
          user.verificationStatus === "approved" &&
          requestedPath.startsWith("/merchant")
        ) {
          target = requestedPath;
        } else if (
          user.role === "delivery" &&
          user.verificationStatus === "approved" &&
          requestedPath.startsWith("/fleet")
        ) {
          target = requestedPath;
        }
      }

      navigate(target, { replace: true });
    }
  }, [user, navigate, location.state]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (phoneStep === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phoneStep, countdown]);

  // Focus first OTP input when entering step 2
  useEffect(() => {
    if (phoneStep === 2 && otpInputRefs.current[0]) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [phoneStep]);

  // Post-login redirect helper
  const handleAuthSuccess = (authenticatedUser) => {
    let redirectPath = getRedirectPathForUser(authenticatedUser);
    const requestedPath = location.state?.from?.pathname;

    if (
      requestedPath &&
      requestedPath !== "/unauthorized" &&
      requestedPath !== "/verification-pending" &&
      requestedPath !== "/verification-rejected" &&
      requestedPath !== "/login"
    ) {
      if (
        authenticatedUser.role === "customer" &&
        !requestedPath.startsWith("/merchant") &&
        !requestedPath.startsWith("/fleet") &&
        !requestedPath.startsWith("/admin") &&
        !requestedPath.startsWith("/superadmin")
      ) {
        redirectPath = requestedPath;
      } else if (
        (authenticatedUser.role === "admin" ||
          authenticatedUser.role === "superadmin") &&
        requestedPath.startsWith("/admin")
      ) {
        redirectPath = requestedPath;
      } else if (
        authenticatedUser.role === "superadmin" &&
        requestedPath.startsWith("/superadmin")
      ) {
        redirectPath = requestedPath;
      } else if (
        authenticatedUser.role === "merchant" &&
        authenticatedUser.verificationStatus === "approved" &&
        requestedPath.startsWith("/merchant")
      ) {
        redirectPath = requestedPath;
      } else if (
        authenticatedUser.role === "delivery" &&
        authenticatedUser.verificationStatus === "approved" &&
        requestedPath.startsWith("/fleet")
      ) {
        redirectPath = requestedPath;
      }
    }

    navigate(redirectPath, { replace: true });
  };

  // STEP 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");

    const cleanNum = phoneNumber.replace(/[\s-]/g, "");
    if (!cleanNum || cleanNum.length < 7) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      const data = await sendPhoneOtp(cleanNum, countryCode);
      const masked = `${countryCode} ${"•".repeat(
        Math.max(0, cleanNum.length - 3)
      )}${cleanNum.slice(-3)}`;
      setMaskedPhone(masked);
      setPhoneStep(2);
      setCountdown(data.resendAvailableIn || 60);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      if (data.devSandboxNote) {
        setDevSandboxNote(data.devSandboxNote);
      }
    } catch (err) {
      setError(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setError("");
    setLoading(true);
    try {
      const cleanNum = phoneNumber.replace(/[\s-]/g, "");
      const data = await sendPhoneOtp(cleanNum, countryCode);
      setCountdown(data.resendAvailableIn || 60);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      setSuccessMsg("A new verification code has been sent.");
      if (data.devSandboxNote) {
        setDevSandboxNote(data.devSandboxNote);
      }
    } catch (err) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit changes with auto-focus
  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, "");

    // Handle single character
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance
    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (newDigits.every((d) => d !== "") && cleanVal) {
      submitOtpVerification(newDigits.join(""));
    }
  };

  // Handle backspace navigation
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste in OTP input
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || "";
    }
    setOtpDigits(newDigits);

    // Focus last filled box
    const nextIdx = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextIdx]?.focus();

    if (pastedData.length === 6) {
      submitOtpVerification(pastedData);
    }
  };

  // STEP 2: Verify OTP
  const submitOtpVerification = async (codeToVerify) => {
    const code = codeToVerify || otpDigits.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const cleanNum = phoneNumber.replace(/[\s-]/g, "");
      const res = await verifyPhoneOtp(cleanNum, code, countryCode);
      handleAuthSuccess(res.user);
    } catch (err) {
      setError(err.message || "Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Identity Services
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("[Google Sign-In] VITE_GOOGLE_CLIENT_ID is not configured in frontend .env");
      return;
    }

    let intervalId;
    let isCancelled = false;

    const setupGoogle = () => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        if (intervalId) clearInterval(intervalId);

        try {
          if (!googleInitializedRef.current) {
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: async (response) => {
                if (response?.credential) {
                  setLoading(true);
                  setError("");
                  try {
                    const res = await loginWithGoogle(response.credential);
                    handleAuthSuccess(res.user);
                  } catch (err) {
                    console.error("[Google Sign-In Error]:", err);
                    setError(err.message || "Google sign-in failed. Please try again.");
                  } finally {
                    setLoading(false);
                  }
                }
              },
              auto_select: false,
              cancel_on_tap_outside: true,
            });
            googleInitializedRef.current = true;
          }

          // Render Google button with outline theme
          googleButtonRef.current.innerHTML = "";
          const containerWidth = googleButtonRef.current.offsetWidth || 380;
          const buttonWidth = Math.min(Math.max(containerWidth, 200), 400);

          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: "outline",
            size: "large",
            type: "standard",
            shape: "rectangular",
            text: "continue_with",
            logo_alignment: "left",
            width: buttonWidth,
          });

          if (!isCancelled) {
            setGoogleReady(true);
          }
        } catch (err) {
          console.error("[Google Sign-In Init Error]:", err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogle();
    } else {
      intervalId = setInterval(setupGoogle, 200);
      setTimeout(() => {
        if (intervalId) clearInterval(intervalId);
      }, 7000);
    }

    return () => {
      isCancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Google Sign-In Fallback Trigger
  const handleGoogleClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setError("Google Sign-In is not configured. Missing VITE_GOOGLE_CLIENT_ID in frontend/.env.");
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason();
          console.warn("[Google Sign-In]: Prompt not displayed -", reason);
          if (reason === "suppressed_by_user" || reason === "opt_out_or_no_session") {
            setError("Google One-Tap was dismissed or is disabled in your browser. Please use the Google sign-in button.");
          }
        }
      });
    } else {
      setError("Google Identity Services is currently unavailable. Please check your internet connection or ad blocker and try again.");
    }
  };

  // Apple Sign-In Flow
  const handleAppleClick = () => {
    // Displays configuration modal if Apple credentials are not set
    setShowAppleModal(true);
  };

  // Email / Password Login Submit
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const authenticatedUser = await login(email, password);
      handleAuthSuccess(authenticatedUser);
    } catch (err) {
      setError(err.message || "Failed to log in. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Quick fill test credentials
  const handleQuickLogin = (testEmail, testPassword) => {
    setAuthMode("email");
    setEmail(testEmail);
    setPassword(testPassword);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-center py-10 sm:py-14 px-4 sm:px-6 lg:px-8 selection:bg-[#b12408] selection:text-white">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-2 hover:opacity-95 transition-opacity">
          <BiteGoLogo size={44} />
          <span className="text-3xl font-black tracking-tight text-[#151c27]">
            Bite<span className="text-[#b12408]">Go</span>
          </span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#151c27] mt-3">
          Welcome to BiteGo
        </h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          Good food is just a few taps away.
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-9 shadow-sm rounded-3xl border border-gray-200/80">
          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 text-red-700 text-sm font-semibold flex items-start gap-2.5 border border-red-200/80 animate-in fade-in">
              <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0 text-red-600">
                error
              </span>
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-sm font-semibold flex items-center gap-2.5 border border-emerald-200 animate-in fade-in">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">
                check_circle
              </span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Dev Sandbox Helper Note */}
          {devSandboxNote && phoneStep === 2 && (
            <div className="mb-5 p-3 rounded-2xl bg-amber-50 text-amber-900 text-xs border border-amber-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🧪</span>
                <span>
                  <strong>Sandbox Mode:</strong> Use code{" "}
                  <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold text-amber-900">
                    123456
                  </code>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOtpDigits(["1", "2", "3", "4", "5", "6"]);
                  submitOtpVerification("123456");
                }}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm cursor-pointer whitespace-nowrap"
              >
                Auto-Fill
              </button>
            </div>
          )}

          {authMode === "phone" ? (
            /* =================== PHONE NUMBER & OTP FLOW =================== */
            phoneStep === 1 ? (
              /* STEP 1: Enter Phone Number */
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Mobile Phone Number
                  </label>
                  <div className="flex rounded-2xl border border-gray-300 bg-gray-50/50 overflow-hidden focus-within:border-[#b12408] focus-within:ring-2 focus-within:ring-[#b12408]/15 focus-within:bg-white transition-all">
                    {/* Country Code Selector */}
                    <div className="relative border-r border-gray-200 bg-gray-100/60 flex items-center">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="appearance-none bg-transparent pl-3 pr-7 py-3 text-sm font-semibold text-[#151c27] focus:outline-none cursor-pointer"
                        aria-label="Country Code"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.code}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-1.5 pointer-events-none text-gray-500 text-[18px]">
                        arrow_drop_down
                      </span>
                    </div>

                    {/* Phone Number Input */}
                    <input
                      type="tel"
                      required
                      autoFocus
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="98765 43210"
                      className="w-full px-3.5 py-3 text-sm text-[#151c27] font-medium bg-transparent focus:outline-none placeholder:text-gray-400"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    We will send a 6-digit one-time verification code via SMS.
                  </p>
                </div>

                {/* Primary Button: Continue with Phone */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#b12408] hover:bg-[#921c05] text-white font-bold text-sm shadow-md shadow-[#b12408]/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">sms</span>
                      <span>Continue with Phone</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* STEP 2: Verify OTP */
              <div className="space-y-5 animate-in fade-in">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-50 text-[#b12408] mb-2.5">
                    <span className="material-symbols-outlined text-2xl">mark_email_read</span>
                  </div>
                  <h3 className="text-base font-bold text-[#151c27]">Enter verification code</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    We sent a 6-digit code to <span className="font-semibold text-[#151c27]">{maskedPhone}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneStep(1);
                      setError("");
                    }}
                    className="mt-1 text-xs font-bold text-[#b12408] hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    Change phone number
                  </button>
                </div>

                {/* 6 Digit Inputs */}
                <div className="flex justify-between gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e.target.value ? e : e)}
                      className="w-11 h-12 sm:w-12 sm:h-13 text-center text-lg font-bold text-[#151c27] rounded-xl border border-gray-300 bg-gray-50/60 focus:bg-white focus:border-[#b12408] focus:ring-2 focus:ring-[#b12408]/20 focus:outline-none transition-all"
                    />
                  ))}
                </div>

                {/* Verify Button */}
                <button
                  type="button"
                  onClick={() => submitOtpVerification()}
                  disabled={loading || otpDigits.some((d) => !d)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#b12408] hover:bg-[#921c05] text-white font-bold text-sm shadow-md shadow-[#b12408]/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify &amp; Continue</span>
                  )}
                </button>

                {/* Resend Countdown */}
                <div className="text-center text-xs text-gray-500">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="font-bold text-[#b12408] hover:underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  ) : (
                    <span>
                      Resend code in{" "}
                      <strong className="text-[#151c27] font-semibold">
                        0:{countdown < 10 ? `0${countdown}` : countdown}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            )
          ) : (
            /* =================== EXISTING EMAIL & PASSWORD LOGIN =================== */
            <form onSubmit={handleEmailSubmit} className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@bitego.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/60 rounded-xl text-sm text-[#151c27] border border-gray-300 focus:outline-none focus:border-[#b12408] focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                    lock
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/60 rounded-xl text-sm text-[#151c27] border border-gray-300 focus:outline-none focus:border-[#b12408] focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#b12408] hover:bg-[#921c05] text-white font-bold text-sm shadow-md shadow-[#b12408]/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In with Email</span>
                )}
              </button>
            </form>
          )}

          {/* Social Sign-In Buttons */}
          <div className="mt-5 space-y-2.5">
            {/* Google Sign-in */}
            <div className="w-full flex flex-col items-center">
              <div
                ref={googleButtonRef}
                className={`w-full flex justify-center [&>div]:!w-full [&_iframe]:!w-full min-h-[44px] ${
                  googleReady ? "" : "hidden"
                }`}
              />
              {!googleReady && (
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  className="w-full py-3 px-4 rounded-2xl border border-gray-300/90 bg-white hover:bg-gray-50/80 text-[#151c27] font-semibold text-sm shadow-xs transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-3"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 10.01 0 12c0 1.99.45 3.84 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              )}
            </div>


            {/* Apple Sign-in */}
            <button
              type="button"
              onClick={handleAppleClick}
              className="w-full py-3 px-4 rounded-2xl bg-[#151c27] hover:bg-black text-white font-semibold text-sm shadow-xs transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.72-7.87-12.06-14.37-6.2-9.28-11.13-19.8-14.8-31.57-3.67-11.77-5.51-22.9-5.51-33.39 0-14.37 3.52-26.23 10.57-35.58 7.05-9.35 16.03-14.12 26.94-14.33 4.8 0 10.15 1.28 16.07 3.84 5.92 2.56 9.87 3.91 11.85 4.05 1.62-.14 5.75-1.56 12.4-4.25 6.65-2.69 12.35-3.88 17.1-3.57 12.63.74 22.84 5.37 30.63 13.9-11.05 6.69-16.44 15.93-16.16 27.73.28 9.35 3.87 17.27 10.77 23.76 6.9 6.49 15.17 10.22 24.81 11.19-2.22 6.78-4.99 13.91-8.31 21.39zM119.22 31.84c0-7.72 2.76-14.99 8.28-21.82 5.52-6.83 12.3-10.87 20.34-12.12.28 1.15.42 2.29.42 3.42 0 7.58-2.83 14.89-8.49 21.93-5.66 7.04-12.72 11.08-21.18 12.12-.14-1.14-.21-2.28-.21-3.41z" />
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>

          {/* Divider labelled "or" */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 font-semibold tracking-wider">
                or
              </span>
            </div>
          </div>

          {/* Toggle between Phone & Email login options */}
          <div className="text-center">
            {authMode === "phone" ? (
              <button
                type="button"
                onClick={() => {
                  setAuthMode("email");
                  setError("");
                }}
                className="text-xs font-bold text-gray-700 hover:text-[#b12408] transition-colors cursor-pointer py-1.5 px-3 rounded-xl border border-gray-200/90 hover:border-[#b12408]/30 hover:bg-orange-50/40 inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">mail</span>
                <span>Continue with Email &amp; Password</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMode("phone");
                  setError("");
                }}
                className="text-xs font-bold text-[#b12408] hover:underline transition-colors cursor-pointer py-1.5 px-3 rounded-xl border border-[#b12408]/30 bg-orange-50/50 inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">phone_iphone</span>
                <span>Back to Phone OTP Login</span>
              </button>
            )}
          </div>

          {/* Terms and Privacy Policy Links */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              By continuing, you agree to BiteGo's{" "}
              <button
                type="button"
                onClick={() => setLegalModal("terms")}
                className="text-gray-600 font-semibold underline hover:text-[#b12408] cursor-pointer"
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => setLegalModal("privacy")}
                className="text-gray-600 font-semibold underline hover:text-[#b12408] cursor-pointer"
              >
                Privacy Policy
              </button>
              .
            </p>
          </div>

          {/* Partner & Fleet Portal Links */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center items-center gap-3 text-xs text-gray-500">
            <Link
              to="/become-merchant"
              className="hover:text-[#b12408] font-medium transition-colors"
            >
              Partner as Restaurant →
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              to="/become-delivery-partner"
              className="hover:text-[#b12408] font-medium transition-colors"
            >
              Deliver with BiteGo →
            </Link>
          </div>

          {/* Developer Quick Test Credentials Accordion */}
          <div className="mt-5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowDevCredentials(!showDevCredentials)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600 py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span>⚡</span>
                <span>Developer Quick Logins (5 Roles)</span>
              </span>
              <span className="material-symbols-outlined text-[16px]">
                {showDevCredentials ? "expand_less" : "expand_more"}
              </span>
            </button>

            {showDevCredentials && (
              <div className="grid grid-cols-2 gap-2 mt-2.5 text-xs animate-in fade-in">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("superadmin@bitego.com", "SuperAdmin@123")}
                  className="p-2 rounded-xl bg-gray-50 hover:bg-orange-50/50 text-left transition-colors border border-gray-200/60 cursor-pointer"
                >
                  <div className="font-bold text-[#b12408] flex items-center gap-1">
                    <span>👑</span> Super Admin
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">superadmin@bitego.com</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin("admin@bitego.com", "Admin@123")}
                  className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-left transition-colors border border-gray-200/60 cursor-pointer"
                >
                  <div className="font-bold text-gray-800 flex items-center gap-1">
                    <span>🛡️</span> Admin
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">admin@bitego.com</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin("merchant@darkroast.com", "Merchant@123")}
                  className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-left transition-colors border border-gray-200/60 cursor-pointer"
                >
                  <div className="font-bold text-[#151c27] flex items-center gap-1">
                    <span>🍕</span> Merchant (Approved)
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">merchant@darkroast.com</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin("delivery@bitego.com", "Delivery@123")}
                  className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-left transition-colors border border-gray-200/60 cursor-pointer"
                >
                  <div className="font-bold text-[#151c27] flex items-center gap-1">
                    <span>🛵</span> Fleet (Approved)
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">delivery@bitego.com</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin("customer@bitego.com", "Customer@123")}
                  className="col-span-2 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-left transition-colors border border-gray-200/60 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-gray-800 flex items-center gap-1">
                      <span>👤</span> Customer (Standard)
                    </div>
                    <div className="text-[10px] text-gray-400">customer@bitego.com</div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#b12408]">Fill Email →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. Google OAuth Setup Instructions Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 10.01 0 12c0 1.99.45 3.84 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-[#151c27]">Google Sign-In Setup</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              Google OAuth identity verification is integrated on the backend. To enable the live Google One-Tap popup in your browser, configure your Google Cloud Console OAuth Client ID:
            </p>

            <div className="bg-gray-900 text-gray-100 rounded-xl p-3 text-xs font-mono mb-3 space-y-1 overflow-x-auto">
              <div className="text-gray-400"># 1. In frontend/.env:</div>
              <div className="text-amber-300">VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com</div>
              <div className="text-gray-400 mt-2"># 2. In backend/.env:</div>
              <div className="text-emerald-300">GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com</div>
            </div>

            <div className="text-[11px] text-gray-500 space-y-1 mb-4">
              <div>• Authorized Javascript origins: <code className="bg-gray-100 px-1 rounded text-gray-700">http://localhost:5173</code></div>
              <div>• Backend verifies Google token using the official Google Identity API without trusting frontend claims.</div>
            </div>

            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#151c27] text-white font-bold text-xs hover:bg-black transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* 2. Apple Sign-In Setup Modal */}
      {showAppleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.72-7.87-12.06-14.37-6.2-9.28-11.13-19.8-14.8-31.57-3.67-11.77-5.51-22.9-5.51-33.39 0-14.37 3.52-26.23 10.57-35.58 7.05-9.35 16.03-14.12 26.94-14.33 4.8 0 10.15 1.28 16.07 3.84 5.92 2.56 9.87 3.91 11.85 4.05 1.62-.14 5.75-1.56 12.4-4.25 6.65-2.69 12.35-3.88 17.1-3.57 12.63.74 22.84 5.37 30.63 13.9-11.05 6.69-16.44 15.93-16.16 27.73.28 9.35 3.87 17.27 10.77 23.76 6.9 6.49 15.17 10.22 24.81 11.19-2.22 6.78-4.99 13.91-8.31 21.39zM119.22 31.84c0-7.72 2.76-14.99 8.28-21.82 5.52-6.83 12.3-10.87 20.34-12.12.28 1.15.42 2.29.42 3.42 0 7.58-2.83 14.89-8.49 21.93-5.66 7.04-12.72 11.08-21.18 12.12-.14-1.14-.21-2.28-.21-3.41z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-[#151c27]">Apple Sign-In Setup</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAppleModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              Apple Sign-In is structured with backend token decoding and private-relay support. To enable Apple Sign-In in production, add your Apple Developer Services ID to the environment:
            </p>

            <div className="bg-gray-900 text-gray-100 rounded-xl p-3 text-xs font-mono mb-3 space-y-1">
              <div className="text-gray-400"># In backend/.env:</div>
              <div className="text-emerald-300">APPLE_CLIENT_ID=com.bitego.web</div>
              <div className="text-emerald-300">APPLE_TEAM_ID=XXXXXXXXXX</div>
            </div>

            <div className="text-[11px] text-gray-500 space-y-1 mb-4">
              <div>• Requires an active Apple Developer Program account.</div>
              <div>• Supports Private Relay emails without exposing user's actual inbox.</div>
            </div>

            <button
              type="button"
              onClick={() => setShowAppleModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#151c27] text-white font-bold text-xs hover:bg-black transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* 3. Legal Dialog (Terms of Service / Privacy Policy) */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-gray-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#151c27]">
                {legalModal === "terms" ? "BiteGo Terms of Service" : "BiteGo Privacy Policy"}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-600 space-y-3 leading-relaxed">
              {legalModal === "terms" ? (
                <>
                  <p>
                    <strong>1. Acceptance of Terms:</strong> By creating an account or using BiteGo food delivery services, you agree to comply with our terms, fair use policies, and community guidelines.
                  </p>
                  <p>
                    <strong>2. Account Registration:</strong> You agree to provide a valid phone number and verify ownership via SMS one-time password (OTP). You are responsible for safeguarding your credentials.
                  </p>
                  <p>
                    <strong>3. Order &amp; Delivery:</strong> Estimated delivery times (average 24 minutes in Ahmedabad) may vary during peak hours or adverse weather conditions.
                  </p>
                  <p>
                    <strong>4. Role-based Access:</strong> Customer accounts have access strictly to ordering and profile features. Unauthorized access attempts to merchant, fleet, or admin portals are strictly prohibited and audited.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>1. Information We Collect:</strong> We collect phone numbers, delivery addresses, and order history to fulfill your orders. For social logins, only authorized profile names and verified emails are stored.
                  </p>
                  <p>
                    <strong>2. OTP &amp; Security:</strong> One-Time Passwords (OTPs) are encrypted and hashed using HMAC-SHA256. Raw verification codes are never stored in plaintext or logged to external servers.
                  </p>
                  <p>
                    <strong>3. Data Sharing:</strong> Your address and contact number are shared strictly with assigned restaurant merchants and delivery fleet partners during active delivery fulfillment.
                  </p>
                  <p>
                    <strong>4. Cart &amp; Preferences:</strong> Items in your cart are preserved locally so you can seamlessly continue checkout upon authentication.
                  </p>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setLegalModal(null)}
              className="w-full mt-5 py-2.5 rounded-xl bg-[#b12408] text-white font-bold text-xs hover:bg-[#921c05] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
