import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import api from "../services/api";
import {
  Receipt,
  Search,
  Eye,
  RefreshCw,
  X,
  User,
  Store,
  Bike,
  Calendar,
  IndianRupee,
  CreditCard,
  MapPin,
  Clock,
} from "lucide-react";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      let url = "/admin/orders?limit=100";
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await api.get(url);
      if (res.data?.success && res.data.orders) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <AdminLayout>
      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#151c27] tracking-tight">
              Order Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Inspect live platform customer orders and tracking lifecycle
            </p>
          </div>

          {/* Search by Order ID */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by order ID (e.g. BG-)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-[#b12408] transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#b12408]" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: "All Orders" },
              { id: "PLACED", label: "Placed" },
              { id: "CONFIRMED", label: "Accepted" },
              { id: "PREPARING", label: "Preparing" },
              { id: "READY_FOR_PICKUP", label: "Ready for Pickup" },
              { id: "PICKED_UP", label: "Picked Up" },
              { id: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
              { id: "DELIVERED", label: "Delivered" },
              { id: "CANCELLED", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-[#151c27] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <section className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#b12408]" />
              <p className="text-sm font-medium text-slate-600">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
              <h3 className="text-base font-bold text-slate-700">No orders found</h3>
              <p className="text-xs text-slate-400 mt-1">
                No customer orders match the selected filter or search query.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Restaurant</th>
                    <th className="py-3 px-4">Delivery Agent</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4">Order Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {orders.map((ord) => {
                    const orderId = ord.orderNumber || `#${ord._id.slice(-6).toUpperCase()}`;
                    const custName = ord.customer?.name || "Customer";
                    const restName = ord.restaurant?.name || "Restaurant";
                    const agentName = ord.deliveryPartner?.name || "Unassigned";
                    const amount = Number(ord.totalAmount || ord.amount || 0);
                    const paymentStatus = ord.paymentStatus || "PENDING";
                    const status = ord.orderStatus || "PLACED";
                    const dateStr = ord.createdAt
                      ? new Date(ord.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recently";

                    return (
                      <tr key={ord._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-black text-[#151c27]">{orderId}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{custName}</td>
                        <td className="py-3 px-4 text-slate-600">{restName}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`flex items-center gap-1 ${
                              ord.deliveryPartner ? "text-sky-700 font-semibold" : "text-slate-400"
                            }`}
                          >
                            {ord.deliveryPartner && <Bike className="w-3.5 h-3.5 shrink-0" />}
                            <span>{agentName}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-black text-[#151c27]">
                          ₹{amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              paymentStatus === "SUCCESS" || paymentStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              status === "DELIVERED"
                                ? "bg-emerald-100 text-emerald-800"
                                : status === "CANCELLED"
                                ? "bg-rose-100 text-rose-800"
                                : status === "PLACED"
                                ? "bg-orange-100 text-[#b12408]"
                                : ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(status)
                                ? "bg-sky-100 text-sky-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {status === "PLACED"
                              ? "Placed"
                              : status === "CONFIRMED"
                              ? "Accepted"
                              : status === "PREPARING"
                              ? "Preparing"
                              : status === "READY_FOR_PICKUP"
                              ? "Ready for Pickup"
                              : status === "PICKED_UP"
                              ? "Picked Up"
                              : status === "OUT_FOR_DELIVERY"
                              ? "Out for Delivery"
                              : status === "DELIVERED"
                              ? "Delivered"
                              : status === "CANCELLED"
                              ? "Cancelled"
                              : status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{dateStr}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(ord)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px]"
                            title="View Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* View Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#151c27]">
                    Order: {selectedOrder.orderNumber || `#${selectedOrder._id.slice(-6).toUpperCase()}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto text-xs">
                {/* Status & Amount */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">Current Order Status</span>
                    <span className="text-xs font-black text-[#151c27] uppercase">
                      {selectedOrder.orderStatus}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 font-medium block">Order Total</span>
                    <span className="text-base font-black text-[#151c27]">
                      ₹{Number(selectedOrder.totalAmount || selectedOrder.amount || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block uppercase">
                      Payment: {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Parties Involved */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Customer</span>
                    </div>
                    <p className="font-bold text-slate-900">{selectedOrder.customer?.name || "Customer"}</p>
                    <p className="text-slate-500">{selectedOrder.customer?.phone || selectedOrder.customer?.email || "No phone"}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                      <Store className="w-3.5 h-3.5 text-slate-500" />
                      <span>Restaurant</span>
                    </div>
                    <p className="font-bold text-slate-900">{selectedOrder.restaurant?.name || "Restaurant"}</p>
                    <p className="text-slate-500">{selectedOrder.restaurant?.address || "Bodakdev"}</p>
                  </div>
                </div>

                {/* Delivery Agent Card */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                    <Bike className="w-3.5 h-3.5 text-slate-500" />
                    <span>Assigned Delivery Agent</span>
                  </div>
                  {selectedOrder.deliveryPartner ? (
                    <div>
                      <p className="font-bold text-slate-900">{selectedOrder.deliveryPartner.name}</p>
                      <p className="text-slate-500">
                        Phone: {selectedOrder.deliveryPartner.phone} • Vehicle: {selectedOrder.deliveryPartner.vehicleType || "Courier"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No delivery agent assigned yet.</p>
                  )}
                </div>

                {/* Delivery Address */}
                {selectedOrder.deliveryAddress && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>Delivery Address</span>
                    </div>
                    <p className="text-slate-700">
                      {selectedOrder.deliveryAddress.street || selectedOrder.deliveryAddress.address || "Customer address"},{" "}
                      {selectedOrder.deliveryAddress.city || "Ahmedabad"}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminLayout>
  );
}
