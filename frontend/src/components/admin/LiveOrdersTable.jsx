import React, { useState, useEffect } from "react";
import api, { API_BASE_URL } from "../../services/api";

export default function LiveOrdersTable({ onActionToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/orders");
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error("Fetch admin orders error:", err);
      if (onActionToast) onActionToast("Failed to fetch live orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 6000); // Poll every 6s
    return () => clearInterval(interval);
  }, []);

  const validTransitions = {
    PLACED: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PREPARING", "CANCELLED"],
    PREPARING: ["READY_FOR_PICKUP", "CANCELLED"],
    READY_FOR_PICKUP: ["ASSIGNED", "CANCELLED"],
    ASSIGNED: ["ACCEPTED", "CANCELLED"],
    ACCEPTED: ["PICKED_UP", "CANCELLED"],
    PICKED_UP: ["OUT_FOR_DELIVERY"],
    OUT_FOR_DELIVERY: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
  };

  const handleUpdateStatus = async (orderId, nextStatus) => {
    setStatusUpdating(true);
    try {
      const res = await api.patch(`/admin/orders/${orderId}/status`, {
        status: nextStatus,
      });
      if (res.data?.success) {
        if (onActionToast) onActionToast(`Order status updated to ${nextStatus}`);
        fetchOrders();
        setSelectedOrder(null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update order status.";
      if (onActionToast) onActionToast(msg);
    } finally {
      setStatusUpdating(false);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      !searchQuery ||
      ord.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.restaurant?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "all") return true;
    if (activeTab === "active")
      return !["DELIVERED", "CANCELLED"].includes(ord.orderStatus);
    if (activeTab === "completed") return ord.orderStatus === "DELIVERED";
    if (activeTab === "cancelled") return ord.orderStatus === "CANCELLED";
    return ord.orderStatus?.toLowerCase() === activeTab.toLowerCase();
  });

  const getStatusBadge = (st) => {
    switch (st) {
      case "DELIVERED":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "CANCELLED":
        return "bg-error-container text-on-error-container border-error/30";
      case "PLACED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "CONFIRMED":
      case "PREPARING":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "READY_FOR_PICKUP":
      case "ASSIGNED":
      case "ACCEPTED":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "PICKED_UP":
      case "OUT_FOR_DELIVERY":
        return "bg-primary-fixed text-on-primary-fixed-variant border-primary/30";
      default:
        return "bg-surface-container-high text-on-surface-variant";
    }
  };

  return (
    <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high/40 p-space-lg flex flex-col gap-space-md">
      {/* Table Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
              Real-Time Platform Orders Supervision
            </h2>
            <span className="inline-flex items-center gap-1 font-label-sm text-label-sm font-bold text-tertiary bg-tertiary-fixed px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
              MongoDB Atlas Live
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mt-0.5">
            View orders, customers, merchants, couriers, and strictly enforce sequential state rules
          </p>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order #, Patron, Restaurant..."
              className="pl-9 pr-3 py-1.5 rounded-xl bg-surface-container-low border border-surface-container-high/40 text-xs font-medium text-on-surface focus:outline-none focus:border-primary w-64"
            />
          </div>

          <button
            onClick={fetchOrders}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
          >
            <span
              className={`material-symbols-outlined text-[16px] ${
                loading ? "animate-spin" : ""
              }`}
            >
              sync
            </span>
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: "all", label: `All Orders (${orders.length})` },
          {
            id: "active",
            label: `In Transit / Active (${
              orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.orderStatus))
                .length
            })`,
          },
          {
            id: "completed",
            label: `Delivered (${
              orders.filter((o) => o.orderStatus === "DELIVERED").length
            })`,
          },
          {
            id: "cancelled",
            label: `Cancelled (${
              orders.filter((o) => o.orderStatus === "CANCELLED").length
            })`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "bg-on-surface text-surface shadow-xs"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabular Container */}
      <div className="overflow-x-auto no-scrollbar rounded-xl bg-surface-container-lowest border border-surface-container-high/30">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 rounded-l-lg">Order ID &amp; Date</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Restaurant &amp; Merchant</th>
              <th className="py-3 px-4">Courier Partner</th>
              <th className="py-3 px-4">Bill &amp; Payment</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right rounded-r-lg">Supervision Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high/60 font-body-sm text-body-sm text-on-surface">
            {loading && orders.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-[28px] text-primary">
                    progress_activity
                  </span>
                  <p className="mt-2 text-xs">Loading live platform orders...</p>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40">
                    inbox
                  </span>
                  <p className="mt-1 text-sm font-semibold">No orders matching criteria</p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((ord) => {
                const nextOptions = validTransitions[ord.orderStatus] || [];
                return (
                  <tr
                    key={ord._id}
                    className="hover:bg-surface-container-low/50 transition-colors"
                  >
                    {/* Order ID & Date */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-primary">
                          #{ord.orderNumber || ord._id.slice(-6)}
                        </span>
                        <span className="text-[11px] text-secondary mt-0.5">
                          {new Date(ord.date || ord.createdAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface text-xs">
                          {ord.customer?.name || "Guest Patron"}
                        </span>
                        <span className="text-[11px] text-secondary">
                          {ord.customer?.phone || ord.customer?.email || "No contact"}
                        </span>
                      </div>
                    </td>

                    {/* Restaurant & Merchant */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface text-xs">
                          {ord.restaurant?.name || "BiteGo Kitchen"}
                        </span>
                        <span className="text-[11px] text-tertiary">
                          Merchant: {ord.merchant?.name || "Registered Partner"}
                        </span>
                      </div>
                    </td>

                    {/* Delivery Partner */}
                    <td className="py-3.5 px-4 align-middle">
                      {ord.deliveryPartner ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                            <span className="material-symbols-outlined text-[16px]">
                              two_wheeler
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-on-surface text-xs">
                              {ord.deliveryPartner.name}
                            </span>
                            <span className="text-[11px] text-secondary">
                              {ord.deliveryPartner.phone} • {ord.deliveryPartner.vehicleType}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-on-surface-variant/70 italic">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Bill & Payment */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface text-xs">
                          ₹{Number(ord.amount || ord.totalAmount || 0).toFixed(2)}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            ord.paymentStatus === "PAID"
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          {ord.paymentStatus || "PENDING"} ({ord.paymentMethod || "COD"})
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 align-middle">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getStatusBadge(
                          ord.orderStatus
                        )}`}
                      >
                        {ord.orderStatus}
                      </span>
                    </td>

                    {/* Supervision Action (Sequential Rules) */}
                    <td className="py-3.5 px-4 align-middle text-right">
                      {nextOptions.length > 0 ? (
                        <div className="inline-flex items-center gap-1 justify-end">
                          {nextOptions.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => handleUpdateStatus(ord._id, opt)}
                              disabled={statusUpdating}
                              className={`h-7 px-2.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer ${
                                opt === "CANCELLED"
                                  ? "bg-error-container hover:bg-error text-on-error-container hover:text-on-error"
                                  : "bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface"
                              }`}
                            >
                              <span>→ {opt.replace(/_/g, " ")}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-on-surface-variant/60 font-medium">
                          Terminal State
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
