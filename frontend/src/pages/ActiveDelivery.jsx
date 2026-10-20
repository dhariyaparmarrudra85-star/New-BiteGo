import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import FleetSidebar from "../components/fleet/FleetSidebar";
import FleetHeader from "../components/fleet/FleetHeader";
import {
  Bike,
  Store,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Phone,
  ArrowRight,
  AlertCircle,
  Clock,
  KeyRound,
} from "lucide-react";

export default function ActiveDelivery() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnDuty, setIsOnDuty] = useState(user?.isOnline ?? true);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const loadActiveDelivery = async () => {
    try {
      const res = await api.get("/delivery/dashboard");
      const data = res?.data || res;
      if (data?.success) {
        if (data.dutyStatus) {
          setIsOnDuty(data.dutyStatus.isOnline);
        }
        const order = data.activeOrder || data.currentOrder || null;
        setActiveOrder(order);
      }
    } catch (err) {
      console.error("Failed to load active delivery:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveDelivery();
    const interval = setInterval(loadActiveDelivery, 4000);
    return () => clearInterval(interval);
  }, []);

  // Step 1: Confirm Pickup
  const handleConfirmPickup = async () => {
    if (!activeOrder) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/delivery/orders/${activeOrder._id}/pickup`);
      const data = res?.data || res;
      if (data?.success) {
        showToast("Food picked up from restaurant! Now proceed to Step 2.");
        loadActiveDelivery();
      } else {
        showToast(data?.message || "Error confirming pickup.");
      }
    } catch (err) {
      console.error("Pickup error:", err);
      showToast(err.response?.data?.message || "Error confirming pickup.");
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2: Mark Delivered (Opens OTP confirmation modal)
  const handleOpenDeliverModal = () => {
    setOtpInput("");
    setOtpError("");
    setShowOtpModal(true);
  };

  const handleSubmitDelivery = async (e) => {
    e.preventDefault();
    if (!activeOrder) return;

    setActionLoading(true);
    setOtpError("");

    try {
      const res = await api.post(`/delivery/orders/${activeOrder._id}/verify-otp`, {
        otp: otpInput.trim(),
      });
      const data = res?.data || res;
      if (data?.success) {
        setShowOtpModal(false);
        showToast(`Delivery completed! ₹${data.earning?.totalEarning || 60} credited.`);
        setActiveOrder(null);
        setTimeout(() => {
          navigate("/fleet/dashboard");
        }, 1500);
      } else {
        setOtpError(data?.message || "Invalid OTP code.");
      }
    } catch (err) {
      console.error("Delivery verify error:", err);
      setOtpError(
        err.response?.data?.message || "Invalid OTP! Ask customer for their 4-digit delivery PIN."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Order status logic
  const isPickedUp =
    activeOrder &&
    ["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(activeOrder.orderStatus);

  const canPickup =
    activeOrder &&
    ["ACCEPTED", "ASSIGNED"].includes(activeOrder.orderStatus);

  const canDeliver =
    activeOrder &&
    ["PICKED_UP", "OUT_FOR_DELIVERY"].includes(activeOrder.orderStatus);

  // Extract real pickup and delivery addresses safely
  const getRestaurantAddress = (order) => {
    const raw = order?.restaurant?.address;
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw.trim();
    }
    return "";
  };

  const getCustomerAddress = (order) => {
    const da = order?.deliveryAddress;
    if (!da) return "";
    if (typeof da === "string") return da.trim();

    const parts = [
      da.houseFlat || da.addressLine || da.street,
      da.area,
      da.landmark,
      da.city,
      da.state,
      da.pincode,
    ].filter((part) => typeof part === "string" && part.trim().length > 0);

    return parts.join(", ");
  };

  const restaurantAddress = getRestaurantAddress(activeOrder);
  const customerAddress = getCustomerAddress(activeOrder);

  // Standard Google Maps Directions URL launcher
  const handleOpenGoogleMaps = (rawAddress) => {
    if (!rawAddress || typeof rawAddress !== "string" || !rawAddress.trim()) {
      return;
    }
    const destination = encodeURIComponent(rawAddress.trim());
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 selection:bg-orange-500 selection:text-white">
      {/* 1. SIDEBAR */}
      <FleetSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isOnDuty={isOnDuty}
      />

      {/* 2. HEADER */}
      <FleetHeader
        onOpenSidebar={() => setSidebarOpen(true)}
        isOnDuty={isOnDuty}
      />

      {/* 3. MAIN CONTENT */}
      <div className="lg:pl-64 pt-16 flex-1 flex flex-col">
        <main className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full mx-auto space-y-6">
          {/* Page Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#151c27] tracking-tight">
              Active Delivery
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Follow the two steps below to complete your current delivery
            </p>
          </div>

          {/* LOADING STATE */}
          {loading && (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-3 border-orange-200 border-t-[#b12408] animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">
                Loading active delivery details...
              </p>
            </div>
          )}

          {/* NO ACTIVE DELIVERY */}
          {!loading && !activeOrder && (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#b12408] flex items-center justify-center mx-auto">
                <Bike className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                No active delivery right now
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                You do not currently have an order in transit. Check the Available Orders page to accept an incoming delivery request.
              </p>
              <div className="pt-2">
                <Link
                  to="/fleet/available-orders"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#b12408] hover:bg-[#931f07] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <span>Check Available Orders</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* ACTIVE DELIVERY STEPS (STEP 1 & STEP 2) */}
          {!loading && activeOrder && (
            <div className="space-y-6">
              {/* Order Banner */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-black text-[#151c27]">
                      Order #{activeOrder.orderNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#b12408] text-xs font-bold uppercase tracking-wider">
                      {isPickedUp ? "En Route to Customer" : "Pickup from Restaurant"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {activeOrder.items?.length || 1} item(s) • Total: ₹{activeOrder.totalAmount}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 font-medium block">
                    Earnings
                  </span>
                  <span className="text-base font-extrabold text-emerald-600">
                    ₹{activeOrder.deliveryFee || 60}
                  </span>
                </div>
              </div>

              {/* STEP 1: GO TO RESTAURANT */}
              <div
                className={`bg-white rounded-2xl p-6 border-2 transition-all shadow-xs ${
                  !isPickedUp ? "border-[#b12408]/40 ring-2 ring-orange-50" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        isPickedUp
                          ? "bg-emerald-500 text-white"
                          : "bg-[#b12408] text-white"
                      }`}
                    >
                      {isPickedUp ? "✓" : "1"}
                    </div>
                    <h2 className="text-base font-bold text-[#151c27]">
                      Step 1: Go to Restaurant
                    </h2>
                  </div>

                  {isPickedUp && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Picked Up
                    </span>
                  )}
                </div>

                {/* Restaurant Details */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Store className="w-5 h-5 text-[#b12408] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-slate-900">
                        {activeOrder.restaurant?.name || "BiteGo Restaurant"}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {restaurantAddress || (
                          <span className="text-slate-400 italic">Address unavailable</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Google Maps Directions Button (Available before pickup) */}
                  <div className="pl-8 pt-1">
                    {restaurantAddress ? (
                      <button
                        type="button"
                        onClick={() => handleOpenGoogleMaps(restaurantAddress)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#b12408] font-bold text-xs border border-orange-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#b12408]" />
                        <span>Open in Google Maps</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs border border-slate-200 cursor-not-allowed"
                      >
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Address unavailable</span>
                      </button>
                    )}
                  </div>

                  {/* Picked Up Button */}
                  <div className="pt-3">
                    {canPickup ? (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleConfirmPickup}
                        className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#b12408] hover:bg-[#931f07] text-white font-extrabold text-sm shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {actionLoading ? "Updating..." : "Picked Up"}
                      </button>
                    ) : isPickedUp ? (
                      <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-xl">
                        <span>Food picked up from restaurant</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full sm:w-auto px-8 py-3 rounded-xl bg-slate-200 text-slate-400 font-bold text-sm cursor-not-allowed"
                      >
                        Picked Up
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* STEP 2: DELIVER TO CUSTOMER */}
              <div
                className={`bg-white rounded-2xl p-6 border-2 transition-all shadow-xs ${
                  isPickedUp ? "border-[#b12408]/40 ring-2 ring-orange-50" : "border-slate-200 opacity-80"
                }`}
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        isPickedUp
                          ? "bg-[#b12408] text-white"
                          : "bg-slate-300 text-slate-600"
                      }`}
                    >
                      2
                    </div>
                    <h2 className="text-base font-bold text-[#151c27]">
                      Step 2: Deliver to Customer
                    </h2>
                  </div>

                  {!isPickedUp && (
                    <span className="text-[11px] font-semibold text-slate-400">
                      Pending Step 1
                    </span>
                  )}
                </div>

                {/* Customer Details & Directions: Displayed after agent confirms pickup */}
                {isPickedUp ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-bold text-slate-900">
                            {activeOrder.customer?.name || activeOrder.deliveryAddress?.fullName || "Customer"}
                          </h3>
                          {activeOrder.deliveryAddress?.phone && (
                            <a
                              href={`tel:${activeOrder.deliveryAddress.phone}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call</span>
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {customerAddress || (
                            <span className="text-slate-400 italic">Address unavailable</span>
                          )}
                        </p>
                        {activeOrder.deliveryInstructions && (
                          <p className="text-xs text-orange-700 font-medium bg-orange-50 p-2 rounded-lg mt-2">
                            Note: {activeOrder.deliveryInstructions}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Google Maps Directions Button for Customer Address */}
                    <div className="pl-8 pt-1">
                      {customerAddress ? (
                        <button
                          type="button"
                          onClick={() => handleOpenGoogleMaps(customerAddress)}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#b12408] font-bold text-xs border border-orange-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#b12408]" />
                          <span>Open in Google Maps</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs border border-slate-200 cursor-not-allowed"
                        >
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>Address unavailable</span>
                        </button>
                      )}
                    </div>

                    {/* Mark Delivered Button */}
                    <div className="pt-3">
                      {canDeliver ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={handleOpenDeliverModal}
                          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark Delivered</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-slate-200 text-slate-400 font-bold text-sm cursor-not-allowed"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 space-y-1">
                      <p className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Customer Delivery Address Locked</span>
                      </p>
                      <p className="text-slate-500">
                        The customer's delivery address and Google Maps directions will be displayed after you confirm food pickup from the restaurant.
                      </p>
                    </div>

                    {/* Disabled Mark Delivered Button */}
                    <div className="pt-3">
                      <button
                        type="button"
                        disabled
                        className="w-full sm:w-auto px-8 py-3 rounded-xl bg-slate-200 text-slate-400 font-bold text-sm cursor-not-allowed"
                      >
                        Mark Delivered
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* DELIVERY OTP HANDOVER MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Complete Delivery
              </h3>
              <p className="text-xs text-slate-500">
                Ask customer for the 4-digit code displayed on their BiteGo tracking screen.
              </p>
            </div>

            <form onSubmit={handleSubmitDelivery} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={4}
                  autoFocus
                  value={otpInput}
                  onChange={(e) => {
                    setOtpInput(e.target.value.replace(/\D/g, ""));
                    setOtpError("");
                  }}
                  placeholder="Enter 4-digit PIN"
                  className="w-full py-3 text-center text-2xl font-black tracking-widest rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:outline-none"
                />
                {otpError && (
                  <p className="text-xs text-red-600 font-semibold text-center mt-1.5">
                    {otpError}
                  </p>
                )}
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? "Verifying..." : "Confirm Delivery"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simple Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#151c27] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
