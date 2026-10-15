import React from "react";

export default function CustomerDropoff({
  onShowToast = () => {},
  order = null,
}) {
  const customerName = order?.customer?.name || order?.deliveryAddress?.fullName || order?.user?.name || "Customer";
  const initials = customerName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "CU";
  const addressLine = order?.deliveryAddress?.houseFlat ? `${order.deliveryAddress.houseFlat}, ${order.deliveryAddress.areaLocality || order.deliveryAddress.landmark || ""}` : (order?.deliveryAddress?.addressLine || "Customer Address");
  const city = order?.deliveryAddress?.city ? `${order.deliveryAddress.city} - ${order.deliveryAddress.postalCode || order.deliveryAddress.pincode || ""}` : (order?.deliveryAddress?.city || "Ahmedabad");
  const phone = order?.customer?.phone || order?.deliveryAddress?.phone || order?.user?.phone || "+91 98250 ••••";
  const instructions = order?.deliveryInstructions || "Deliver to customer doorstep directly.";

  const handleCall = () => {
    onShowToast(`Connecting via Secure Masked Caller to ${customerName} (${phone})`);
  };

  const handleChat = () => {
    onShowToast(`Opening Live In-App Chat window with ${customerName}...`);
  };

  const handleQuickMessage = (text) => {
    onShowToast(`Quick notification dispatched to ${customerName}: "${text}"`);
  };

  return (
    <div className="w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 font-sans">
      {/* Customer Header */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-lg shrink-0">
            {initials}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-on-surface">
                {customerName}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold">
                Gold
              </span>
            </div>
            <span className="text-xs text-on-surface-variant flex items-center gap-1 font-medium mt-0.5">
              <span className="material-symbols-outlined text-[15px] text-tertiary">
                verified_user
              </span>
              Verified Patron • 4.9 Rating
            </span>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold shrink-0">
          Drop-off Point
        </span>
      </div>

      {/* Full Address Box */}
      <div className="mt-3 p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-2 border border-slate-100">
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
            location_on
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-on-surface">
              {addressLine}
            </span>
            <span className="text-xs text-on-surface-variant">
              {city}
            </span>
            <span className="text-[11px] text-secondary font-semibold mt-0.5">
              Contact: {phone}
            </span>
          </div>
        </div>

        {/* Customer Instructions Banner */}
        <div className="p-3 rounded-lg bg-surface-container-lowest flex items-start gap-2 border border-slate-200/50">
          <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
            speaker_notes
          </span>
          <div className="flex flex-col">
            <span className="text-xs text-on-surface font-bold">
              Delivery Instruction:
            </span>
            <span className="text-xs text-on-surface-variant italic">
              "{instructions}"
            </span>
          </div>
        </div>
      </div>

      {/* High-Contrast 1-Tap Customer Contact Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <button
          type="button"
          id="callBtn"
          onClick={handleCall}
          className="h-12 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-xs cursor-pointer border border-slate-200/50"
        >
          <span className="material-symbols-outlined text-[20px] text-tertiary">
            call
          </span>
          <span>Call Customer</span>
        </button>

        <button
          type="button"
          id="chatBtn"
          onClick={handleChat}
          className="h-12 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-xs cursor-pointer border border-slate-200/50"
        >
          <span className="material-symbols-outlined text-[20px] text-primary">
            chat
          </span>
          <span>Send Quick Chat</span>
        </button>
      </div>

      {/* Quick SMS Shortcut Chips */}
      <div className="flex items-center gap-2 mt-2.5 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => handleQuickMessage("I have arrived at the society gate!")}
          className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border border-slate-200/50"
        >
          "Arrived at gate"
        </button>

        <button
          type="button"
          onClick={() => handleQuickMessage("Taking the elevator to 4th floor now.")}
          className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border border-slate-200/50"
        >
          "Coming up in lift"
        </button>

        <button
          type="button"
          onClick={() => handleQuickMessage("Security verifying entry. 2 mins!")}
          className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border border-slate-200/50"
        >
          "Security clearance"
        </button>
      </div>
    </div>
  );
}
