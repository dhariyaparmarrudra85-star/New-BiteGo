import React from "react";

export default function MissionHeader({
  order = null,
  onPickup = null,
  onOutForDelivery = null,
  actionLoading = false,
}) {
  const orderNumber = order?.orderNumber || (order?._id ? order._id.slice(-6).toUpperCase() : "BG-89421");
  const restaurantName = order?.restaurant?.name || "The Dark Roast Pizzeria";
  const customerName = order?.customer?.name || order?.deliveryAddress?.fullName || order?.user?.name || "Customer";
  const orderValue = order?.totalAmount ? `₹${order.totalAmount.toFixed(2)}` : "₹792.50";
  const earnings = order?.deliveryFee ? (order.deliveryFee + 45).toFixed(2) : "145.00";
  const paymentMethod = order?.paymentMethod ? order.paymentMethod.toUpperCase() : "UPI";
  const status = order?.orderStatus || "OUT_FOR_DELIVERY";

  const isStep1Done = status === "PICKED_UP" || status === "OUT_FOR_DELIVERY" || status === "DELIVERED";
  const isStep2Done = status === "OUT_FOR_DELIVERY" || status === "DELIVERED";
  const isStep3Done = status === "DELIVERED";

  return (
    <div className="w-full bg-surface-container-lowest rounded-2xl shadow-sm p-4 sm:p-5 border border-slate-100 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Order Identity & Current Mode */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm shrink-0">
            <span className="material-symbols-outlined text-[26px]">navigation</span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg sm:text-xl font-bold text-on-surface">
                Order #{orderNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold uppercase tracking-wide">
                Status: {status.replace(/_/g, " ")}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                Live Mission
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs">
              <span className="text-on-surface-variant flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[16px] text-tertiary">store</span>
                {restaurantName}
              </span>
              <span className="text-on-surface-variant">•</span>
              <span className="text-on-surface flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-[16px] text-primary">person_pin_circle</span>
                Drop: {customerName}
              </span>
            </div>
          </div>
        </div>

        {/* Live Mission Metrics (ETA, Distance, Payout) */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="px-3.5 sm:px-4 py-2 rounded-xl bg-surface-container-low flex flex-col justify-center border border-slate-100">
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
              Target ETA
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-on-surface">
                ~15 mins
              </span>
              <span className="text-xs font-bold text-primary">
                (Bodakdev Corridor)
              </span>
            </div>
          </div>

          <div className="px-3.5 sm:px-4 py-2 rounded-xl bg-surface-container-low flex flex-col justify-center border border-slate-100">
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
              Order Value
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-on-surface">
                {orderValue}
              </span>
              <span className="text-xs text-tertiary font-semibold">
                {paymentMethod}
              </span>
            </div>
          </div>

          <div className="px-3.5 sm:px-4 py-2 rounded-xl bg-primary-fixed text-on-primary-fixed flex flex-col justify-center shadow-xs border border-[#ffdad3]">
            <span className="text-[11px] uppercase tracking-wider text-on-primary-fixed-variant font-bold">
              Your Earnings
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-primary">
                ₹{earnings}
              </span>
              <span className="text-xs text-on-primary-fixed-variant font-semibold">
                +₹15 tip
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent State-Driven Action Banner (Single Primary Action) */}
      <div className="mt-4 p-4 rounded-xl bg-surface-container-low border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
            status === "ACCEPTED" ? "bg-amber-600" :
            status === "PICKED_UP" ? "bg-primary" :
            status === "OUT_FOR_DELIVERY" ? "bg-blue-600" : "bg-emerald-600"
          }`}>
            <span className="material-symbols-outlined text-[22px]">
              {status === "ACCEPTED" ? "takeout_dining" :
               status === "PICKED_UP" ? "electric_moped" :
               status === "OUT_FOR_DELIVERY" ? "pin" : "verified"}
            </span>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-on-surface-variant">
              Next Required Action
            </span>
            <h4 className="text-sm sm:text-base font-bold text-on-surface">
              {status === "ACCEPTED" && "Pick up food parcel from restaurant kitchen counter"}
              {status === "PICKED_UP" && "Start GPS navigation and deliver to customer"}
              {status === "OUT_FOR_DELIVERY" && "Arrive at customer doorstep and verify 4-digit OTP"}
              {status === "DELIVERED" && "Delivery successfully completed and verified!"}
            </h4>
          </div>
        </div>

        {/* State Machine Primary Action Button */}
        <div>
          {status === "ACCEPTED" && onPickup && (
            <button
              type="button"
              id="pickUpFoodBtn"
              disabled={actionLoading}
              onClick={onPickup}
              className="h-12 px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">takeout_dining</span>
              <span>{actionLoading ? "Processing..." : "Pick Up Food"}</span>
            </button>
          )}

          {status === "PICKED_UP" && onOutForDelivery && (
            <button
              type="button"
              id="startDeliveryBtn"
              disabled={actionLoading}
              onClick={onOutForDelivery}
              className="h-12 px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">electric_moped</span>
              <span>{actionLoading ? "Updating..." : "Start Delivery"}</span>
            </button>
          )}

          {status === "OUT_FOR_DELIVERY" && (
            <a
              href="#deliveryOtpSection"
              className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">pin</span>
              <span>Enter Customer OTP Below</span>
            </a>
          )}

          {status === "DELIVERED" && (
            <span className="h-10 px-4 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
              <span>Delivery Completed</span>
            </span>
          )}
        </div>
      </div>

      {/* Stepper Pipeline Ribbon & Lifecycle Action Buttons */}
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Step 1: Pickup */}
        <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-surface-container-low/60 border border-slate-100">
          <div className={`h-2 rounded-full ${isStep1Done ? "bg-tertiary" : "bg-primary"}`} />
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold flex items-center gap-1 ${isStep1Done ? "text-tertiary" : "text-primary"}`}>
              <span className="material-symbols-outlined text-[15px]">
                {isStep1Done ? "check_circle" : "storefront"}
              </span>
              1. Kitchen Pickup
            </span>
            <span className="text-on-surface-variant font-medium">
              {isStep1Done ? "Completed" : "Pending"}
            </span>
          </div>
          {status === "ACCEPTED" && onPickup && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={onPickup}
              className="mt-1 h-9 px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">takeout_dining</span>
              <span>Pick Up Food</span>
            </button>
          )}
        </div>

        {/* Step 2: Transit / Out for Delivery */}
        <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-surface-container-low/60 border border-slate-100">
          <div className={`h-2 rounded-full ${isStep2Done ? "bg-tertiary" : isStep1Done ? "bg-primary" : "bg-surface-container-high"}`} />
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold flex items-center gap-1 ${isStep2Done ? "text-tertiary" : isStep1Done ? "text-primary" : "text-on-surface-variant"}`}>
              <span className="material-symbols-outlined text-[15px]">
                {isStep2Done ? "check_circle" : "electric_moped"}
              </span>
              2. Transit to Customer
            </span>
            <span className="text-on-surface-variant font-medium">
              {isStep2Done ? "En Route" : isStep1Done ? "Ready" : "Waiting"}
            </span>
          </div>
          {status === "PICKED_UP" && onOutForDelivery && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={onOutForDelivery}
              className="mt-1 h-9 px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">navigation</span>
              <span>Start Delivery</span>
            </button>
          )}
        </div>

        {/* Step 3: Delivery Handover */}
        <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-surface-container-low/60 border border-slate-100">
          <div className={`h-2 rounded-full ${isStep3Done ? "bg-tertiary" : isStep2Done ? "bg-primary" : "bg-surface-container-high"}`} />
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold flex items-center gap-1 ${isStep3Done ? "text-tertiary" : isStep2Done ? "text-primary" : "text-on-surface-variant"}`}>
              <span className="material-symbols-outlined text-[15px]">
                {isStep3Done ? "check_circle" : "pin"}
              </span>
              3. Handover & OTP
            </span>
            <span className="text-on-surface-variant font-medium">
              {isStep3Done ? "Delivered" : isStep2Done ? "Verify Code" : "Pending"}
            </span>
          </div>
          {status === "OUT_FOR_DELIVERY" && (
            <div className="text-[11px] text-tertiary font-bold flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">info</span>
              <span>Ask customer for 4-digit OTP below</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
