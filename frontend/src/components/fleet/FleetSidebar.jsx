import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function FleetSidebar({
  isOpen = false,
  onClose = () => {},
  isOnDuty = true,
  onToggleDuty = () => {},
}) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isActiveDelivery =
    location.pathname === "/fleet/active-delivery" ||
    location.pathname.startsWith("/fleet/active-delivery");

  const isDashboard =
    (location.pathname === "/fleet" ||
    location.pathname === "/fleet/dashboard" ||
    location.pathname === "/rider") &&
    !isActiveDelivery;

  const navItems = [
    {
      id: "radar-dashboard",
      label: "Radar & Dashboard",
      icon: "radar",
      path: "/fleet/dashboard",
      active: isDashboard,
    },
    {
      id: "active-delivery",
      label: "Active Delivery",
      icon: "navigation",
      path: "/fleet/active-delivery",
      active: isActiveDelivery,
    },
    {
      id: "delivery-history-trips",
      label: "Delivery History & Trips",
      icon: "history_toggle_off",
      path: "#",
      active: false,
    },
    {
      id: "payouts-earnings",
      label: "Payouts & Earnings (₹)",
      icon: "payments",
      path: "#",
      active: false,
    },
    {
      id: "performance-rating",
      label: "Performance & Rating",
      icon: "hotel_class",
      path: "#",
      active: false,
    },
    {
      id: "vehicle-ev-telemetry",
      label: "Vehicle & EV Telemetry",
      icon: "ev_station",
      path: "#",
      active: false,
    },
    {
      id: "fleet-support-sos",
      label: "Fleet Support & SOS",
      icon: "emergency_home",
      path: "#",
      active: false,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* 288px Fixed Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-surface-container-lowest z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] font-sans transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col">
          {/* Logo Header */}
          <div className="h-16 px-6 flex items-center justify-between bg-surface-container-low border-b border-slate-100">
            <Link to="/fleet/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
                <span className="material-symbols-outlined text-[20px]">
                  electric_moped
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-on-surface leading-tight">
                  BiteGo
                </span>
                <span className="text-[11px] uppercase tracking-wider text-primary font-bold">
                  Fleet Partner
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold uppercase tracking-wider">
                Rider v2.4
              </span>
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Close sidebar"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3.5 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = item.active;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm font-semibold ${
                    isActive
                      ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Actions */}
        <div className="p-3.5 bg-surface-container-low flex flex-col gap-3 border-t border-slate-100">
          {/* Profile Card */}
          <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">
                    person
                  </span>
                </div>
                <div className="flex flex-col truncate max-w-[120px]">
                  <span className="text-xs font-semibold text-on-surface truncate">
                    {user?.name || "Rajesh Vaghela"}
                  </span>
                  <span className="text-[11px] text-on-surface-variant truncate">
                    {user?.email || "Ather 450X EV"}
                  </span>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                {isOnDuty ? "Online" : "Paused"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100/60">
              <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-tertiary">
                  shield
                </span>
                Verified Fleet
              </span>
              <span className="text-xs text-on-surface font-bold">
                4.9 ★
              </span>
            </div>
          </div>

          {/* Quick Duty & SOS Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleDuty}
              className="flex-1 h-9 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-tertiary">
                {isOnDuty ? "toggle_on" : "toggle_off"}
              </span>
              <span>{isOnDuty ? "On Duty" : "Off Duty"}</span>
            </button>

            <button
              type="button"
              onClick={() => alert("SOS Emergency Dispatch triggered! Live GPS sent to BiteGo Control Room.")}
              className="h-9 px-3 rounded-lg bg-error text-on-error hover:bg-red-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">sos</span>
              <span>SOS</span>
            </button>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={logout}
            className="w-full h-8 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Sign Out Fleet Account</span>
          </button>
        </div>
      </aside>
    </>
  );
}
