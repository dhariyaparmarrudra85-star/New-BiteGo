import React, { useState } from "react";

export default function CommissionInspectorDrawer({
  isOpen,
  onClose,
  onSave,
  restaurant,
}) {
  const defaultRate =
    restaurant && restaurant.commission
      ? parseFloat(restaurant.commission.replace("%", "")) || 18.0
      : 18.0;

  const [commissionRate, setCommissionRate] = useState(defaultRate);
  const [prevRestaurant, setPrevRestaurant] = useState(restaurant);

  if (restaurant !== prevRestaurant) {
    setPrevRestaurant(restaurant);
    setCommissionRate(defaultRate);
  }

  const targetRestaurant = restaurant || {
    id: "REST-0192",
    name: "The Dark Roast Pizzeria",
    emoji: "🍕",
    hub: "Bodakdev Hub",
    fssaiStatus: "Approved ✓",
    payoutEst: "₹68,450",
    bank: "HDFC Bank ••9012",
  };

  const handleSave = () => {
    if (onSave) {
      onSave(commissionRate, targetRestaurant);
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 backdrop-blur-xs transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Side Inspector Preview / Drawer Overlay */}
      <aside
        className={`fixed right-0 top-0 h-full w-96 max-w-[90vw] bg-surface-container-lowest shadow-2xl z-50 transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 flex flex-col justify-between border-l border-surface-container-high/40`}
        id="quick-drawer"
      >
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
          {/* Drawer Header */}
          <div className="p-space-lg bg-surface-container-low flex items-center justify-between border-b border-surface-container-high/40">
            <div>
              <span className="font-label-sm text-label-sm uppercase font-bold text-primary tracking-wider">
                Merchant Governance
              </span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Commission &amp; Settlement Inspector
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              type="button"
              aria-label="Close Drawer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Drawer Content Body */}
          <div className="p-space-lg space-y-space-lg flex-1">
            {/* Target Merchant Profile */}
            <div className="p-space-md rounded-xl bg-surface-container-low space-y-2 border border-surface-container-high/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-headline-sm shadow-xs">
                  {targetRestaurant.emoji || "🍕"}
                </div>
                <div>
                  <p className="font-label-lg text-label-lg font-bold text-on-surface">
                    {targetRestaurant.name}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Outlet ID: #{targetRestaurant.id} (
                    {targetRestaurant.hub || "Bodakdev Hub"})
                  </p>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between text-label-sm text-label-sm font-semibold border-t border-surface-container-high/40">
                <span className="text-tertiary">FSSAI Status: Approved ✓</span>
                <span className="text-on-surface">GSTIN Verified</span>
              </div>
            </div>

            {/* Commission Rate Slider Control */}
            <div className="space-y-space-sm">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wide">
                  Base Platform Commission
                </label>
                <span
                  className="font-headline-sm text-headline-sm text-primary font-bold"
                  id="rate-display"
                >
                  {Number(commissionRate).toFixed(1)}%
                </span>
              </div>

              <input
                className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                id="rate-slider"
                max="25"
                min="15"
                step="0.5"
                type="range"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
              />

              <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant font-semibold">
                <span>15.0% (Tier 1 Preferred)</span>
                <span>20.0% (Standard)</span>
                <span>25.0% (High Support)</span>
              </div>
            </div>

            {/* Surcharge & Fee Parameters */}
            <div className="space-y-space-sm">
              <label className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wide">
                Transaction Surcharges
              </label>
              <div className="p-space-md rounded-xl bg-surface-container-low space-y-3 border border-surface-container-high/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-label-md text-label-md font-semibold text-on-surface">
                      Payment Gateway (PG)
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Merchant Absorbed Rate
                    </p>
                  </div>
                  <span className="font-label-lg text-label-lg font-bold text-on-surface font-tabular-nums text-tabular-nums">
                    1.8%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-label-md text-label-md font-semibold text-on-surface">
                      Packaging Fee Handling
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Rule for takeaway boxes
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold">
                    Merchant Retained
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-label-md text-label-md font-semibold text-on-surface">
                      Auto-Settlement Channel
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      T+1 via RazorpayX Escrow
                    </p>
                  </div>
                  <span className="text-tertiary font-label-sm text-label-sm font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>{" "}
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Next Payout Notice */}
            <div className="p-space-md rounded-xl bg-surface-container-high text-on-surface space-y-1 border border-surface-container-highest">
              <div className="flex items-center gap-1.5 font-label-sm text-label-sm uppercase font-bold text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  schedule
                </span>
                Next Scheduled Batch Transfer
              </div>
              <p className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Tomorrow 06:00 AM
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Estimated Payout:{" "}
                <strong className="text-on-surface">
                  {targetRestaurant.payoutEst || "₹68,450"}
                </strong>{" "}
                ({targetRestaurant.bank || "HDFC Bank ••9012"})
              </p>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-space-lg bg-surface-container-low flex items-center gap-2 border-t border-surface-container-high/40">
            <button
              onClick={handleSave}
              className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              type="button"
            >
              Save Adjustments
            </button>
            <button
              onClick={onClose}
              className="h-11 px-4 rounded-xl bg-surface-container-high text-on-surface font-label-lg text-label-lg hover:bg-surface-container-highest transition-colors cursor-pointer font-semibold"
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
