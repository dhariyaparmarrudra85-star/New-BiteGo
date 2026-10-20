import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import MerchantLayout from "../components/merchant/MerchantLayout";
import MenuToast from "../components/merchant/MenuToast";
import api from "../services/api";
import {
  Clock,
  ChefHat,
  PackageCheck,
  IndianRupee,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ExternalLink,
  Store,
  RefreshCw,
} from "lucide-react";

export default function MerchantDashboard() {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    netRevenue: 0,
    pipeline: { incoming: 0, preparing: 0, ready: 0, dispatched: 0 },
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchDashboardData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await api.get("/merchant/dashboard");
      const data = res.data;

      if (data?.success) {
        if (data.restaurant) setRestaurant(data.restaurant);
        if (data.metrics) setMetrics(data.metrics);
        if (data.recentOrders) setOrders(data.recentOrders);
      }
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      showToast("Unable to fetch live orders from server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(), 6000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Order status actions
  const handleAcceptOrder = async (orderId) => {
    try {
      const res = await api.patch(`/merchant/orders/${orderId}/status`, {
        status: "CONFIRMED",
        note: "Accepted by restaurant",
      });
      if (res.data?.success) {
        showToast("Order accepted successfully.");
        fetchDashboardData();
      } else {
        showToast(res.data?.message || "Failed to accept order.");
      }
    } catch (err) {
      console.error("Accept order error:", err);
      showToast(err.response?.data?.message || "Failed to accept order.");
    }
  };

  const handleRejectOrder = async (orderId) => {
    const reason =
      window.prompt("Reason for rejecting this order:", "Kitchen at peak capacity") ||
      "Declined by restaurant";
    try {
      const res = await api.patch(`/merchant/orders/${orderId}/status`, {
        status: "CANCELLED",
        note: reason,
      });
      if (res.data?.success) {
        showToast(`Order rejected: ${reason}`);
        fetchDashboardData();
      } else {
        showToast(res.data?.message || "Failed to reject order.");
      }
    } catch (err) {
      console.error("Reject order error:", err);
      showToast(err.response?.data?.message || "Failed to reject order.");
    }
  };

  // Toggle store open/closed
  const handleToggleStoreStatus = async () => {
    try {
      const next = !restaurant?.isOpen;
      const res = await api.patch("/merchant/restaurant/status", { isOpen: next });
      if (res.data?.success) {
        setRestaurant((prev) => (prev ? { ...prev, isOpen: next } : prev));
        showToast(next ? "Store is now OPEN and taking orders." : "Store is now CLOSED.");
      }
    } catch (err) {
      console.error("Toggle store error:", err);
      showToast("Failed to update store status.");
    }
  };

  // Calculate live counts
  const newOrdersList = orders.filter((o) => o.orderStatus === "PLACED");
  const newOrdersCount = metrics.pipeline?.incoming ?? newOrdersList.length;
  const preparingOrdersCount =
    metrics.pipeline?.preparing ??
    orders.filter((o) => ["CONFIRMED", "PREPARING"].includes(o.orderStatus)).length;
  const readyOrdersCount =
    metrics.pipeline?.ready ??
    orders.filter((o) => o.orderStatus === "READY_FOR_PICKUP").length;
  const todayEarningsAmount = Number(metrics.todayRevenue || 0);

  return (
    <MerchantLayout
      restaurant={restaurant}
      takingOrders={restaurant?.isOpen ?? true}
      onToggleTakingOrders={handleToggleStoreStatus}
      onShowToast={showToast}
    >
      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto font-sans">
        {/* Page Title & Store Availability Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#151c27] tracking-tight">
              Restaurant Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {restaurant?.name || "The Dark Roast Pizzeria"} · Overview &amp; Live Incoming Orders
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Store Status Badge */}
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                restaurant?.isOpen ?? true
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  restaurant?.isOpen ?? true ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
              />
              <span>{restaurant?.isOpen ?? true ? "Taking Orders (Open)" : "Closed"}</span>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#b12408]" : ""}`} />
            </button>
          </div>
        </div>

        {/* 1. Four Simple Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: New Orders */}
          <Link
            to="/merchant/orders"
            className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-orange-300 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                New Orders
              </span>
              <span className="w-8 h-8 rounded-lg bg-orange-50 text-[#b12408] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#151c27]">
                {newOrdersCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">Requires your acceptance</p>
            </div>
          </Link>

          {/* Card 2: Preparing Orders */}
          <Link
            to="/merchant/orders"
            className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-amber-300 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Preparing Orders
              </span>
              <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <ChefHat className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#151c27]">
                {preparingOrdersCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">Cooking in kitchen</p>
            </div>
          </Link>

          {/* Card 3: Ready for Pickup */}
          <Link
            to="/merchant/orders"
            className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Ready for Pickup
              </span>
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PackageCheck className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#151c27]">
                {readyOrdersCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">Awaiting delivery agent</p>
            </div>
          </Link>

          {/* Card 4: Today's Earnings */}
          <Link
            to="/merchant/earnings"
            className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Today's Earnings
              </span>
              <span className="w-8 h-8 rounded-lg bg-slate-100 text-[#151c27] flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#151c27]">
                ₹{todayEarningsAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 mt-1">Recorded today</p>
            </div>
          </Link>
        </div>

        {/* 2. Prominent "New Orders" Section */}
        <section className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#b12408] animate-pulse" />
              <h2 className="text-lg font-bold text-[#151c27]">New Orders</h2>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-orange-100 text-[#b12408] text-xs font-extrabold">
                {newOrdersList.length}
              </span>
            </div>

            <Link
              to="/merchant/orders"
              className="text-xs font-bold text-[#b12408] hover:text-[#921d06] flex items-center gap-1 transition-colors"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#b12408]" />
                <p className="text-sm font-medium text-slate-600">Loading incoming orders...</p>
              </div>
            ) : newOrdersList.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
                <h3 className="text-base font-bold text-slate-700">No new orders right now.</h3>
                <p className="text-xs text-slate-400 mt-1">
                  New incoming customer orders will appear here immediately as they are placed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {newOrdersList.map((order) => {
                  const orderId = order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`;
                  const orderTime = new Date(order.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const customerName = order.customer?.name || "Customer";
                  const items = order.items || [];
                  const total = order.totalAmount || 0;
                  const paymentStatus = order.paymentStatus || "PENDING";

                  return (
                    <div
                      key={order._id}
                      className="p-4 rounded-xl border border-orange-200 bg-orange-50/40 hover:bg-orange-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: Order Info & Items */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-[#151c27]">{orderId}</span>
                          <span className="text-xs text-slate-500">• {orderTime}</span>
                          <span className="text-xs font-semibold text-slate-700">
                            • {customerName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#b12408] text-white uppercase tracking-wider">
                            New Order
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              paymentStatus === "COMPLETED" || paymentStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {paymentStatus}
                          </span>
                        </div>

                        {/* Food Items & Quantities */}
                        <div className="text-xs text-slate-700 font-medium">
                          {items.map((it, idx) => (
                            <span key={idx}>
                              <strong className="text-slate-900 font-bold">
                                {it.quantity || 1}x
                              </strong>{" "}
                              {it.name}
                              {idx < items.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </div>

                        {order.deliveryInstructions && (
                          <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 inline-block font-medium">
                            Note: {order.deliveryInstructions}
                          </p>
                        )}
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <div className="text-right mr-2">
                          <span className="text-xs text-slate-500 block">Total Amount</span>
                          <span className="text-base font-black text-[#151c27]">
                            ₹{Number(total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Accept Button */}
                        <button
                          type="button"
                          onClick={() => handleAcceptOrder(order._id)}
                          className="px-4 py-2 rounded-xl bg-[#b12408] hover:bg-[#921d06] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept Order</span>
                        </button>

                        {/* Reject Button */}
                        <button
                          type="button"
                          onClick={() => handleRejectOrder(order._id)}
                          className="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>

                        {/* Manage Order Link */}
                        <button
                          type="button"
                          onClick={() => navigate("/merchant/orders")}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Manage Order</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Toast Notification */}
      <MenuToast message={toastMessage} onClose={() => setToastMessage("")} />
    </MerchantLayout>
  );
}
