import React from "react";

export default function EVTelemetry({
  onRouteClick = () => {},
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col gap-3.5 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[18px]">
              ev_station
            </span>
          </div>
          <div>
            <span className="text-sm font-bold text-on-surface block leading-tight">
              Ather 450X EV
            </span>
            <span className="text-[11px] text-on-surface-variant">
              GJ-01-ET-9182 • Rajesh
            </span>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold">
          Healthy
        </span>
      </div>

      {/* Telemetry Indicators Grid */}
      <div className="grid grid-cols-3 gap-2 mt-0.5">
        <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col border border-slate-100/80">
          <span className="text-[11px] text-on-surface-variant font-medium">
            Battery
          </span>
          <span className="font-extrabold text-tertiary text-base mt-0.5">
            78%
          </span>
          <span className="text-[10px] text-on-surface-variant font-medium">
            68 km safe
          </span>
        </div>

        <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col border border-slate-100/80">
          <span className="text-[11px] text-on-surface-variant font-medium">
            Tyre PSI
          </span>
          <span className="font-extrabold text-on-surface text-base mt-0.5">
            30 / 32
          </span>
          <span className="text-[10px] text-on-surface-variant font-medium">
            Optimal
          </span>
        </div>

        <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col border border-slate-100/80">
          <span className="text-[11px] text-on-surface-variant font-medium">
            Motor Temp
          </span>
          <span className="font-extrabold text-on-surface text-base mt-0.5">
            42°C
          </span>
          <span className="text-[10px] text-on-surface-variant font-medium">
            Nominal
          </span>
        </div>
      </div>

      {/* Nearest Fast Charging Station */}
      <div className="bg-surface-container-high/60 p-2.5 rounded-xl flex items-center justify-between gap-2 border border-slate-200/50">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
            ev_charger
          </span>
          <div className="min-w-0">
            <span className="text-xs font-bold text-on-surface truncate block">
              Ather Grid Bodakdev Hub
            </span>
            <span className="text-[11px] text-on-surface-variant truncate block font-medium">
              1.1 km away • 2 slots available
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onRouteClick}
          className="px-3 py-1 rounded-lg bg-surface-container-lowest text-on-surface text-xs font-bold shadow-xs shrink-0 hover:bg-surface-container transition-colors cursor-pointer border border-slate-200/60"
        >
          Route
        </button>
      </div>
    </div>
  );
}
