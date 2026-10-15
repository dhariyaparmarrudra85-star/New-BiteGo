import React from "react";

export default function ExecutiveHeader({ onActionToast, stats }) {
  return (
    <section className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/40">
      <div className="flex flex-col gap-space-xs">
        <div className="flex items-center gap-space-sm flex-wrap">
          <span className="font-label-sm text-label-sm font-bold uppercase tracking-widest text-primary bg-primary-fixed px-2.5 py-1 rounded-full">
            City Hub Operational Console
          </span>
          <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-tertiary font-bold bg-tertiary-fixed px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
            Live Synced • 3s Heartbeat
          </span>
        </div>
        <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight mt-1 font-bold">
          Platform Operations &amp; City Overview
        </h1>
        <p className="font-body-md text-body-md text-secondary">
          Live Ahmedabad Telemetry • Bodakdev, Vastrapur, Navrangpura &amp; SG Highway
        </p>
      </div>

      {/* Telemetry Tickers & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-md">
        {/* Live Barometer Capsule */}
        <div className="flex items-center gap-space-md bg-surface-container-low px-space-md py-2.5 rounded-xl border border-surface-container-high/50 no-scrollbar">
          <div className="flex flex-col whitespace-nowrap">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase">
              Dynamic Surge
            </span>
            <div className="flex items-center gap-1 text-primary font-label-lg text-label-lg font-bold">
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              1.4x Monsoon Active
            </div>
          </div>
          <div className="w-px h-8 bg-surface-container-high"></div>
          <div className="flex flex-col whitespace-nowrap">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase">
              Active Fleet
            </span>
            <div className="flex items-center gap-1 text-tertiary font-label-lg text-label-lg font-bold">
              <span className="material-symbols-outlined text-[18px]">two_wheeler</span>
              {stats ? `${stats.deliveryPartners} Registered` : "1,420 On-Duty"}
            </div>
          </div>
          <div className="w-px h-8 bg-surface-container-high"></div>
          <div className="flex flex-col whitespace-nowrap">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase">
              Total Orders
            </span>
            <div className="flex items-center gap-1 text-on-surface font-label-lg text-label-lg font-bold">
              <span className="material-symbols-outlined text-[18px]">local_shipping</span>
              {stats ? `${stats.orders} Platform Total` : "486 Recorded"}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-space-xs">
          <button
            onClick={() =>
              onActionToast &&
              onActionToast("Surge mode triggered for Ahmedabad Core")
            }
            className="h-11 px-space-md bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-xl shadow-sm transition-transform active:scale-95 flex items-center gap-2 cursor-pointer font-semibold"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">electric_bolt</span>
            <span>Trigger Surge</span>
          </button>
          <button
            onClick={() =>
              onActionToast && onActionToast("Daily summary export prepared")
            }
            className="h-11 px-space-sm bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer font-semibold"
            title="Export Daily Summary"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">file_download</span>
            <span className="hidden md:inline">Export</span>
          </button>
          <button
            onClick={() =>
              onActionToast && onActionToast("Fleet broadcast panel opened")
            }
            className="h-11 px-space-sm bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer font-semibold"
            title="Broadcast Fleet Notice"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">campaign</span>
            <span className="hidden md:inline">Broadcast</span>
          </button>
        </div>
      </div>
    </section>
  );
}
