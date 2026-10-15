import React from "react";

export default function UrgentActionPipeline({ onActionToast }) {
  return (
    <section className="flex flex-col gap-space-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-xs">
        <div className="flex items-center gap-space-xs flex-wrap">
          <span className="material-symbols-outlined text-primary text-[24px]">
            pending_actions
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
            Urgent Action Pipeline: Pending Onboarding Applications
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-bold uppercase ml-2">
            3 Queue Critical
          </span>
        </div>
        <span className="font-label-md text-label-md text-on-surface-variant">
          SLA Auto-escalation in 1h 40m
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
        {/* Card 1 */}
        <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-high/40 p-space-md flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
          <div>
            <div className="flex items-start justify-between gap-space-xs mb-space-xs">
              <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-bold uppercase">
                Cloud Kitchen Expansion
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                App ID: #APP-8841
              </span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">
              The Dark Roast Pizzeria
            </h3>
            <p className="font-label-md text-label-md text-primary font-semibold">
              Sindhu Bhavan Express Branch
            </p>

            <div className="mt-space-sm space-y-1.5 font-body-sm text-body-sm text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-on-surface">
                  person
                </span>
                <span>
                  Owner: <strong className="text-on-surface">Chef Vikram Patel</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-on-surface">
                  restaurant
                </span>
                <span>Italian • Gourmet Neapolitan Pizza</span>
              </div>
              <div className="flex items-center gap-1.5 text-tertiary font-semibold">
                <span className="material-symbols-outlined text-[16px]">
                  check_circle
                </span>
                <span>Hygiene Score: 96/100 (Pass • Video Audit)</span>
              </div>
            </div>

            {/* Submitted Doc Chips */}
            <div className="mt-space-md p-space-xs bg-surface-container-low rounded-lg space-y-1 border border-surface-container-high/30">
              <div className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant px-1">
                Verified Credentials
              </div>
              <div className="flex flex-wrap gap-1 font-label-sm text-label-sm">
                <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface">
                  FSSAI #108230049281
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface">
                  GSTIN 24AAECB1029P1Z2
                </span>
                <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed-variant font-semibold">
                  Bank Mandate OK
                </span>
              </div>
            </div>

            <div className="mt-space-sm flex items-center justify-between text-body-sm">
              <span className="text-on-surface-variant">Requested Commission:</span>
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                16.0%{" "}
                <span className="text-label-sm text-primary uppercase font-bold">
                  (Tier-1)
                </span>
              </span>
            </div>
          </div>

          <div className="mt-space-md pt-space-sm flex items-center gap-2 border-t border-surface-container-high/30">
            <button
              onClick={() =>
                onActionToast &&
                onActionToast("Restaurant approved and marked live.")
              }
              className="flex-1 h-10 rounded-xl bg-tertiary hover:bg-tertiary-container text-on-tertiary font-label-md text-label-md font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              Approve &amp; Live
            </button>
            <button
              onClick={() =>
                onActionToast &&
                onActionToast("Revision notice sent for #APP-8841")
              }
              className="h-10 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
              title="Request Document Revision"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
            </button>
            <button
              onClick={() =>
                onActionToast &&
                onActionToast("Application moved to rejection review.")
              }
              className="h-10 px-3 rounded-xl bg-error-container hover:bg-error hover:text-on-error text-on-error-container font-label-md text-label-md transition-colors cursor-pointer"
              title="Reject Application"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">block</span>
            </button>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-high/40 p-space-md flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-start justify-between gap-space-xs mb-space-xs">
              <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold uppercase">
                Heritage Dining
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                App ID: #APP-8843
              </span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">
              Shree Thaker Gujarati Dining
            </h3>
            <p className="font-label-md text-label-md text-secondary font-semibold">
              Ellis Bridge Flagship
            </p>

            <div className="mt-space-sm space-y-1.5 font-body-sm text-body-sm text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-on-surface">
                  person
                </span>
                <span>
                  Owner: <strong className="text-on-surface">Hitesh Shah</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-on-surface">
                  restaurant
                </span>
                <span>Authentic Pure-Veg Gujarati Thali</span>
              </div>
              <div className="flex items-center gap-1.5 text-tertiary font-semibold">
                <span className="material-symbols-outlined text-[16px]">gavel</span>
                <span>Legal Team Signoff: Complete &amp; Cleared</span>
              </div>
            </div>

            {/* Submitted Doc Chips */}
            <div className="mt-space-md p-space-xs bg-surface-container-low rounded-lg space-y-1 border border-surface-container-high/30">
              <div className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant px-1">
                Submitted Documentation
              </div>
              <div className="flex flex-wrap gap-1 font-label-sm text-label-sm">
                <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface">
                  FSSAI Valid 2027
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface">
                  Trade Cert #TC-991
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface">
                  Menu Proof Verified
                </span>
              </div>
            </div>

            <div className="mt-space-sm flex items-center justify-between text-body-sm">
              <span className="text-on-surface-variant">Assigned Commission:</span>
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                18.0%{" "}
                <span className="text-label-sm text-on-surface-variant uppercase font-bold">
                  (Standard)
                </span>
              </span>
            </div>
          </div>

          <div className="mt-space-md pt-space-sm flex items-center gap-2 border-t border-surface-container-high/30">
            <button
              onClick={() =>
                onActionToast &&
                onActionToast("Restaurant approved and marked live.")
              }
              className="flex-1 h-10 rounded-xl bg-tertiary hover:bg-tertiary-container text-on-tertiary font-label-md text-label-md font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              Approve &amp; Live
            </button>
            <button
              onClick={() =>
                onActionToast &&
                onActionToast("Viewing comprehensive onboarding report for #APP-8843")
              }
              className="h-10 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1 cursor-pointer font-semibold"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              Report
            </button>
          </div>
        </div>

        {/* Card 3: Missing Fire NOC (Compliance Blocker / Red) */}
        <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-error-container/60 p-space-md flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-start justify-between gap-space-xs mb-space-xs">
              <span className="px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold uppercase">
                Missing Fire NOC
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                App ID: #APP-8847
              </span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">
              Melted Cheese &amp; Fries
            </h3>
            <p className="font-label-md text-label-md text-error font-semibold">
              Delivery-Only Pod (Paldi Hub)
            </p>

            <div className="mt-space-sm space-y-1.5 font-body-sm text-body-sm text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-on-surface">
                  person
                </span>
                <span>
                  Owner: <strong className="text-on-surface">Aman Varma</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-on-surface">
                  fastfood
                </span>
                <span>Fast Food, Burgers &amp; Loaded Fries</span>
              </div>
              <div className="flex items-center gap-1.5 text-error font-semibold">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                <span>Pending Fire Safety Clearance certificate</span>
              </div>
            </div>

            {/* Alert box */}
            <div className="mt-space-md p-space-xs bg-error-container/40 rounded-lg space-y-1 border border-error-container">
              <div className="font-label-sm text-label-sm uppercase font-bold text-on-error-container px-1">
                Compliance Blocker
              </div>
              <p className="font-body-sm text-body-sm text-on-error-container px-1">
                Commercial extraction fan layout inspection failed on Nov 12. Re-test booked.
              </p>
            </div>

            <div className="mt-space-sm flex items-center justify-between text-body-sm">
              <span className="text-on-surface-variant">Target Commission:</span>
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                20.0%
              </span>
            </div>
          </div>

          <div className="mt-space-md pt-space-sm flex items-center gap-2 border-t border-surface-container-high/30">
            <button
              onClick={() =>
                onActionToast &&
                onActionToast("Compliance notification sent to merchant.")
              }
              className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">sms</span>
              Notify Merchant
            </button>
            <button
              onClick={() =>
                onActionToast &&
                onActionToast("Application placed on hold.")
              }
              className="h-10 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1 cursor-pointer font-semibold"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">pause_circle</span>
              Hold
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
