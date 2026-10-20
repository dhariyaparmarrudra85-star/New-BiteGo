import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import FleetSidebar from "../components/fleet/FleetSidebar";
import FleetHeader from "../components/fleet/FleetHeader";
import {
  Inbox,
  Bike,
  Wallet,
  ArrowRight,
  Power,
  Store,
  MapPin,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function FleetDashboard() {
  const { user, toggleDeliveryDuty } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnDuty, setIsOnDuty] = useState(user?.isOnline ?? true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const loadDashboard = async () => {
    try {
      const res = await api.get("/delivery/dashboard");
      const data = res?.data || res;
      if (data?.success) {
        setDashboardData(data);
        if (data.dutyStatus) {
          setIsOnDuty(data.dutyStatus.isOnline);
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadDashboard();
    const interval = setInterval(() => {
      if (isMounted) loadDashboard();
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleToggleDuty = async () => {
    const next = !isOnDuty;
    setToggleLoading(true);
    setIsOnDuty(next);
    try {
      await api.patch("/delivery/duty", { isOnline: next });
      if (toggleDeliveryDuty) {
        await toggleDeliveryDuty(next);
      }
      showToast(next ? "You are now ONLINE and ready to receive orders." : "You are now OFFLINE.");
      loadDashboard();
    } catch (err) {
      console.error("Failed to toggle duty:", err);
      setIsOnDuty(!next);
      showToast("Error updating duty status. Please try again.");
    } finally {
      setToggleLoading(false);
    }
  };

  const availableOrdersCount = dashboardData?.availableOrders?.length || 0;
  const activeOrder = dashboardData?.activeOrder || dashboardData?.currentOrder || null;
  const todayEarnings = dashboardData?.stats?.todayEarnings ?? dashboardData?.earnings?.todayEarnings ?? 0;

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
        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
          {/* Page Greeting & Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#151c27] tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Welcome back, <span className="font-semibold text-slate-700">{user?.name || "Delivery Partner"}</span>. Here is your daily delivery summary.
            </p>
          </div>

          {/* 3 SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {/* Card 1: Available Orders */}
            <Link
              to="/fleet/available-orders"
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-orange-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Available Orders
                </span>
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#b12408] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Inbox className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-[#151c27]">
                  {loading ? "..." : availableOrdersCount}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ready for pickup
                </p>
              </div>
            </Link>

            {/* Card 2: Active Delivery */}
            <Link
              to={activeOrder ? "/fleet/active-delivery" : "/fleet/available-orders"}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-orange-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Active Delivery
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Bike className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-[#151c27]">
                  {loading ? "..." : (activeOrder ? "1 Active" : "None")}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeOrder ? "In progress" : "No ongoing trip"}
                </p>
              </div>
            </Link>

            {/* Card 3: Today's Earnings */}
            <Link
              to="/fleet/earnings"
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-orange-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Today's Earnings
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-[#151c27]">
                  {loading ? "..." : `₹${todayEarnings}`}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Earned today
                </p>
              </div>
            </Link>
          </div>

          {/* ONLINE / OFFLINE TOGGLE */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  isOnDuty
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-slate-100 text-slate-500 border border-slate-200"
                }`}
              >
                <Power className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#151c27]">
                  Duty Status: {isOnDuty ? "ONLINE" : "OFFLINE"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isOnDuty
                    ? "You are online and available to receive delivery orders."
                    : "You are offline. Switch to Online to receive available orders."}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={toggleLoading}
              onClick={handleToggleDuty}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer active:scale-95 flex items-center justify-center gap-2 ${
                isOnDuty
                  ? "bg-slate-800 hover:bg-slate-900 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              <span>{isOnDuty ? "Go Offline" : "Go Online"}</span>
            </button>
          </div>

          {/* CURRENT ACTIVE DELIVERY SECTION */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#151c27]">
              Current Delivery
            </h2>

            {activeOrder ? (
              <div className="bg-white rounded-2xl p-6 border-2 border-orange-300 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-[#151c27]">
                      Order #{activeOrder.orderNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#b12408] text-xs font-bold uppercase tracking-wider">
                      {activeOrder.orderStatus === "PICKED_UP" || activeOrder.orderStatus === "OUT_FOR_DELIVERY"
                        ? "Delivering to Customer"
                        : "Go to Restaurant"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>In progress</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Restaurant details */}
                  <div className="bg-slate-50 p-4 rounded-xl space-y-1.5 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Pickup Restaurant
                    </span>
                    <div className="flex items-start gap-2">
                      <Store className="w-4 h-4 text-[#b12408] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {activeOrder.restaurant?.name || "BiteGo Restaurant"}
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {activeOrder.restaurant?.address || "Ahmedabad Kitchen"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Customer details */}
                  <div className="bg-slate-50 p-4 rounded-xl space-y-1.5 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Customer Drop-off
                    </span>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {activeOrder.customer?.name || activeOrder.deliveryAddress?.fullName || "Customer"}
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {activeOrder.deliveryAddress
                            ? `${activeOrder.deliveryAddress.houseFlat}, ${activeOrder.deliveryAddress.area}`
                            : "Customer Address"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prominent Action Button to Continue Delivery */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/fleet/active-delivery")}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#b12408] hover:bg-[#931f07] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Continue Delivery</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Bike className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  No active delivery. Check available orders.
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You are not currently delivering an order. Browse the Available Orders tab to pick up your next delivery.
                </p>
                <div className="pt-2">
                  <Link
                    to="/fleet/available-orders"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#151c27] hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Check Available Orders</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Simple Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#151c27] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
