import React from "react";

export default function FinancialClearance({ order = null }) {
  const isCod = order?.paymentMethod === "cod";
  const collectAmount = isCod && order?.totalAmount ? `₹${order.totalAmount.toFixed(2)}` : "₹ 0.00";
  const paymentMethodText = isCod ? "Collect Cash on Delivery (COD)" : `Prepaid Online via ${(order?.paymentMethod || "UPI").toUpperCase()}`;
  const baseFare = order?.deliveryFee ? order.deliveryFee : 65;
  const totalPayout = order?.deliveryFee ? (order.deliveryFee + 45) : 145;

  return (
    <div className="w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-base font-bold text-on-surface">
          Collect from Customer
        </span>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
          isCod ? "bg-amber-100 text-amber-900" : "bg-tertiary-fixed text-on-tertiary-fixed"
        }`}>
          {isCod ? "Cash Collection Mandatory" : "No Cash Required"}
        </span>
      </div>

      {/* Payment Status Box */}
      <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between mt-2 border border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className={`material-symbols-outlined text-[20px] ${isCod ? "text-amber-600" : "text-tertiary"}`}>
            {isCod ? "payments" : "task_alt"}
          </span>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-bold text-on-surface">
              {paymentMethodText}
            </span>
            <span className="text-[11px] text-on-surface-variant font-medium">
              {isCod ? "Collect exact cash before OTP" : "Payment cleared through gateway"}
            </span>
          </div>
        </div>
        <span className="text-base sm:text-lg font-extrabold text-on-surface">
          {collectAmount}
        </span>
      </div>

      {/* Rider Trip Earnings Summary Card */}
      <div className="mt-3 p-3.5 rounded-xl bg-surface-container-low border border-slate-100">
        <span className="text-[11px] text-on-surface-variant uppercase font-bold tracking-wider block">
          Earnings Credited Upon Completion
        </span>

        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
          <span className="text-on-surface-variant">Base Fare:</span>
          <span className="text-right font-semibold text-on-surface">₹65.00</span>

          <span className="text-on-surface-variant">Distance (3.8 km):</span>
          <span className="text-right font-semibold text-on-surface">₹35.00</span>

          <span className="text-on-surface-variant">Peak Hour Surge:</span>
          <span className="text-right font-semibold text-on-surface">₹30.00</span>

          <span className="text-primary font-medium">Customer Tip (Ananya):</span>
          <span className="text-right font-semibold text-primary">₹15.00</span>
        </div>

        <div className="mt-2.5 pt-2 flex items-center justify-between bg-surface-container-lowest p-2.5 rounded-lg border border-slate-100">
          <span className="text-xs sm:text-sm font-bold text-on-surface">
            Total Courier Payout
          </span>
          <span className="text-base sm:text-lg font-bold text-primary">
            ₹145.00
          </span>
        </div>
      </div>
    </div>
  );
}
