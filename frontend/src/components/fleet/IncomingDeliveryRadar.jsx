import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function IncomingDeliveryRadar({
  onShowToast = () => {},
  orders = [],
  activeOrder = null,
  isOnDuty = true,
  onToggleDuty = null,
  onAcceptOrder = null,
  onPickupOrder = null,
  onOutForDelivery = null,
  onDeclineOrder = null,
}) {
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);

  const handlePickup = async (orderId) => {
    if (!onPickupOrder) return;
    setActionLoading(true);
    try {
      await onPickupOrder(orderId);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartDelivery = async (orderId) => {
    if (!onOutForDelivery) return;
    setActionLoading(true);
    try {
      await onOutForDelivery(orderId);
    } finally {
      setActionLoading(false);
    }
  };

  // Deduplicate orders by MongoDB _id to prevent duplicate cards
  const uniqueOrders = Array.from(
    new Map(
      (orders || [])
        .filter(Boolean)
        .map((ord) => [ord._id?.toString() || ord.id?.toString(), ord])
    ).values()
  );

  const incomingCount = uniqueOrders.length;

  return (
    <div className="flex flex-col gap-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-bold text-on-surface">
            Incoming Delivery Radar
          </span>
          <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-xs flex items-center justify-center font-bold">
            {incomingCount}
          </span>
        </div>
        <span className="text-xs text-on-surface-variant font-medium">
          {activeOrder
            ? "Active mission in progress"
            : uniqueOrders && uniqueOrders.length > 0
            ? "Real-time dispatch orders available"
            : "Live GPS corridor monitor"}
        </span>
      </div>

      {/* 1. ACTIVE ORDER CARD (If Courier has an accepted order) */}
      {activeOrder && (
        <div className="relative bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-md border-2 border-primary/40 flex flex-col gap-4 overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-on-primary text-[11px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Active Mission: {activeOrder.orderStatus?.replace(/_/g, " ")}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center text-xl font-extrabold shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[24px]">
                  {activeOrder.orderStatus === "ACCEPTED" ? "takeout_dining" : "electric_moped"}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base sm:text-lg font-bold text-on-surface">
                    {activeOrder.restaurant?.name || "Kitchen Partner"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold">
                    #{activeOrder.orderNumber || activeOrder._id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  {activeOrder.items?.length || 1} Item(s) • Thermal Bag Mandatory • {activeOrder.paymentMethod?.toUpperCase()} Payment
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start bg-surface-container-low sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-lg">
              <div className="text-2xl sm:text-3xl text-primary font-extrabold tracking-tight">
                ₹{((activeOrder.deliveryFee || 50) + 45).toFixed(2)}
              </div>
              <span className="text-xs text-tertiary font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">bolt</span>
                Includes Payout + Tips
              </span>
            </div>
          </div>

          {/* Route Info */}
          <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-3 border border-slate-100 text-xs">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary text-[16px] mt-0.5">storefront</span>
              <div>
                <span className="font-bold text-on-surface">
                  Pickup: {activeOrder.restaurant?.address || activeOrder.restaurant?.hub || "Restaurant Counter"}
                </span>
                <p className="text-secondary text-[11px]">
                  {activeOrder.orderStatus === "ACCEPTED" ? "Ready at counter for pickup" : "Food collected"}
                </p>
              </div>
            </div>
            <div className="ml-2 w-0.5 h-2 bg-surface-container-highest" />
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-[16px] mt-0.5">home_pin</span>
              <div>
                <span className="font-bold text-on-surface">
                  Drop-off: {activeOrder.deliveryAddress?.houseFlat ? `${activeOrder.deliveryAddress.houseFlat}, ${activeOrder.deliveryAddress.areaLocality || ""}` : (activeOrder.deliveryAddress?.addressLine || "Customer Address")}
                </span>
                <p className="text-secondary text-[11px]">
                  Customer: {activeOrder.customer?.name || activeOrder.deliveryAddress?.fullName || "Customer"} (Requires 4-Digit OTP)
                </p>
              </div>
            </div>
          </div>

          {/* Primary State-Driven Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            {activeOrder.orderStatus === "ACCEPTED" && (
              <button
                type="button"
                id="radarPickUpFoodBtn"
                disabled={actionLoading}
                onClick={() => handlePickup(activeOrder._id)}
                className="w-full sm:flex-1 h-12 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">takeout_dining</span>
                <span>{actionLoading ? "Processing..." : "Pick Up Food"}</span>
              </button>
            )}

            {activeOrder.orderStatus === "PICKED_UP" && (
              <button
                type="button"
                id="radarStartDeliveryBtn"
                disabled={actionLoading}
                onClick={() => handleStartDelivery(activeOrder._id)}
                className="w-full sm:flex-1 h-12 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">electric_moped</span>
                <span>{actionLoading ? "Updating..." : "Start Delivery"}</span>
              </button>
            )}

            {activeOrder.orderStatus === "OUT_FOR_DELIVERY" && (
              <button
                type="button"
                onClick={() => navigate("/fleet/active-delivery")}
                className="w-full sm:flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">pin</span>
                <span>Verify OTP / Complete Delivery</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate("/fleet/active-delivery")}
              className="w-full sm:w-auto px-5 h-12 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200/60"
            >
              <span>GPS Cockpit</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. AVAILABLE POOL ORDERS (READY_FOR_PICKUP) */}
      {uniqueOrders && uniqueOrders.length > 0 && (
        <div className="flex flex-col gap-4">
          {uniqueOrders.map((ord) => {
            const ordNumber = ord.orderNumber || ord._id.slice(-6).toUpperCase();
            const estPayout = (ord.deliveryFee || 50) + 45;
            const restName = ord.restaurant?.name || "Kitchen Hub";
            const restAddr = ord.restaurant?.address || ord.restaurant?.hub || "Bodakdev Hub";
            const dropAddr = ord.deliveryAddress?.houseFlat
              ? `${ord.deliveryAddress.houseFlat}, ${ord.deliveryAddress.area || ord.deliveryAddress.areaLocality || ""}${ord.deliveryAddress.city ? `, ${ord.deliveryAddress.city}` : ""}`
              : (ord.deliveryAddress?.addressLine || ord.deliveryAddress?.area || "Customer Location");

            return (
              <div
                key={ord._id}
                className="relative bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-md border border-primary/20 flex flex-col gap-4 overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center text-xl font-extrabold shadow-sm shrink-0">
                      <span className="material-symbols-outlined text-[24px]">electric_moped</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-bold text-on-surface">
                          {restName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold">
                          #{ordNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                          Ready for Pickup
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {ord.items?.length || 1} Item(s) • Thermal Bag Mandatory • {ord.paymentMethod?.toUpperCase()} Payment
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start bg-surface-container-low sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-lg">
                    <div className="text-2xl sm:text-3xl text-primary font-extrabold tracking-tight">
                      ₹{estPayout.toFixed(2)}
                    </div>
                    <span className="text-xs text-tertiary font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">bolt</span>
                      Earn ₹{ord.deliveryFee || 50} Base + ₹45 Surge
                    </span>
                  </div>
                </div>

                {/* Route */}
                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-3 border border-slate-100 text-xs">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary text-[16px] mt-0.5">storefront</span>
                    <div>
                      <span className="font-bold text-on-surface">Pickup: {restAddr}</span>
                      <p className="text-secondary text-[11px]">Ready at counter</p>
                    </div>
                  </div>
                  <div className="ml-2 w-0.5 h-2 bg-surface-container-highest" />
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-[16px] mt-0.5">home_pin</span>
                    <div>
                      <span className="font-bold text-on-surface">Drop-off: {dropAddr}</span>
                      <p className="text-secondary text-[11px]">Customer OTP Verification required</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    id={`acceptDeliveryBtn-${ord._id}`}
                    onClick={() => onAcceptOrder && onAcceptOrder(ord._id)}
                    className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    <span>Accept Delivery</span>
                  </button>
                  <button
                    type="button"
                    id={`declineDeliveryBtn-${ord._id}`}
                    onClick={() => onDeclineOrder && onDeclineOrder(ord._id)}
                    className="px-4 sm:px-5 h-12 rounded-xl bg-surface-container hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-on-surface text-sm font-bold transition-all cursor-pointer border border-slate-200/80 flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
                    title="Decline this delivery request and dismiss from your radar"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. RADAR SCANNING STATE (When no active mission and no available orders) */}
      {!activeOrder && (!uniqueOrders || uniqueOrders.length === 0) && (
        !isOnDuty ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 border border-amber-200 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[28px]">pause_circle</span>
            </div>
            <div>
              <h4 className="text-base font-bold text-on-surface">
                Fleet Duty is Paused (Offline)
              </h4>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1">
                You are currently offline. Switch to Online duty to receive orders when merchants mark them <strong>"Ready at Counter"</strong>.
              </p>
            </div>
            {onToggleDuty && (
              <button
                type="button"
                onClick={onToggleDuty}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">toggle_on</span>
                <span>Go Online &amp; Receive Drops</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl p-8 border border-slate-200/80 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <span className="absolute w-20 h-20 rounded-full bg-primary/10 animate-ping opacity-75" />
              <span className="absolute w-14 h-14 rounded-full bg-primary/20 animate-pulse" />
              <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md relative z-10">
                <span className="material-symbols-outlined text-[22px]">radar</span>
              </div>
            </div>

            <div>
              <h4 className="text-base font-bold text-on-surface">
                Radar Scanning Delivery Corridor
              </h4>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1">
                You are Online and active. As soon as a merchant marks food <strong>"Ready at Counter"</strong>, the dispatch will appear here instantly.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              High Priority Dispatch Active
            </div>
          </div>
        )
      )}
    </div>
  );
}
