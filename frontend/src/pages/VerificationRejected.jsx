import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, getRedirectPathForUser } from "../context/AuthContext";

export default function VerificationRejected() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // If user is already approved, immediately redirect to their portal
  useEffect(() => {
    if (user && user.verificationStatus === "approved") {
      navigate(getRedirectPathForUser(user), { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const reapplyPath =
    user?.role === "merchant" ? "/become-merchant" : "/become-delivery-partner";

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

        <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-error-container text-center">
          <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto mb-4 border border-error/20">
            <span className="material-symbols-outlined text-[32px]">cancel</span>
          </div>

          <span className="px-3 py-1 rounded-full bg-error-container text-on-error-container text-xs font-bold uppercase tracking-wider inline-block mb-3">
            Application Review Not Approved
          </span>

          <h2 className="text-2xl font-bold tracking-tight text-on-surface">
            Verification Unsuccessful
          </h2>

          <p className="text-sm text-secondary mt-2">
            Hello <strong className="text-on-surface">{user?.name || "Partner"}</strong>,
            your onboarding application could not be verified by the Ahmedabad Compliance Desk.
          </p>

          {/* Feedback Reason Card */}
          <div className="mt-6 p-4 rounded-2xl bg-error-container/20 border border-error-container text-left space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-error block">
              Compliance Reviewer Notes
            </span>
            <p className="text-sm font-semibold text-on-surface">
              {user?.rejectionReason ||
                "Provided documents, license expiration date or photographs did not meet verification criteria."}
            </p>
          </div>

          <p className="text-xs text-secondary mt-4">
            You can rectify the flagged information and resubmit your application for immediate re-examination.
          </p>

          <div className="mt-6 space-y-3">
            <Link
              to={reapplyPath}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">edit_document</span>
              <span>Update &amp; Re-Submit Application</span>
            </Link>

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
