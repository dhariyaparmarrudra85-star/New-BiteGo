import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, getRedirectPathForUser } from "../context/AuthContext";

export default function Unauthorized() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleReturnPortal = () => {
    navigate(getRedirectPathForUser(user), { replace: true });
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-primary selection:text-on-primary">
      <div className="max-w-md w-full mx-auto">
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

        <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-surface-container-high/60 text-center">
          <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto mb-4 border border-error/20">
            <span className="material-symbols-outlined text-[32px]">lock</span>
          </div>

          <span className="px-3 py-1 rounded-full bg-error-container text-on-error-container text-xs font-bold uppercase tracking-wider inline-block mb-3">
            403 • Access Restricted
          </span>

          <h2 className="text-2xl font-bold tracking-tight text-on-surface">
            Permission Required
          </h2>

          <p className="text-sm text-secondary mt-2">
            You are signed in as{" "}
            <strong className="text-on-surface capitalize">
              {user?.role || "Guest"}
            </strong>
            . This portal is strictly restricted to authorized roles.
          </p>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleReturnPortal}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              <span>Go to Your Authorized Portal</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs transition-colors cursor-pointer"
            >
              Sign Out &amp; Switch Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
