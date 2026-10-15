import React, { useState, useRef } from "react";

export default function DeliveryOtp({
  onShowToast = () => {},
  onVerifyOtp = null,
  order = null,
}) {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const status = order?.orderStatus || "OUT_FOR_DELIVERY";
  const customerName = order?.customer?.name || order?.deliveryAddress?.fullName || order?.user?.name || "Customer";
  const isDelivered = status === "DELIVERED" || isCompleted;
  const isReadyForOtp = status === "OUT_FOR_DELIVERY";

  const handleInputChange = (index, value) => {
    if (!isReadyForOtp || isDelivered) return;
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);

    // Auto-advance to next input
    if (cleaned && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleCompleteDelivery = async () => {
    if (!isReadyForOtp && !isDelivered) {
      onShowToast("Order must be Out for Delivery before verifying OTP.", "warning", true);
      return;
    }
    const fullOtp = otp.join("");
    if (fullOtp.length < 4) {
      onShowToast("Please enter complete 4-digit OTP from customer", "error", true);
      return;
    }

    if (onVerifyOtp) {
      setLoading(true);
      try {
        const success = await onVerifyOtp(fullOtp);
        if (success) {
          setIsCompleted(true);
        } else {
          setOtp(["", "", "", ""]);
          inputRefs[0].current?.focus();
        }
      } finally {
        setLoading(false);
      }
    } else {
      onShowToast("Delivery Confirmed! ₹145 credited to Wallet.", "celebration");
      setTimeout(() => {
        setIsCompleted(true);
      }, 500);
    }
  };

  const handleGateIssue = () => {
    onShowToast("Fleet Support notified: Gate escort protocol initiated", "shield_with_heart");
  };

  return (
    <div className="w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-md border border-slate-100 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[22px] text-primary">
            pin
          </span>
          <span className="text-base font-bold text-on-surface">
            Customer Delivery OTP
          </span>
        </div>
        <span className="text-xs text-on-surface-variant font-medium">
          Ask {customerName} for 4-digit code
        </span>
      </div>

      {!isReadyForOtp && !isDelivered && (
        <div className="mt-3 p-3 rounded-xl bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">info</span>
          <span>OTP verification unlocks once you click <strong>"Start Delivery"</strong> and are en route to {customerName}.</span>
        </div>
      )}

      {/* 4-Digit OTP Inputs */}
      <div className="mt-4 flex items-center justify-center gap-2.5 sm:gap-3">
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={inputRefs[idx]}
            type="text"
            inputMode="numeric"
            maxLength={1}
            disabled={!isReadyForOtp || isDelivered || loading}
            value={digit}
            onChange={(e) => handleInputChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl text-center text-xl sm:text-2xl font-bold transition-all border outline-none ${
              isDelivered
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : !isReadyForOtp
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                : "bg-surface-container-low text-on-surface border-slate-200/80 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            }`}
          />
        ))}
      </div>

      {/* Auto-Matched Token Notice */}
      <div className="flex items-center justify-center gap-1.5 mt-2.5 text-xs text-tertiary font-medium">
        <span className="material-symbols-outlined text-[16px]">
          check_circle
        </span>
        <span>Secure OTP verification directly with customer</span>
      </div>

      {/* Handover Confirmation Buttons */}
      <div className="mt-4 flex flex-col gap-2.5">
        <button
          type="button"
          id="completeDeliveryBtn"
          disabled={!isReadyForOtp || isDelivered || loading}
          onClick={handleCompleteDelivery}
          className={`w-full h-13 sm:h-14 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] ${
            isDelivered
              ? "bg-tertiary-container text-on-tertiary-container shadow-emerald-600/20 cursor-default"
              : !isReadyForOtp
              ? "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none"
              : "bg-primary hover:bg-primary-container text-on-primary shadow-primary/20 hover:shadow-lg cursor-pointer"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">
            {isDelivered ? "verified" : "task_alt"}
          </span>
          <span>
            {isDelivered
              ? "Delivery Completed & Verified"
              : loading
              ? "Verifying OTP..."
              : "Complete Delivery & Verify OTP"}
          </span>
        </button>

        <button
          type="button"
          id="gateIssueBtn"
          onClick={handleGateIssue}
          className="w-full h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200/60"
        >
          <span className="material-symbols-outlined text-[18px] text-error">
            report_problem
          </span>
          <span>Customer Unreachable / Gate Access Issue</span>
        </button>
      </div>
    </div>
  );
}
