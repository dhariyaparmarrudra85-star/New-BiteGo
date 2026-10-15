import React from "react";

export default function OperationsCards({ onActionToast }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
      {/* Panel 1: Commission Settlements */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high/40 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">
              Settlements Pending
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">
              ₹3,42,100
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Payable to 142 Active Merchants
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">account_balance</span>
          </div>
        </div>
        <div className="mt-space-md pt-space-sm border-t border-surface-container-high flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-secondary font-medium">
            Batch 23:59 IST
          </span>
          <button
            onClick={() =>
              onActionToast &&
              onActionToast("Batch payout execution queued for 23:59 IST")
            }
            className="h-8 px-space-sm bg-tertiary hover:bg-tertiary-container text-on-tertiary font-label-sm text-label-sm uppercase font-bold rounded-lg transition-transform active:scale-95 cursor-pointer"
            type="button"
          >
            Execute Batch Payout
          </button>
        </div>
      </div>

      {/* Panel 2: Fraud & Risk Monitor */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high/40 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">
              Fraud &amp; Abuse Shield
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Zero Threats
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              0 suspicious chargebacks in last 24h
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">security</span>
          </div>
        </div>
        <div className="mt-space-md pt-space-sm border-t border-surface-container-high flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-tertiary font-bold">
            Geofence Integrity 100%
          </span>
          <button
            onClick={() =>
              onActionToast && onActionToast("Loading fraud & abuse risk logs...")
            }
            className="font-label-sm text-label-sm text-primary font-bold hover:underline cursor-pointer"
            type="button"
          >
            Audit Risk Logs →
          </button>
        </div>
      </div>

      {/* Panel 3: Server & Gateway Health */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high/40 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">
              Gateway Telemetry
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">
              99.98% Healthy
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Razorpay UPI • Twilio • AWS Mumbai
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">dns</span>
          </div>
        </div>
        <div className="mt-space-md pt-space-sm border-t border-surface-container-high flex items-center justify-between font-label-sm text-label-sm">
          <div className="flex items-center gap-3 text-secondary">
            <span>
              UPI: <strong className="text-tertiary font-bold">99.9%</strong>
            </span>
            <span>
              SMS: <strong className="text-tertiary font-bold">100%</strong>
            </span>
            <span>
              AWS: <strong className="text-on-surface font-bold">42ms</strong>
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-tertiary"></span>
        </div>
      </div>
    </section>
  );
}
