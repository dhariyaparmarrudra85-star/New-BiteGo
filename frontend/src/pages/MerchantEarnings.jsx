import React, { useState, useEffect, useCallback } from "react";
import MerchantLayout from "../components/merchant/MerchantLayout";
import MenuToast from "../components/merchant/MenuToast";
import api from "../services/api";
import {
  IndianRupee,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Receipt,
  Clock,
  ArrowUpRight,
} from "lucide-react";

export default function MerchantEarnings() {
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    netRevenue: 0,
    completedOrders: 0,
  });
  const [completedOrdersList, setCompletedOrdersList] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchEarningsData = useCallback(async () => {
    try {
      const [resDashboard, resOrders, resRest] = await Promise.all([
        api.get("/merchant/dashboard"),
        api.get("/merchant/orders?status=completed"),
        api.get("/merchant/restaurant"),
      ]);

      if (resRest.data?.success && resRest.data.restaurant) {
        setRestaurant(resRest.data.restaurant);
      }

      if (resDashboard.data?.success && resDashboard.data.metrics) {
        setMetrics(resDashboard.data.metrics);
      }

      if (resOrders.data?.success && resOrders.data.orders) {
        setCompletedOrdersList(resOrders.data.orders);
      }
    } catch (err) {
      console.error("Fetch earnings error:", err);
      showToast("Unable to load earnings data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarningsData();
  }, [fetchEarningsData]);

  // Toggle restaurant open/closed
  const handleToggleStoreStatus = async () => {
    try {
      const next = !restaurant?.isOpen;
      const res = await api.patch("/merchant/restaurant/status", { isOpen: next });
      if (res.data?.success) {
        setRestaurant((prev) => (prev ? { ...prev, isOpen: next } : prev));
        showToast(next ? "Store is now OPEN." : "Store is now CLOSED.");
      }
    } catch (err) {
      console.error("Toggle store error:", err);
      showToast("Failed to update store status.");
    }
  };

  const todayEarnings = Number(metrics.todayRevenue || 0);
  const totalCompletedOrders = Number(
    metrics.completedOrders ?? completedOrdersList.length
  );
  const totalRecordedEarnings = Number(metrics.netRevenue || 0);

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
              Restaurant Earnings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Summary of completed food order revenues for {restaurant?.name || "your restaurant"}
            </p>
          </div>
        </div>

        {/* 1. Three Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Today's Earnings */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Today&apos;s Earnings
              </span>
              <span className="w-8 h-8 rounded-lg bg-orange-50 text-[#b12408] flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#151c27]">
                ₹{todayEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 mt-1">Recorded for today</p>
            </div>
          </div>

          {/* Card 2: Total Completed Orders */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Total Completed Orders
              </span>
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#151c27]">
                {totalCompletedOrders}
              </div>
              <p className="text-xs text-slate-500 mt-1">Delivered successfully</p>
            </div>
          </div>

          {/* Card 3: Total Recorded Earnings */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Total Recorded Earnings
              </span>
              <span className="w-8 h-8 rounded-lg bg-slate-100 text-[#151c27] flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#151c27]">
                ₹{totalRecordedEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 mt-1">All-time delivered order revenue</p>
            </div>
          </div>
        </div>

        {/* 2. Simple List of Completed Orders */}
        <section className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-[#151c27]">Completed Orders</h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {completedOrdersList.length}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#b12408]" />
              <p className="text-sm font-medium text-slate-600">Loading completed orders...</p>
            </div>
          ) : completedOrdersList.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
              <h3 className="text-base font-bold text-slate-700">No completed orders yet</h3>
              <p className="text-xs text-slate-400 mt-1">
                Completed and delivered orders will appear here along with their recorded earnings.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4 text-right">Order Amount</th>
                    <th className="py-3 px-4 text-right">Merchant Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {completedOrdersList.map((order) => {
                    const orderId = order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`;
                    const dateStr = new Date(order.createdAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const customerName = order.customer?.name || "Customer";
                    const amount = Number(order.totalAmount || 0);
                    const earnings = amount; // Full recorded store earnings

                    return (
                      <tr key={order._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-black text-[#151c27]">{orderId}</td>
                        <td className="py-3 px-4 text-slate-500">{dateStr}</td>
                        <td className="py-3 px-4 text-slate-800 font-semibold">{customerName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                            {order.paymentStatus || "PAID"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                          ₹{amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-700">
                          ₹{earnings.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Toast Notification */}
      <MenuToast message={toastMessage} onClose={() => setToastMessage("")} />
    </MerchantLayout>
  );
}
