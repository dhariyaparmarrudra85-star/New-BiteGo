import React from "react";
import {
  Check,
  Clock,
  Phone,
  Store,
  MapPin,
  User,
  ShoppingBag,
  RotateCcw,
  Ban,
  Star,
  Receipt,
  AlertCircle,
} from "lucide-react";

/**
 * 7 Defined Delivery Status Stages
 */
const STATUS_STAGES = [
  { key: "PLACED", title: "Order Placed" },
  { key: "CONFIRMED", title: "Restaurant Accepted" },
  { key: "PREPARING", title: "Preparing Your Food" },
  { key: "READY_FOR_PICKUP", title: "Ready for Pickup" },
  { key: "PICKED_UP", title: "Picked Up" },
  { key: "OUT_FOR_DELIVERY", title: "Out for Delivery" },
  { key: "DELIVERED", title: "Delivered" },
];

/**
 * Map backend order status to stage index (0 to 6)
 */
function getActiveStageIndex(status) {
  if (!status) return 0;
  const s = status.toUpperCase();

  switch (s) {
    case "PLACED":
      return 0;
    case "CONFIRMED":
      return 1;
    case "PREPARING":
      return 2;
    case "READY_FOR_PICKUP":
    case "READY":
      return 3;
    case "ASSIGNED":
    case "ACCEPTED":
    case "PICKED_UP":
      return 4;
    case "OUT_FOR_DELIVERY":
      return 5;
    case "DELIVERED":
      return 6;
    default:
      return 0;
  }
}

/**
 * Get human-readable description for current status
 */
function getStatusDescription(status, restaurantName, deliveryPartnerName) {
  if (!status) return "Your order is being processed.";
  const s = status.toUpperCase();

  switch (s) {
    case "PLACED":
      return "Your order has been placed and sent to the restaurant.";
    case "CONFIRMED":
      return `${restaurantName || "The restaurant"} has accepted your order.`;
    case "PREPARING":
      return "The kitchen is actively preparing your food.";
    case "READY_FOR_PICKUP":
    case "READY":
      return "Your food is freshly packed and ready for pickup.";
    case "ASSIGNED":
    case "ACCEPTED":
      return deliveryPartnerName
        ? `${deliveryPartnerName} is heading to the restaurant to collect your order.`
        : "A delivery partner has been assigned and is heading to the restaurant.";
    case "PICKED_UP":
      return deliveryPartnerName
        ? `${deliveryPartnerName} has picked up your order from the restaurant.`
        : "Your order has been picked up from the restaurant.";
    case "OUT_FOR_DELIVERY":
      return deliveryPartnerName
        ? `${deliveryPartnerName} is on the way to your delivery address.`
        : "Your order is out for delivery and heading your way.";
    case "DELIVERED":
      return "Your order has been delivered. Enjoy your meal!";
    case "CANCELLED":
      return "This order was cancelled.";
    default:
      return "Your order is being processed.";
  }
}

/**
 * Format address object or string gracefully
 */
