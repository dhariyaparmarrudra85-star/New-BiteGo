import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminSidebar({
  mobileOpen,
  onClose,
  onActionToast,
  activeNav,
  onSelectTab,
}) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isRestaurantsActive =
    activeNav === "restaurants" ||
    location.pathname.startsWith("/admin/restaurants");
  const isApplicationsActive =
    activeNav === "applications" ||
    location.pathname.startsWith("/admin/applications");
  const isDashboardActive =
    (activeNav === "dashboard" ||
      location.pathname === "/admin" ||
      location.pathname.startsWith("/admin/dashboard")) &&
    !isRestaurantsActive &&
    !isApplicationsActive;

  const handleNavClick = (name) => {
    if (onActionToast) {
      onActionToast(`Navigating to ${name}`);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleLogout = () => {
    if (onActionToast) {
      onActionToast("Signed out of administrative console");
    }
    logout();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between overflow-y-auto no-scrollbar transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col">
          {/* Logo Header */}
          <div className="h-16 px-space-lg flex items-center justify-between gap-space-sm bg-surface-container-lowest border-b border-surface-container-high/40">
            <Link to="/admin/dashboard" className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-headline-sm text-headline-sm font-bold shadow-xs">
                B
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface leading-none">
                  BiteGo
                </span>
                <span className="font-label-sm text-label-sm tracking-wider uppercase text-on-surface-variant font-bold">
                  {user?.role === "superadmin" ? "SUPER ADMIN DESK" : "ADMIN OPERATIONS"}
                </span>
              </div>
            </Link>
            {/* Close button on mobile */}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Geo-Fence Selector */}
          <div className="px-space-md py-space-sm">
            <button
              type="button"
              onClick={() => onActionToast && onActionToast("Geo-fence selector: Ahmedabad Core active")}
              className="w-full text-left bg-surface-container-low p-space-sm rounded-xl hover:bg-surface-container transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-on-surface-variant mb-space-xs">
                <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider">
                  Active Geo-Fence
                </span>
                <span className="material-symbols-outlined text-[16px] text-tertiary">
                  location_on
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                  Ahmedabad Core
                </span>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                  unfold_more
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-space-md py-space-xs space-y-space-xs">
            {/* Super Admin Console Shortcut if Super Admin */}
            {user?.role === "superadmin" && (
              <div className="mb-2">
                <Link
                  to="/superadmin"
                  className="flex items-center justify-between px-space-md py-2.5 rounded-xl bg-purple-600 text-white font-bold shadow-xs hover:bg-purple-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                    <span className="text-sm">Super Admin Console</span>
                  </div>
                  <span className="bg-purple-800 text-purple-200 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                    ROOT
                  </span>
                </Link>
              </div>
            )}

            {/* Overview & Analytics */}
            <div className="px-space-sm pt-space-xs pb-space-xs font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              Overview & Analytics
            </div>
            <Link
              to="/admin/dashboard"
              className={`flex items-center justify-between px-space-md py-space-sm rounded-xl transition-colors ${
                isDashboardActive
                  ? "bg-primary-container text-on-primary-container font-bold shadow-xs"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="font-label-lg text-label-lg">Dashboard & Metrics</span>
            </Link>

            {/* Ecosystem Management */}
            <div className="px-space-sm pt-space-md pb-space-xs font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              Ecosystem Management
            </div>
            <Link
              to="/admin/applications"
              className={`flex items-center justify-between px-space-md py-space-sm rounded-xl transition-colors ${
                isApplicationsActive
                  ? "bg-primary-container text-on-primary-container font-bold shadow-xs"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="font-label-lg text-label-lg">Partner Applications</span>
              <span className="bg-amber-100 text-amber-800 font-label-sm text-label-sm px-space-sm py-0.5 rounded-full uppercase font-bold">
                Verification Desk
              </span>
            </Link>

            <Link
              to="/admin/restaurants"
              className={`flex items-center justify-between px-space-md py-space-sm rounded-xl transition-colors ${
                isRestaurantsActive
                  ? "bg-primary-container text-on-primary-container font-bold shadow-xs"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="font-label-lg text-label-lg">Restaurants & Directory</span>
              <span className="bg-error-container text-on-error-container font-label-sm text-label-sm px-space-sm py-0.5 rounded-full uppercase font-bold">
                Live Grid
              </span>
            </Link>

            <Link
              to="/admin?tab=delivery"
              onClick={() => {
                if (onSelectTab) onSelectTab("delivery");
                if (onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-space-md py-space-sm rounded-xl transition-colors ${
                activeNav === "delivery"
                  ? "bg-primary-container text-on-primary-container font-bold shadow-xs"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="font-label-lg text-label-lg">Delivery Fleet &amp; Radars</span>
              <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm px-space-sm py-0.5 rounded-full uppercase font-bold">
                Fleet Deck
              </span>
            </Link>

            <Link
              to="/admin?tab=customers"
              onClick={() => {
                if (onSelectTab) onSelectTab("customers");
                if (onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-space-md py-space-sm rounded-xl transition-colors ${
                activeNav === "customers"
                  ? "bg-primary-container text-on-primary-container font-bold shadow-xs"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="font-label-lg text-label-lg">Users &amp; Customers</span>
              <span className="bg-blue-100 text-blue-800 font-label-sm text-label-sm px-space-sm py-0.5 rounded-full uppercase font-bold">
                Directory
              </span>
            </Link>

            <Link
              to="/admin?tab=orders"
              onClick={() => {
                if (onSelectTab) onSelectTab("orders");
                if (onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-space-md py-space-sm rounded-xl transition-colors ${
                activeNav === "orders"
                  ? "bg-primary-container text-on-primary-container font-bold shadow-xs"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="font-label-lg text-label-lg">Live Order Dispatch</span>
              <span className="bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm px-space-sm py-0.5 rounded-full uppercase font-bold">
                Live Orders
              </span>
            </Link>

            {/* Commerce & Governance */}
            <div className="px-space-sm pt-space-md pb-space-xs font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              Commerce & Governance
            </div>
            <button
              type="button"
              onClick={() => handleNavClick("Payments & Settlements")}
              className="w-full flex items-center justify-between px-space-md py-space-sm rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            >
              <span className="font-label-lg text-label-lg">Payments & Settlements</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick("Offers & Promo Engine")}
              className="w-full flex items-center justify-between px-space-md py-space-sm rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            >
              <span className="font-label-lg text-label-lg">Offers & Promo Engine</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick("Reviews & Compliance")}
              className="w-full flex items-center justify-between px-space-md py-space-sm rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            >
              <span className="font-label-lg text-label-lg">Reviews & Compliance</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick("Platform Settings & Audit Logs")}
              className="w-full flex items-center justify-between px-space-md py-space-sm rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            >
              <span className="font-label-lg text-label-lg">Platform Settings & Audit Logs</span>
            </button>
          </nav>
        </div>

        {/* Node Status & Sign Out */}
        <div className="p-space-md bg-surface-container-lowest border-t border-surface-container-high/40">
          <div className="bg-surface-container-low p-space-sm rounded-xl mb-space-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                Node Status
              </span>
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface font-semibold truncate">
              MongoDB: Connected
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
              Signed in as: {user?.email || "Admin"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-between w-full px-space-md py-space-sm rounded-xl text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors font-medium cursor-pointer"
          >
            <span className="font-label-lg text-label-lg">Sign Out</span>
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
