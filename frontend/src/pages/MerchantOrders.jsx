import React, { useState, useEffect, useCallback } from "react";
import MerchantLayout from "../components/merchant/MerchantLayout";
import MenuToast from "../components/merchant/MenuToast";
import api from "../services/api";
import {
  Clock,
  ChefHat,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Bike,
  RefreshCw,
  Search,
  Check,
  AlertCircle,
  User,
  Phone,
  FileText,
} from "lucide-react";

export default function MerchantOrders() {
  const [activeTab, setActiveTab] = useState("incoming"); // "incoming" | "preparing" | "ready" | "completed"
  const [orders, setOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [actionInProgress, setActionInProgress] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchOrders = useCallback(async () => {
    try {
      const [resOrders, resRest] = await Promise.all([
        api.get("/merchant/orders"),
        api.get("/merchant/restaurant"),
      ]);

      if (resRest.data?.success && resRest.data.restaurant) {
        setRestaurant(resRest.data.restaurant);
      }

      if (resOrders.data?.success && resOrders.data.orders) {
        setOrders(resOrders.data.orders);
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
      showToast("Unable to load orders from server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Order lifecycle status update
  const handleUpdateStatus = async (orderId, newStatus, note = "") => {
    try {
      setActionInProgress(orderId);
      const res = await api.patch(`/merchant/orders/${orderId}/status`, {
        status: newStatus,
        note,
      });

      if (res.data?.success) {
        if (newStatus === "CONFIRMED") showToast("Order accepted!");
        else if (newStatus === "PREPARING") showToast("Started preparing order.");
        else if (newStatus === "READY_FOR_PICKUP") showToast("Order marked Ready for Pickup.");
        else if (newStatus === "CANCELLED") showToast(`Order rejected: ${note}`);
        fetchOrders();
      } else {
        showToast(res.data?.message || "Failed to update order status.");
      }
    } catch (err) {
      console.error("Update status error:", err);
      showToast(err.response?.data?.message || "Failed to update order status.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRejectOrder = (orderId) => {
    const reason =
      window.prompt("Reason for rejecting this order:", "Kitchen at peak capacity") ||
      "Declined by restaurant";
    handleUpdateStatus(orderId, "CANCELLED", reason);
  };

  // Toggle restaurant taking orders
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

  // Filter orders by active tab & search
  const incomingOrders = orders.filter((o) => o.orderStatus === "PLACED");
  const preparingOrders = orders.filter((o) =>
    ["CONFIRMED", "PREPARING"].includes(o.orderStatus)
  );
  const readyOrders = orders.filter((o) =>
    ["READY_FOR_PICKUP", "ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(o.orderStatus)
  );
  const completedOrders = orders.filter((o) => o.orderStatus === "DELIVERED");

  const tabOrdersMap = {
    incoming: incomingOrders,
    preparing: preparingOrders,
    ready: readyOrders,
    completed: completedOrders,
  };

  const currentTabOrders = tabOrdersMap[activeTab] || [];

  const filteredOrders = currentTabOrders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const orderNum = (order.orderNumber || order._id).toLowerCase();
    const custName = (order.customer?.name || "").toLowerCase();
    const itemMatch = (order.items || []).some((i) => i.name.toLowerCase().includes(q));
    return orderNum.includes(q) || custName.includes(q) || itemMatch;
  });

  return (
    <MerchantLayout
      restaurant={restaurant}
      takingOrders={restaurant?.isOpen ?? true}
      onToggleTakingOrders={handleToggleStoreStatus}
      onShowToast={showToast}
    >
      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#151c27] tracking-tight">
              Order Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage incoming customer orders and kitchen preparation lifecycle
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order ID or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-[#b12408] transition-colors"
            />
          </div>
        </div>

        {/* Primary Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
          {/* Tab 1: New Orders */}
          <button
            type="button"
            onClick={() => setActiveTab("incoming")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "incoming"
                ? "bg-[#b12408] text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>New Orders</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === "incoming" ? "bg-white/20 text-white" : "bg-orange-100 text-[#b12408]"
              }`}
            >
              {incomingOrders.length}
            </span>
          </button>

          {/* Tab 2: Preparing */}
          <button
            type="button"
            onClick={() => setActiveTab("preparing")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "preparing"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Preparing</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === "preparing" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
              }`}
            >
              {preparingOrders.length}
            </span>
          </button>

          {/* Tab 3: Ready for Pickup */}
          <button
            type="button"
            onClick={() => setActiveTab("ready")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "ready"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Ready for Pickup</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === "ready" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {readyOrders.length}
            </span>
          </button>

          {/* Tab 4: Completed */}
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "completed"
                ? "bg-[#151c27] text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === "completed" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {completedOrders.length}
            </span>
          </button>
        </div>

        {/* Orders List Container */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#b12408]" />
            <p className="text-sm font-medium text-slate-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
            <h3 className="text-base font-bold text-slate-700">
              {activeTab === "incoming"
                ? "No new orders right now."
                : `No orders in "${activeTab}" stage.`}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === "incoming"
                ? "New orders placed by customers will show up here automatically."
                : "Orders will move into this tab as you advance them."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const orderId = order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`;
              const orderDate = new Date(order.createdAt).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              const customerName = order.customer?.name || "Customer";
              const customerPhone = order.customer?.phone;
              const items = order.items || [];
              const total = order.totalAmount || 0;
              const paymentStatus = order.paymentStatus || "PENDING";
              const status = order.orderStatus;
              const isWorking = actionInProgress === order._id;

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 hover:border-slate-300 transition-colors space-y-4"
                >
                  {/* Top Bar: Order ID, Date, Customer & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-[#151c27]">{orderId}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{orderDate}</span>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            status === "PLACED"
                              ? "bg-orange-100 text-[#b12408]"
                              : status === "CONFIRMED"
                              ? "bg-amber-100 text-amber-800"
                              : status === "PREPARING"
                              ? "bg-amber-100 text-amber-800"
                              : status === "READY_FOR_PICKUP"
                              ? "bg-emerald-100 text-emerald-800"
                              : ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(status)
                              ? "bg-sky-100 text-sky-800"
                              : status === "DELIVERED"
                              ? "bg-slate-100 text-slate-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {status === "PLACED"
                            ? "New Order"
                            : status === "CONFIRMED"
                            ? "Accepted"
                            : status === "PREPARING"
                            ? "Preparing"
                            : status === "READY_FOR_PICKUP"
                            ? "Ready for Pickup"
                            : status === "ASSIGNED"
                            ? "Courier Assigned"
                            : status === "PICKED_UP" || status === "OUT_FOR_DELIVERY"
                            ? "Picked Up by Courier"
                            : status === "DELIVERED"
                            ? "Completed"
                            : "Cancelled"}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                        <span className="flex items-center gap-1 font-semibold text-slate-900">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {customerName}
                        </span>
                        {customerPhone && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {customerPhone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Total & Payment Status */}
                    <div className="text-left sm:text-right">
                      <div className="text-base font-black text-[#151c27]">
                        ₹{Number(total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          paymentStatus === "COMPLETED" || paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        Payment: {paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Food Items & Quantities */}
                  <div className="bg-slate-50/70 rounded-xl p-3 space-y-2 border border-slate-100 text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Food Items ({items.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">
                            <span className="font-black text-[#b12408] mr-1.5">
                              {it.quantity || 1}x
                            </span>
                            {it.name}
                          </span>
                          <span className="text-slate-500 font-medium">
                            ₹{Number((it.price || 0) * (it.quantity || 1)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.deliveryInstructions && (
                      <div className="pt-2 border-t border-slate-200/60 text-[11px] text-amber-900 flex items-center gap-1.5 font-medium">
                        <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Special Note: {order.deliveryInstructions}</span>
                      </div>
                    )}
                  </div>

                  {/* Courier Info (if assigned/picked up) */}
                  {order.deliveryPartner && (
                    <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 flex items-center justify-between text-xs text-sky-900">
                      <div className="flex items-center gap-2">
                        <Bike className="w-4 h-4 text-sky-600" />
                        <span>
                          Delivery Agent: <strong>{order.deliveryPartner.name}</strong>{" "}
                          ({order.deliveryPartner.vehicleType || "Courier"})
                        </span>
                      </div>
                      {order.orderOtp && (
                        <span className="font-bold bg-white px-2 py-0.5 rounded text-sky-800 border border-sky-200">
                          Pickup OTP: {order.orderOtp}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions Bar (Strictly mapped to real order status) */}
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                    {/* NEW ORDER (PLACED) */}
                    {status === "PLACED" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRejectOrder(order._id)}
                          disabled={isWorking}
                          className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject Order</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(order._id, "CONFIRMED")}
                          disabled={isWorking}
                          className="px-4 py-2 rounded-xl bg-[#b12408] hover:bg-[#921d06] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept Order</span>
                        </button>
                      </>
                    )}

                    {/* ACCEPTED ORDER (CONFIRMED) */}
                    {status === "CONFIRMED" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order._id, "PREPARING")}
                        disabled={isWorking}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>Start Preparing</span>
                      </button>
                    )}

                    {/* PREPARING ORDER */}
                    {status === "PREPARING" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order._id, "READY_FOR_PICKUP")}
                        disabled={isWorking}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>Mark Ready for Pickup</span>
                      </button>
                    )}

                    {/* READY FOR PICKUP */}
                    {status === "READY_FOR_PICKUP" && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold">
                        <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
                        <span>Waiting for Delivery Agent</span>
                      </div>
                    )}

                    {/* COURIER PICKED UP / EN ROUTE */}
                    {["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(status) && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 text-sky-800 rounded-xl border border-sky-200 text-xs font-bold">
                        <Bike className="w-4 h-4 text-sky-600" />
                        <span>Order Picked Up &amp; En Route</span>
                      </div>
                    )}

                    {/* DELIVERED */}
                    {status === "DELIVERED" && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Delivered to Customer</span>
                      </div>
                    )}

                    {/* CANCELLED */}
                    {status === "CANCELLED" && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-200">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Cancelled</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Toast Notification */}
      <MenuToast message={toastMessage} onClose={() => setToastMessage("")} />
    </MerchantLayout>
  );
}
