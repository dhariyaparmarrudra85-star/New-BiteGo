import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/admin/AdminLayout";
import api from "../services/api";
import {
  Users,
  Store,
  Receipt,
  Clock,
  ArrowRight,
  Eye,
  RefreshCw,
  X,
  User,
  MapPin,
  Calendar,
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchDashboardData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const [resOverview, resOrders] = await Promise.all([
        api.get("/admin/overview"),
        api.get("/admin/orders?limit=8"),
      ]);

      if (resOverview.data?.success) {
        setStats(resOverview.data.stats);
      }

      if (resOrders.data?.success && resOrders.data.orders) {
        setRecentOrders(resOrders.data.orders);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived Summary Figures
  const totalUsers = stats
    ? (stats.customers || 0) + (stats.merchants || 0) + (stats.deliveryPartners || 0)
    : 0;
  const totalRestaurants = stats
    ? stats.activeRestaurants ?? stats.merchants ?? 0
    : 0;
  const totalOrders = stats ? stats.orders || 0 : 0;
  const pendingApprovals = stats
    ? (stats.pendingMerchantApplications || 0) + (stats.pendingDeliveryApplications || 0)
    : 0;

  return (
    <AdminLayout>
      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#151c27] tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Platform summary and real-time operational overview
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="p-2 self-start sm:self-auto rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#b12408]" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* 1. Four Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Users */}
          <Link
            to="/admin/users"
            className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-orange-300 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Total Users
              </span>
              <span className="w-8 h-8 rounded-lg bg-orange-50 text-[#b12408] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#151c27]">
                {totalUsers}
              </div>
              <p className="text-xs text-slate-500 mt-1">Customers, merchants &amp; agents</p>
            </div>
          </Link>

          {/* Card 2: Total Restaurants */}
          <Link
            to="/admin/restaurants"
            className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-amber-300 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Total Restaurants
              </span>
              <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#151c27]">
                {totalRestaurants}
              </div>
              <p className="text-xs text-slate-500 mt-1">Partner restaurant outlets</p>
            </div>
          </Link>

          {/* Card 3: Total Orders */}
          <Link
            to="/admin/orders"
            className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Total Orders
              </span>
              <span className="w-8 h-8 rounded-lg bg-slate-100 text-[#151c27] flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#151c27]">
                {totalOrders}
              </div>
              <p className="text-xs text-slate-500 mt-1">Platform customer orders</p>
            </div>
          </Link>

          {/* Card 4: Pending Approvals */}
          <Link
            to="/admin/restaurants"
            className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-rose-300 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Pending Approvals
              </span>
              <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#151c27]">
                {pendingApprovals}
              </div>
              <p className="text-xs text-slate-500 mt-1">Merchants &amp; delivery applicants</p>
            </div>
          </Link>
        </div>

        {/* 2. Compact "Recent Orders" Section */}
        <section className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#b12408]" />
              <h2 className="text-base font-bold text-[#151c27]">Recent Orders</h2>
            </div>

            <Link
              to="/admin/orders"
              className="text-xs font-bold text-[#b12408] hover:text-[#921d06] flex items-center gap-1 transition-colors"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#b12408]" />
              <p className="text-sm font-medium text-slate-600">Loading recent orders...</p>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
              <h3 className="text-base font-bold text-slate-700">No recent orders found</h3>
              <p className="text-xs text-slate-400 mt-1">
                When customers place food delivery orders, they will appear here.
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
                    <th className="py-3 px-4">Order Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {recentOrders.map((ord) => {
                    const orderId = ord.orderNumber || `#${ord._id.slice(-6).toUpperCase()}`;
                    const custName = ord.customer?.name || "Customer";
                    const restName = ord.restaurant?.name || "Restaurant";
                    const amount = Number(ord.totalAmount || ord.amount || 0);
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
                        <td className="py-3 px-4 font-black text-[#151c27]">
                          ₹{amount.toFixed(2)}
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
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {status}
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

        {/* View Order Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#151c27]">
                    Order Details: {selectedOrder.orderNumber || `#${selectedOrder._id.slice(-6).toUpperCase()}`}
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
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">Order Status</span>
                    <span className="text-xs font-bold text-[#151c27] uppercase">
                      {selectedOrder.orderStatus}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 font-medium block">Total Amount</span>
                    <span className="text-sm font-black text-[#151c27]">
                      ₹{Number(selectedOrder.totalAmount || selectedOrder.amount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Customer</span>
                    <p className="font-bold text-slate-900">{selectedOrder.customer?.name || "Customer"}</p>
                    <p className="text-slate-500">{selectedOrder.customer?.phone || selectedOrder.customer?.email || "No contact"}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Restaurant</span>
                    <p className="font-bold text-slate-900">{selectedOrder.restaurant?.name || "Restaurant"}</p>
                    <p className="text-slate-500">{selectedOrder.restaurant?.address || "Ahmedabad"}</p>
                  </div>
                </div>

                {/* Delivery Agent (if assigned) */}
                {selectedOrder.deliveryPartner && (
                  <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-sky-900 space-y-1">
                    <span className="text-[11px] font-bold uppercase text-sky-700">Assigned Delivery Agent</span>
                    <p className="font-bold">{selectedOrder.deliveryPartner.name}</p>
                    <p className="text-sky-600">
                      {selectedOrder.deliveryPartner.phone} • {selectedOrder.deliveryPartner.vehicleType || "Courier"}
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
