import React from "react";

export default function FleetHeader({
  onOpenSidebar = () => {},
  isOnDuty = true,
  onShowNotification = () => {},
}) {
  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-4 sm:px-6 border-b border-slate-100 font-sans">
      {/* Left: Mobile Toggle & Hub / Battery Status */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        {/* Hub Selector Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface border border-slate-200/50">
          <span className="material-symbols-outlined text-[18px] text-primary">
            pin_drop
          </span>
          <span className="text-xs font-semibold text-on-surface">
            Ahmedabad Hub:
          </span>
          <span className="text-xs text-on-surface-variant hidden sm:inline">
            Bodakdev &amp; SG Highway
          </span>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
            expand_more
          </span>
        </div>

        {/* EV Battery Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tertiary-container text-on-tertiary-container text-xs font-bold shadow-xs">
          <span className="material-symbols-outlined text-[16px]">
            battery_charging_full
          </span>
          <span className="font-semibold tracking-wide">
            78% (68 km)
          </span>
        </div>
      </div>

      {/* Right: Rain Incentive, Duty State, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Incentive Pill (xl screens) */}
        <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold border border-[#ffdad3]">
          <span className="material-symbols-outlined text-[16px] text-primary">
            local_fire_department
          </span>
          <span>
            3 more deliveries for <strong className="font-bold text-[#b12408]">₹250</strong> incentive
          </span>
        </div>

        {/* Live Duty Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface text-xs font-bold border border-slate-200/60">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnDuty ? "bg-tertiary animate-pulse" : "bg-amber-500"
            }`}
          />
          <span>{isOnDuty ? "DUTY: ONLINE" : "DUTY: PAUSED"}</span>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={onShowNotification}
          className="relative w-9 h-9 rounded-lg bg-surface-container-low hover:bg-surface-container-high hover:text-on-surface text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Fleet notifications"
        >
          <span className="material-symbols-outlined text-[20px]">
            notifications
          </span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-white" />
        </button>

        {/* Rider Profile Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-xs">
          <span className="material-symbols-outlined text-[18px]">
            person
          </span>
        </div>
      </div>
    </header>
  );
}
