import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="font-label-md text-label-md text-on-surface-variant font-semibold">
          Verifying security credentials...
        </p>
      </div>
    );
  }

  // 1. Not Authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Suspended Account
  if (!user.isActive) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-container-lowest p-6 rounded-2xl shadow-lg border border-error-container text-center">
          <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px]">block</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Account Suspended</h2>
          <p className="text-sm text-secondary mt-2">
            Your account has been suspended by an administrator. Please contact BiteGo
            Operations Support for assistance.
          </p>
          <a
            href="/login"
            onClick={() => localStorage.removeItem("bitego_token")}
            className="mt-6 inline-block w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm"
          >
            Log Out
          </a>
        </div>
      </div>
    );
  }

  // 3. Verification Status Check for Merchant
  if (user.role === "merchant") {
    if (user.verificationStatus === "pending") {
      return <Navigate to="/verification-pending" replace />;
    }
    if (user.verificationStatus === "rejected") {
      return <Navigate to="/verification-rejected" replace />;
    }
  }

  // 4. Verification Status Check for Delivery
  if (user.role === "delivery") {
    if (user.verificationStatus === "pending") {
      return <Navigate to="/verification-pending" replace />;
    }
    if (user.verificationStatus === "rejected") {
      return <Navigate to="/verification-rejected" replace />;
    }
  }

  // 5. Role Hierarchy & Authorization
  if (allowedRoles && allowedRoles.length > 0) {
    // Super Admin has access to all admin routes
    const isSuperAdminAccessingAdmin =
      user.role === "superadmin" && allowedRoles.includes("admin");

    const hasDirectRole = allowedRoles.includes(user.role);

    if (!hasDirectRole && !isSuperAdminAccessingAdmin) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
