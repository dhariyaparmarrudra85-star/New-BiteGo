import React from "react";

export default function ClusterBanner({
  isOnDuty = true,
  onToggleDuty = () => {},
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-4 sm:p-5 shadow-sm border border-slate-100 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        {/* Left Cluster Information */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[26px]">radar</span>
          </div>

          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg sm:text-xl font-bold text-on-surface tracking-tight">
                Bodakdev &amp; Vastrapur Cluster
              </span>

              {/* 1.4x Surge Active Badge */}
              <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold flex items-center gap-1 shadow-xs">
                <span className="material-symbols-outlined text-[14px] text-primary animate-bounce">
                  local_fire_department
                </span>
                1.4x Surge Active
              </span>

              {/* Monsoon Peak Dinner Badge */}
              <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-xs font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-tertiary">
                  water_drop
                </span>
                Monsoon Peak Dinner
              </span>
            </div>

            {/* Shift Polling Status */}
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isOnDuty ? "bg-tertiary animate-ping" : "bg-amber-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isOnDuty ? "bg-tertiary" : "bg-amber-500"
                  }`}
                />
              </span>
              <p className="text-xs text-on-surface-variant font-medium">
                {isOnDuty
                  ? "Actively polling priority drops nearby SG Highway corridor • Shift 4h 15m"
                  : "Duty Paused • Break active. Incoming dispatch queue paused."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Surge Goal & Instant Match Toggle */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
          {/* Rain Surge Goal Widget */}
          <div className="bg-surface-container-low px-3.5 py-2 rounded-xl flex items-center gap-3 border border-slate-100">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                RAIN SURGE GOAL
              </span>
              <span className="text-xs font-bold text-on-surface">
                8 / 11 Trips (72%)
              </span>
            </div>
            <div className="w-16 bg-surface-container-highest h-2 rounded-full overflow-hidden">
              <div
                className="bg-tertiary h-full rounded-full transition-all duration-500"
                style={{ width: "72%" }}
              />
            </div>
            <span className="text-xs font-bold text-tertiary">
              +₹250
            </span>
          </div>

          {/* Instant Match / Break Toggle Button */}
          <button
            type="button"
            onClick={onToggleDuty}
            className={`h-10 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
              isOnDuty
                ? "bg-tertiary-container hover:bg-tertiary text-on-tertiary-container hover:text-white"
                : "bg-surface-container-high hover:bg-surface-container text-on-surface border border-slate-300/60"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isOnDuty ? "radio_button_checked" : "pause_circle"}
            </span>
            <span>
              {isOnDuty ? "Online • Instant Match" : "Paused • Break"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
