import React from "react";

export default function FleetRadar() {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col font-sans">
      {/* Radar Panel Header */}
      <div className="p-4 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="material-symbols-outlined text-primary text-[20px]">
            explore
          </span>
          <span className="text-base sm:text-lg font-bold text-on-surface">
            Live Fleet Radar
          </span>
          <span className="text-xs text-on-surface-variant font-medium">
            SG Highway • Sindhu Bhavan Junction
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-lg bg-surface-container-lowest text-on-surface text-xs font-semibold shadow-xs flex items-center gap-1.5 border border-slate-100">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            High Surge Zones
          </span>
        </div>
      </div>

      {/* Radar Canvas Box */}
      <div className="relative w-full h-80 sm:h-96 bg-surface-container-high overflow-hidden select-none">
        {/* Stylized Road Grid Overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-35"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="city-grid"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="#575e70"
                strokeWidth="0.8"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#city-grid)" />
          {/* Diagonal Arterial Roads */}
          <line
            x1="0"
            y1="20"
            x2="100%"
            y2="340"
            stroke="#8f706a"
            strokeOpacity="0.5"
            strokeWidth="4"
          />
          <line
            x1="120"
            y1="0"
            x2="280"
            y2="400"
            stroke="#8f706a"
            strokeOpacity="0.4"
            strokeWidth="3"
          />
          <line
            x1="0"
            y1="180"
            x2="100%"
            y2="180"
            stroke="#8f706a"
            strokeOpacity="0.6"
            strokeWidth="5"
          />
        </svg>

        {/* Hotspot 1: Bodakdev (1.4x) */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="absolute w-44 h-44 rounded-full bg-primary/10 animate-ping duration-1000" />
          <div className="absolute w-32 h-32 rounded-full bg-primary/20" />
          <div className="relative px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-md flex items-center gap-1.5 whitespace-nowrap">
            <span className="material-symbols-outlined text-[15px]">
              local_fire_department
            </span>
            Bodakdev Hub 1.4x
          </div>
        </div>

        {/* Hotspot 2: Vastrapur Lake Hub (1.3x) */}
        <div className="absolute top-1/3 right-1/4 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full bg-primary/15" />
          <div className="relative px-2.5 py-1 rounded-full bg-surface-container-lowest text-primary text-xs font-bold shadow-md flex items-center gap-1 whitespace-nowrap border border-slate-100">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Vastrapur 1.3x
          </div>
        </div>

        {/* Hotspot 3: Prahlad Nagar (1.2x) */}
        <div className="absolute bottom-[20%] left-1/4 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="relative px-2.5 py-1 rounded-full bg-surface-container-lowest text-on-surface text-xs font-semibold shadow-sm flex items-center gap-1 whitespace-nowrap border border-slate-100">
            <span className="material-symbols-outlined text-[13px] text-tertiary">
              bolt
            </span>
            Prahlad Nagar 1.2x
          </div>
        </div>

        {/* Courier Current Pin (Rajesh Vaghela) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-12 h-12 rounded-full bg-tertiary/20 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-[18px]">
                electric_moped
              </span>
            </div>
          </div>
          <span className="mt-1 px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface text-xs font-bold shadow-sm whitespace-nowrap border border-slate-100">
            YOU (Rajesh)
          </span>
        </div>

        {/* Floating Pinpointing Card on Radar */}
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm bg-surface-container-lowest/95 backdrop-blur-md p-3 rounded-xl shadow-lg z-30 border border-slate-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">
                  restaurant
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-on-surface truncate">
                  The Dark Roast Pizzeria
                </div>
                <div className="text-[11px] text-on-surface-variant truncate">
                  0.8 km from your location • Bodakdev
                </div>
              </div>
            </div>
            <span className="px-2 py-1 rounded-md bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold shrink-0">
              ₹145.00
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
