import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function AdminHeader({ onToggleMobileMenu, onActionToast }) {
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState("");

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && searchValue.trim()) {
      if (onActionToast) {
        onActionToast(`Searching for: "${searchValue}"`);
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-space-lg flex items-center justify-between gap-space-md border-b border-surface-container-high/30">
      {/* Mobile Hamburger + Left Search Area */}
      <div className="flex items-center gap-space-md flex-1 max-w-2xl">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-on-surface-variant hover:bg-surface-container"
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <div className="hidden xl:flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1.5 rounded-xl border border-surface-container-high/50">
          <span className="material-symbols-outlined text-[18px] text-primary">
            travel_explore
          </span>
          <span className="font-body-sm text-body-sm text-on-surface font-semibold max-w-[200px] truncate">
            Ahmedabad (Bodakdev, Vastrapur...)
          </span>
        </div>

        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            className="w-full h-11 pl-10 pr-4 bg-surface-container-low rounded-xl text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/40 border border-transparent focus:border-primary/30 transition-all"
            placeholder="Search orders, merchants, couriers, users, transactions (⌘K)"
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-space-md">
        <div className="hidden lg:flex items-center gap-space-xs bg-tertiary-fixed px-space-sm py-1 rounded-full text-on-tertiary-fixed-variant">
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
          <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider">
            System Operational (99.98% SLA)
          </span>
        </div>

        <div className="flex items-center gap-space-xs">
          <button
            onClick={() => onActionToast && onActionToast("Surge override controls opened")}
            className="h-10 px-space-sm bg-surface-container-high hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors text-on-surface rounded-xl font-label-sm text-label-sm uppercase font-bold flex items-center gap-1 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">electric_bolt</span>
            <span className="hidden sm:inline">Surge Override</span>
          </button>

          <button
            onClick={() => onActionToast && onActionToast("Broadcast alert panel opened")}
            className="h-10 px-space-sm bg-error-container hover:bg-error hover:text-on-error transition-colors text-on-error-container rounded-xl font-label-sm text-label-sm uppercase font-bold flex items-center gap-1 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">campaign</span>
            <span className="hidden sm:inline">Broadcast Alert</span>
          </button>
        </div>

        <button
          onClick={() => onActionToast && onActionToast("Platform notifications: 3 unread system alerts")}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors relative cursor-pointer"
          type="button"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
        </button>

        <div className="flex items-center gap-space-sm pl-space-xs">
          <div className="hidden md:flex flex-col text-right">
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              {user?.name || "BiteGo Administrator"}
            </span>
            <span className="font-label-sm text-label-sm text-primary font-bold uppercase">
              {user?.role === "superadmin" ? "SUPER ADMIN" : "ADMIN OPERATIONS"}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
