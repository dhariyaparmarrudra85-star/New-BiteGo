import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import FleetSidebar from "../components/fleet/FleetSidebar";
import FleetHeader from "../components/fleet/FleetHeader";
import {
  Inbox,
  Store,
  MapPin,
  Check,
  X,
  Clock,
  AlertCircle,
  RefreshCw,
  Wallet,
  Navigation,
} from "lucide-react";

export default function FleetAvailableOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnDuty, setIsOnDuty] = useState(user?.isOnline ?? true);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const loadAvailableOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/delivery/available");
      const data = res?.data || res;
      if (data?.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to load available orders:", err);
      // If error message indicates offline status, reflect in UI
      if (err.response?.data?.message?.includes("offline")) {
        setIsOnDuty(false);
      }
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailableOrders();
    const interval = setInterval(loadAvailableOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle Accept
  const handleAcceptOrder = async (order) => {
    const id = order._id || order.id;
    setActionId(id);
    try {
      const res = await api.patch(`/delivery/orders/${id}/accept`);
      const data = res?.data || res;
      if (data?.success) {
        showToast(`Delivery #${order.orderNumber} accepted! Opening active delivery.`);
        setTimeout(() => {
          navigate("/fleet/active-delivery");
        }, 800);
      } else {
        showToast(data?.message || "Order could not be accepted.");
        loadAvailableOrders();
      }
    } catch (err) {
      console.error("Accept error:", err);
      showToast(err.response?.data?.message || "Order could not be accepted or was claimed by another partner.");
      loadAvailableOrders();
    } finally {
      setActionId(null);
    }
  };

  // Handle Reject / Decline
  const handleRejectOrder = async (order) => {
    const id = order._id || order.id;
    const confirmReject = window.confirm(`Reject delivery request #${order.orderNumber}?`);
    if (!confirmReject) return;

    setActionId(id);
    try {
      const res = await api.patch(`/delivery/orders/${id}/decline`);
      const data = res?.data || res;
      if (data?.success) {
        setOrders((prev) => prev.filter((o) => (o._id || o.id) !== id));
        showToast(`Order #${order.orderNumber} dismissed.`);
      }
    } catch (err) {
      console.error("Decline error:", err);
      showToast(err.response?.data?.message || "Error dismissing order.");
    } finally {
      setActionId(null);
    }
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
        <main className="p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#151c27] tracking-tight">
                Available Orders
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                New delivery requests ready for kitchen pickup in Ahmedabad
              </p>
            </div>

            <button
              type="button"
              onClick={loadAvailableOrders}
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* OFFLINE NOTICE */}
          {!isOnDuty && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
              <div className="flex-1 text-xs">
                <span className="font-bold">You are currently OFFLINE.</span> Switch duty to Online in your Dashboard to receive incoming orders.
              </div>
            </div>
          )}

          {/* LOADING STATE */}
          {loading && orders.length === 0 && (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-3 border-orange-200 border-t-[#b12408] animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">
                Checking for available delivery requests...
              </p>
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && orders.length === 0 && (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#b12408] flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No orders available right now
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All ready orders have been assigned or restaurants are preparing food. New orders will appear here automatically.
              </p>
            </div>
          )}

          {/* AVAILABLE ORDERS LIST */}
          <div className="space-y-4">
            {orders.map((order) => {
              const id = order._id || order.id;
              const isActionLoading = actionId === id;
              const estimatedEarnings = order.deliveryFee || 60;

              return (
                <div
                  key={id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-orange-300 p-5 sm:p-6 shadow-xs space-y-4 transition-all"
                >
                  {/* Top Bar: Order ID & Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-[#151c27]">
                        Order #{order.orderNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        Ready for Pickup
                      </span>
                    </div>

                    {/* Earnings & Distance */}
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <div className="flex items-center gap-1 text-[#b12408]">
                        <Wallet className="w-3.5 h-3.5" />
                        <span>₹{estimatedEarnings} Earnings</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <div className="flex items-center gap-1 text-slate-600">
                        <Navigation className="w-3.5 h-3.5 text-slate-400" />
                        <span>~2.4 km</span>
                      </div>
                    </div>
                  </div>

                  {/* Pickup & Delivery Addresses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Pickup Restaurant */}
                    <div className="space-y-1">
                      <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">
                        Pickup Restaurant
                      </span>
                      <div className="flex items-start gap-2">
                        <Store className="w-4 h-4 text-[#b12408] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {order.restaurant?.name || "BiteGo Restaurant"}
                          </p>
                          <p className="text-slate-500 leading-relaxed mt-0.5">
                            {order.restaurant?.address || "Ahmedabad Kitchen"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Drop-off */}
                    <div className="space-y-1">
                      <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">
                        Customer Drop-off
                      </span>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {order.customer?.name || order.deliveryAddress?.fullName || "Customer"}
                          </p>
                          <p className="text-slate-500 leading-relaxed mt-0.5">
                            {order.deliveryAddress
                              ? `${order.deliveryAddress.houseFlat}, ${order.deliveryAddress.area}`
                              : "Delivery Address, Ahmedabad"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Accept & Reject */}
                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => handleRejectOrder(order)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => handleAcceptOrder(order)}
                      className="px-6 py-2.5 rounded-xl bg-[#b12408] hover:bg-[#931f07] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{isActionLoading ? "Accepting..." : "Accept Delivery"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#151c27] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
