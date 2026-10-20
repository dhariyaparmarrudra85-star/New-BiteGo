import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import FleetSidebar from "../components/fleet/FleetSidebar";
import FleetHeader from "../components/fleet/FleetHeader";
import {
  Bike,
  Store,
  MapPin,
  Calendar,
  Wallet,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

export default function FleetDeliveries() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnDuty, setIsOnDuty] = useState(user?.isOnline ?? true);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("all"); // 'all', 'active', 'completed'
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const res = await api.get("/delivery/history");
      const data = res?.data || res;
      if (data?.success && Array.isArray(data.deliveries)) {
        setDeliveries(data.deliveries);
      } else {
        setDeliveries([]);
      }
    } catch (err) {
      console.error("Failed to load deliveries:", err);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  // Filtered deliveries
  const filteredDeliveries = useMemo(() => {
    if (filterTab === "active") {
      return deliveries.filter((d) => d.isActive);
    }
    if (filterTab === "completed") {
      return deliveries.filter((d) => d.status === "Delivered");
    }
    return deliveries;
  }, [deliveries, filterTab]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Delivered":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </span>
        );
      case "Picked Up":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Picked Up</span>
          </span>
        );
      case "Accepted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Accepted</span>
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recent";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
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
                My Deliveries
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Your assigned, active, and completed delivery missions
              </p>
            </div>

            <button
              type="button"
              onClick={loadDeliveries}
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Simple Filters: All / Active / Completed */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === "all"
                  ? "bg-[#151c27] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              All Deliveries ({deliveries.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("active")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === "active"
                  ? "bg-[#151c27] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Active ({deliveries.filter((d) => d.isActive).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("completed")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === "completed"
                  ? "bg-[#151c27] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Completed ({deliveries.filter((d) => d.status === "Delivered").length})
            </button>
          </div>

          {/* LOADING STATE */}
          {loading && (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-3 border-orange-200 border-t-[#b12408] animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">
                Loading your delivery history...
              </p>
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && filteredDeliveries.length === 0 && (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Bike className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No deliveries found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {filterTab === "active"
                  ? "You have no active orders in transit right now."
                  : "You have not completed any deliveries yet. Accepted orders will show up here."}
              </p>
              {filterTab === "active" && (
                <div className="pt-2">
                  <Link
                    to="/fleet/available-orders"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#b12408] text-white font-bold text-xs"
                  >
                    <span>Check Available Orders</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* DELIVERIES LIST */}
          <div className="space-y-3">
            {filteredDeliveries.map((delivery) => (
              <div
                key={delivery._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
              >
                {/* Left: Info */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-extrabold text-[#151c27]">
                      Order #{delivery.orderNumber}
                    </span>
                    {getStatusBadge(delivery.status)}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <Store className="w-3.5 h-3.5 text-[#b12408]" />
                      <span>{delivery.restaurantName}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(delivery.deliveryDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Earnings & Details Button */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-400 font-medium block">
                      Earnings
                    </span>
                    <span className="text-sm font-extrabold text-emerald-600">
                      {delivery.earnings ? `₹${delivery.earnings}` : (delivery.isActive ? "In Transit" : "—")}
                    </span>
                  </div>

                  {delivery.isActive ? (
                    <Link
                      to="/fleet/active-delivery"
                      className="px-4 py-2 rounded-xl bg-[#b12408] hover:bg-[#931f07] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Active Trip
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(delivery)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* DELIVERY DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Order #{selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {formatDate(selectedOrder.deliveryDate)}
                </p>
              </div>
              {getStatusBadge(selectedOrder.status)}
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl space-y-1 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Restaurant
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  {selectedOrder.restaurantName}
                </p>
                <p className="text-slate-500">{selectedOrder.restaurantAddress}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl space-y-1 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Customer Drop-off
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  {selectedOrder.customerName}
                </p>
                <p className="text-slate-500">{selectedOrder.customerAddress}</p>
              </div>

              <div className="flex justify-between items-center p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100">
                <span className="font-bold">Total Earnings</span>
                <span className="text-base font-black">
                  {selectedOrder.earnings ? `₹${selectedOrder.earnings}` : "—"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
