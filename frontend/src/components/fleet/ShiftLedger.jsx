import React from "react";

export default function ShiftLedger({
  onPayoutClick = () => {},
  stats = {},
}) {
  const base = stats.todayBreakdown?.base !== undefined ? stats.todayBreakdown.base : 680;
  const surge = stats.todayBreakdown?.surge !== undefined ? stats.todayBreakdown.surge : 300;
  const tip = stats.todayBreakdown?.tip !== undefined ? stats.todayBreakdown.tip : 120;
  const netTotal = stats.todayEarnings !== undefined ? stats.todayEarnings : (base + surge + tip);

  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col gap-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100/80">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">
            account_balance_wallet
          </span>
          <span className="text-base font-bold text-on-surface">
            Shift Ledger
          </span>
        </div>
        <span className="text-[11px] uppercase tracking-wider text-tertiary font-bold">
          LIVE SYNC
        </span>
      </div>

      {/* Breakdown Rows */}
      <div className="flex flex-col divide-y divide-surface-container-low text-xs">
        <div className="py-2.5 flex items-center justify-between">
          <span className="text-on-surface-variant font-medium">
            Base Delivery Compensation
          </span>
          <span className="font-semibold text-on-surface">
            ₹{base.toFixed(2)}
          </span>
        </div>

        <div className="py-2.5 flex items-center justify-between">
          <span className="text-on-surface-variant font-medium flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-primary">
              local_fire_department
            </span>
            Surge Multipliers (Rain / Peak)
          </span>
          <span className="font-semibold text-primary">
            ₹{surge.toFixed(2)}
          </span>
        </div>

        <div className="py-2.5 flex items-center justify-between">
          <span className="text-on-surface-variant font-medium flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-amber-500">
              favorite
            </span>
            Customer Tips (100% Passed)
          </span>
          <span className="font-semibold text-on-surface">
            ₹{tip.toFixed(2)}
          </span>
        </div>

        {/* Net Balance Total */}
        <div className="pt-3.5 flex items-baseline justify-between">
          <span className="text-sm font-bold text-on-surface">
            Today Net Balance Ready
          </span>
          <span className="text-2xl font-extrabold text-on-surface tracking-tight">
            ₹{netTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Payout Trigger Button */}
      <button
        type="button"
        onClick={onPayoutClick}
        className="w-full h-11 rounded-xl bg-tertiary hover:bg-tertiary-container text-on-tertiary hover:text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-[18px]">
          currency_rupee
        </span>
        <span>Instant Payout to UPI (₹1,420)</span>
      </button>
    </div>
  );
}
