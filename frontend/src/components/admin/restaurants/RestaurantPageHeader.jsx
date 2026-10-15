import React from "react";

export default function RestaurantPageHeader({
  onExportLedger,
  onBulkCommission,
  onRegisterOutlet,
}) {
  return (
    <section className="flex flex-col gap-space-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider font-bold mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
            Super Admin Console • Central Gujarat Cluster
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
            Restaurant Partner Directory &amp; Verification Desk
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl mt-1">
            Manage merchant onboarding, FSSAI compliance, health inspection
            certifications, commission margins, and operational dispatch
            availability.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-space-xs">
          <button
            onClick={onExportLedger}
            className="h-11 px-space-md rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-lg text-label-lg flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer font-semibold"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
              file_download
            </span>
            <span>Export Ledger (CSV)</span>
          </button>

          <button
            onClick={onBulkCommission}
            className="h-11 px-space-md rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-lg text-label-lg flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer font-semibold"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
              percent
            </span>
            <span>Bulk Commission</span>
          </button>

          <button
            onClick={onRegisterOutlet}
            className="h-11 px-space-lg rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer font-semibold"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">add_business</span>
            <span>+ Register New Outlet</span>
          </button>
        </div>
      </div>
    </section>
  );
}
