import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Clock, Navigation2, CheckCircle2, Bike, KeyRound } from "lucide-react";

export default function OrderHeader({
  orderId = "BG-89421",
  etaTime = "7:42 PM",
  etaRange = "18–22 mins",
  distance = "1.2 km away",
  status = "Out for Delivery 🛵",
  order = null,
}) {
  // If full order object passed, format dynamically
  const displayOrderId = order?.orderNumber || orderId;
  const orderOtp = order?.orderOtp;
  
  const getStatusText = (s) => {
    switch (s) {
      case "PLACED":
        return "Order Placed 📋";
      case "CONFIRMED":
        return "Restaurant Confirmed 👨‍🍳";
      case "PREPARING":
        return "Kitchen Preparing Food 🔥";
      case "READY_FOR_PICKUP":
        return "Ready for Pickup 📦";
      case "ASSIGNED":
      case "ACCEPTED":
        return "Delivery Pilot Assigned 🛵";
      case "PICKED_UP":
        return "Picked Up by Courier 🛵";
      case "OUT_FOR_DELIVERY":
        return "Out for Delivery 🛵";
      case "DELIVERED":
        return "Delivered 🎉";
      case "CANCELLED":
        return "Cancelled ❌";
      default:
        return status;
    }
  };

  const displayStatus = order?.orderStatus ? getStatusText(order.orderStatus) : status;
  const isDelivered = order?.orderStatus === "DELIVERED";
  const isCancelled = order?.orderStatus === "CANCELLED";

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] transition-all">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-4 sm:mb-6">
        <Link to="/" className="hover:text-orange-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <Link to="/orders" className="hover:text-orange-600 transition-colors">
          My Orders
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-slate-800 font-bold">Order #{displayOrderId}</span>
      </nav>

      {/* Main Status Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Status & ETA */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-black tracking-wide shadow-xs ${
              isCancelled
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : isDelivered
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-700"
            }`}>
              {!isCancelled && !isDelivered && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                </span>
              )}
              <span>{displayStatus}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold">
              <Bike className="w-3.5 h-3.5 text-orange-600" />
              <span>{order?.deliveryPartner?.vehicle || "Ather 450X EV Express"}</span>
            </span>

            {/* OTP Pill for Customer */}
            {orderOtp && !isDelivered && !isCancelled && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black shadow-xs">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Delivery OTP: {orderOtp}</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none">
            {isDelivered ? (
              <span className="text-emerald-600">Order Delivered!</span>
            ) : isCancelled ? (
              <span className="text-rose-600">Order Cancelled</span>
            ) : (
              <>
                Arriving in{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500">
                  {order?.estimatedDeliveryTime || etaRange}
                </span>
              </>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-2 flex-wrap">
            <span>On-time guarantee</span>
            <span className="text-slate-300">•</span>
            <span>Live order updates connected</span>
          </p>

          {/* Delivery OTP Verification Card */}
          {orderOtp && !isDelivered && !isCancelled && (
            <div className="mt-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-300/80 flex items-center justify-between flex-wrap gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
                  <KeyRound className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                    Delivery Handover Verification
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800">
                    Share this OTP with your delivery partner when your order arrives.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-amber-300 shadow-xs">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">OTP:</span>
                <span className="font-mono text-xl sm:text-2xl font-black text-amber-950 tracking-widest">{orderOtp}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Quick Status Cards */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
          {/* Target ETA Card */}
          <div className="flex-1 sm:flex-initial p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-orange-50/40 border border-slate-200/80 min-w-[140px] sm:min-w-[160px] shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              <span>Target ETA</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isDelivered ? "Completed" : etaTime}
            </p>
            <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>{isDelivered ? "Delivered Fresh" : "On Schedule"}</span>
            </p>
          </div>

          {/* Current Distance Card */}
          <div className="flex-1 sm:flex-initial p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50/40 border border-slate-200/80 min-w-[140px] sm:min-w-[160px] shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
              <Navigation2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Hub Route</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isDelivered ? "0 km" : distance}
            </p>
            <p className="text-[11px] font-bold text-sky-700 mt-0.5">
              {order?.deliveryAddress?.area || "Sindhu Bhavan Rd"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