function formatAddress(addr) {
  if (!addr) return null;
  if (typeof addr === "string") return addr.trim() || null;
  if (typeof addr === "object") {
    const parts = [
      addr.houseFlat,
      addr.street,
      addr.area,
      addr.landmark,
      addr.city,
      addr.pincode,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return null;
}

export default function DeliveryTracking({
  order,
  onCancelOrder = null,
  onReorder = null,
  onOpenReview = null,
}) {
  if (!order) return null;

  const currentStatus = order.orderStatus || "PLACED";
  const isCancelled = currentStatus === "CANCELLED";
  const isDelivered = currentStatus === "DELIVERED";
  const activeStageIndex = isCancelled ? -1 : getActiveStageIndex(currentStatus);

  const restaurantName = order.restaurant?.name || "Restaurant";
  const restaurantAddress = formatAddress(order.restaurant?.address) || "Restaurant address not specified";
  const customerAddress = formatAddress(order.deliveryAddress) || "Customer address not specified";
  const customerName = order.deliveryAddress?.fullName || order.customer?.name || "Customer";

  const orderId = order.orderNumber || (order._id ? String(order._id).slice(-6) : "");
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // Timeline timestamp lookup helper
  const getStageTime = (stageKey) => {
    if (!Array.isArray(order.statusTimeline)) return null;
    const match = order.statusTimeline.find(
      (item) => item?.status?.toUpperCase() === stageKey
    );
    if (!match?.timestamp) return null;
    try {
      return new Date(match.timestamp).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  const deliveryPartner = order.deliveryPartner;
  const hasPartner = Boolean(deliveryPartner && (deliveryPartner._id || deliveryPartner.name));
  const partnerName = hasPartner ? deliveryPartner.name : null;
  const partnerPhone = hasPartner && deliveryPartner.phone ? String(deliveryPartner.phone).trim() : null;
  const partnerPhoto = hasPartner && deliveryPartner.profilePhoto ? deliveryPartner.profilePhoto : null;

  // Only display estimated arrival time if provided by valid source and order not completed
  const estimatedTime =
    !isDelivered && !isCancelled && order.estimatedDeliveryTime
      ? order.estimatedDeliveryTime
      : null;

  const canCancel = isCancelled ? false : (currentStatus === "PLACED" || currentStatus === "CONFIRMED");
  const isPaid =
    order.paymentStatus === "paid" ||
    order.paymentStatus === "SUCCESS" ||
    order.paymentStatus === "completed";

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal) || 0;
  const totalAmount = Number(order.totalAmount) || 0;

  return (
    <div className="w-full space-y-6">
      {/* 1. ORDER HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Track Your Order
            </h1>
            <div className="flex items-center gap-2 flex-wrap text-sm text-slate-600">
              <span className="font-semibold text-slate-800">Order #{orderId}</span>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-slate-700">{restaurantName}</span>
              {orderDate && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">{orderDate}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {order.orderOtp && !isDelivered && !isCancelled && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold">
                <span>Delivery OTP:</span>
                <span className="font-mono text-sm tracking-wider text-orange-900 font-extrabold">
                  {order.orderOtp}
                </span>
              </div>
            )}

            <div
              className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${
                isCancelled
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : isDelivered
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-orange-50 text-orange-700 border border-orange-200"
              }`}
            >
              {isCancelled ? "Cancelled" : isDelivered ? "Delivered" : "In Progress"}
            </div>
          </div>
        </div>

        {isCancelled && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>This order has been cancelled. If any payment was deducted, a refund will be processed to your original payment method.</span>
          </div>
        )}
      </div>

      {/* 2. DELIVERY STATUS TIMELINE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">
          Delivery Status
        </h2>

        {/* Desktop Horizontal Timeline */}
        <div className="hidden md:block">
          <div className="grid grid-cols-7 relative">
            {STATUS_STAGES.map((stage, idx) => {
              const isCompleted = isDelivered || (!isCancelled && idx < activeStageIndex);
              const isCurrent = !isCancelled && !isDelivered && idx === activeStageIndex;
              const isPending = isCancelled || idx > activeStageIndex;
              const isLast = idx === STATUS_STAGES.length - 1;
              const time = getStageTime(stage.key);

              return (
                <div key={stage.key} className="flex flex-col items-center relative text-center">
                  {/* Connecting Line (Right) */}
                  {!isLast && (
                    <div
                      className={`absolute top-4 left-1/2 w-full h-[2px] -z-0 ${
                        isCompleted ? "bg-slate-900" : "bg-slate-200"
                      }`}
                    />
                  )}

                  {/* Step Node */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold relative z-10 transition-colors ${
                      isCompleted
                        ? "bg-slate-900 text-white"
                        : isCurrent
                        ? "bg-orange-600 text-white ring-4 ring-orange-100"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="mt-3 px-1">
                    <p
                      className={`text-xs leading-tight ${
                        isCurrent
                          ? "font-bold text-orange-600"
                          : isCompleted
                          ? "font-semibold text-slate-900"
                          : "font-medium text-slate-400"
                      }`}
                    >
                      {stage.title}
                    </p>

                    {time && (
                      <span className="text-[10px] text-slate-400 font-medium block mt-1">
                        {time}
                      </span>
                    )}

                    {isCurrent && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Vertical Timeline */}
        <div className="block md:hidden space-y-4">
          {STATUS_STAGES.map((stage, idx) => {
            const isCompleted = isDelivered || (!isCancelled && idx < activeStageIndex);
            const isCurrent = !isCancelled && !isDelivered && idx === activeStageIndex;
            const isPending = isCancelled || idx > activeStageIndex;
            const isLast = idx === STATUS_STAGES.length - 1;
            const time = getStageTime(stage.key);

            return (
              <div key={stage.key} className="relative flex items-start gap-3">
                {/* Connecting Vertical Line */}
                {!isLast && (
                  <div
                    className={`absolute left-[15px] top-7 w-[2px] h-[calc(100%-8px)] -z-0 ${
                      isCompleted ? "bg-slate-900" : "bg-slate-200"
                    }`}
                  />
                )}

                {/* Step Circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 relative z-10 transition-colors mt-0.5 ${
                    isCompleted
                      ? "bg-slate-900 text-white"
                      : isCurrent
                      ? "bg-orange-600 text-white ring-4 ring-orange-100"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Step Information */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm ${
                        isCurrent
                          ? "font-bold text-orange-600"
                          : isCompleted
                          ? "font-semibold text-slate-900"
                          : "font-medium text-slate-400"
                      }`}
                    >
                      {stage.title}
                    </p>

                    {time && (
                      <span className="text-xs text-slate-400 font-medium">
                        {time}
                      </span>
                    )}
                  </div>

                  {isCurrent && (
                    <span className="inline-block mt-0.5 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TWO-COLUMN DETAILS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Delivery Information & Addresses */}
        <div className="lg:col-span-7 space-y-6">
          {/* 3. DELIVERY INFORMATION */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Delivery Information
            </h2>

            {/* Partner Details */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3.5">
                {partnerPhoto ? (
                  <img
                    src={partnerPhoto}
                    alt={partnerName || "Delivery Partner"}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                )}

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {partnerName || (hasPartner ? "Delivery Partner" : "Assigning Delivery Partner...")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {hasPartner
                      ? deliveryPartner.vehicleType
                        ? `${deliveryPartner.vehicleType}${deliveryPartner.vehicleNumber ? " • " + deliveryPartner.vehicleNumber : ""}`
                        : "BiteGo Fleet Partner"
                      : "A driver will be assigned once the food is being prepared."}
                  </p>
                </div>
              </div>

              {/* Contact Action (Only if valid phone is available) */}
              {partnerPhone && (
                <a
                  href={`tel:${partnerPhone}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-orange-50 hover:text-orange-600 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-orange-600" />
                  <span>Call Partner</span>
                </a>
              )}
            </div>

            {/* Estimated Arrival Time (Only if provided by a valid source) */}
            {estimatedTime && (
              <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="font-medium">Estimated Arrival Time:</span>
                </div>
                <span className="font-bold text-orange-700">{estimatedTime}</span>
              </div>
            )}

            {/* Current Delivery Status Description */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Current Status Update
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {getStatusDescription(currentStatus, restaurantName, partnerName)}
              </p>
            </div>
          </div>

          {/* 4. DELIVERY ADDRESS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Locations
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pickup Address */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-orange-600 text-xs font-bold">
                  <Store className="w-4 h-4 shrink-0" />
                  <span>Restaurant Pickup</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                  {restaurantName}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {restaurantAddress}
                </p>
                {order.restaurant?.phone && (
                  <p className="text-[11px] text-slate-500 pt-1">
                    Contact: {order.restaurant.phone}
                  </p>
                )}
              </div>

              {/* Delivery Dropoff Address */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold">
                  <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Customer Delivery</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                  {customerName}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {customerAddress}
                </p>
                {order.deliveryInstructions && (
                  <p className="text-[11px] text-slate-500 pt-1">
                    <span className="font-semibold text-slate-600">Instructions:</span> {order.deliveryInstructions}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* 5. ORDER SUMMARY */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-slate-400" />
                <span>Order Summary</span>
              </h2>

              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  isPaid
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {isPaid ? "PAID" : order.paymentMethod === "COD" ? "CASH ON DELIVERY" : "PAYMENT PENDING"}
              </span>
            </div>

            {/* Items List */}
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <div key={item._id || idx} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {item.quantity}x
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900 leading-tight">
                          {item.name}
                        </p>
                        {Array.isArray(item.customizations) && item.customizations.length > 0 && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {item.customizations.map((c) => c.name).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-slate-800 shrink-0">
                      ₹{(item.itemTotal || (Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No item details available</p>
              )}
            </div>

            {/* Financial Breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Item Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              {Number(order.deliveryFee) > 0 ? (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>₹{Number(order.deliveryFee).toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="text-emerald-600 font-medium">FREE</span>
                </div>
              )}

              {((Number(order.tax) || 0) + (Number(order.platformFee) || 0)) > 0 && (
                <div className="flex justify-between">
                  <span>Taxes &amp; Platform Fee</span>
                  <span>₹{((Number(order.tax) || 0) + (Number(order.platformFee) || 0)).toFixed(2)}</span>
                </div>
              )}

              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span>-₹{Number(order.discount).toFixed(2)}</span>
                </div>
              )}

              {(Number(order.tipAmount) || Number(order.tip) || 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Rider Tip</span>
                  <span>₹{(Number(order.tipAmount) || Number(order.tip)).toFixed(2)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Total Amount</span>
                <span className="text-base text-slate-900">₹{totalAmount.toFixed(2)}</span>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>Payment Mode</span>
                <span className="font-medium text-slate-600">{order.paymentMethod || "UPI"}</span>
              </div>
            </div>

            {/* Actions: Cancel, Review, Reorder */}
            <div className="pt-2 space-y-2">
              {canCancel && onCancelOrder && (
                <button
                  type="button"
                  onClick={onCancelOrder}
                  className="w-full py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancel Order</span>
                </button>
              )}

              {isDelivered && onOpenReview && !order.review?.restaurantRating && (
                <button
                  type="button"
                  onClick={onOpenReview}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>Rate &amp; Review Order</span>
                </button>
              )}

              {isDelivered && onReorder && (
                <button
                  type="button"
                  onClick={onReorder}
                  className="w-full py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reorder Items</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
