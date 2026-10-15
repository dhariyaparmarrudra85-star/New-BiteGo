import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, getRedirectPathForUser } from "../context/AuthContext";

export default function VerificationPending() {
  const { user, refreshUser, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // If user is already approved, immediately redirect to their portal
  useEffect(() => {
    if (user && user.verificationStatus === "approved") {
      navigate(getRedirectPathForUser(user), { replace: true });
    }
  }, [user, navigate]);

  const handleCheckStatus = async () => {
    setChecking(true);
    setMessage("");
    try {
      const updatedUser = await refreshUser();
      if (updatedUser && updatedUser.verificationStatus === "approved") {
        navigate(getRedirectPathForUser(updatedUser), { replace: true });
      } else {
        setMessage("Application is still under review by BiteGo administrators.");
      }
    } catch {
      setMessage("Could not update status. Please try again later.");
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-primary selection:text-on-primary">
      <div className="max-w-md w-full mx-auto">
        {/* Brand */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow-sm">
              B
            </div>
            <span className="text-2xl font-black text-on-surface">
              Bite<span className="text-primary">Go</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-surface-container-high/60 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <span className="material-symbols-outlined text-[32px] animate-pulse">
              hourglass_top
            </span>
          </div>

          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider border border-amber-200 inline-block mb-3">
            Application Under Review
          </span>

          <h2 className="text-2xl font-bold tracking-tight text-on-surface">
            Verification In Progress
          </h2>

          <p className="text-sm text-secondary mt-2">
            Hello <strong className="text-on-surface">{user?.name || "Partner"}</strong>,
            your application for{" "}
            <span className="font-semibold text-primary capitalize">
              {user?.role === "merchant" ? "Restaurant Merchant Partner" : "Fleet Delivery Partner"}
            </span>{" "}
            has been submitted and queued for verification.
          </p>

          {/* SLA Timeline capsule */}
          <div className="mt-6 p-4 rounded-2xl bg-surface-container-low border border-surface-container-high/60 text-left space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              <span>Expected Turnaround</span>
              <span className="text-tertiary">~ 4.2 Hours</span>
            </div>
            <p className="text-xs text-secondary">
              Our Ahmedabad Central Operations desk checks FSSAI / RC credentials during business hours (08:00 - 22:00 IST).
            </p>
          </div>

          {message && (
            <p className="mt-4 text-xs font-semibold text-primary bg-primary-fixed/40 p-2.5 rounded-xl">
              {message}
            </p>
          )}

          {/* Actions */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {checking ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  <span>Checking Review Status...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                  <span>Refresh Approval Status</span>
                </>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs transition-colors cursor-pointer"
            >
              Log Out of This Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
