import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import FleetSidebar from "../components/fleet/FleetSidebar";
import FleetHeader from "../components/fleet/FleetHeader";
import ClusterBanner from "../components/fleet/ClusterBanner";
import FleetKpiCards from "../components/fleet/FleetKpiCards";
import FleetRadar from "../components/fleet/FleetRadar";
import IncomingDeliveryRadar from "../components/fleet/IncomingDeliveryRadar";
import ShiftLedger from "../components/fleet/ShiftLedger";
import EVTelemetry from "../components/fleet/EVTelemetry";
import RecentDrops from "../components/fleet/RecentDrops";
import { broadcastOrderEvent } from "../utils/orderEvents";

export default function FleetDashboard() {
  const { user, toggleDeliveryDuty } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnDuty, setIsOnDuty] = useState(user?.isOnline ?? true);
  const [toastMessage, setToastMessage] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
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
    }, 3000); // Polling for live radar drops
    const handleSync = () => {
      if (isMounted) loadDashboard();
    };
    window.addEventListener("focus", handleSync);
    window.addEventListener("visibilitychange", handleSync);

    // Cross-tab real-time event listener
    let channel = null;
    if (typeof window !== "undefined" && window.BroadcastChannel) {
      try {
        channel = new BroadcastChannel("bitego_order_events");
        channel.onmessage = (e) => {
          if (
            isMounted &&
            [
              "ORDER_READY_FOR_PICKUP",
              "ORDER_ACCEPTED",
              "ORDER_DECLINED",
              "ORDER_PICKED_UP",
              "ORDER_DELIVERED",
            ].includes(e.data?.type)
          ) {
            loadDashboard();
          }
        };
      } catch {
        // Fallback to polling
      }
    }

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("visibilitychange", handleSync);
      if (channel) channel.close();
    };
  }, []);

  const handleToggleDuty = async () => {
    const next = !isOnDuty;
    setIsOnDuty(next);
    try {
      await api.patch("/delivery/duty", { isOnline: next });
      if (toggleDeliveryDuty) {
        await toggleDeliveryDuty(next);
      }
      showToast(
        next
          ? "Duty status set to ONLINE. You are actively receiving priority drops."
          : "Duty status PAUSED. Break timer started. Incoming drops held."
      );
      loadDashboard();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Error updating duty status");
      setIsOnDuty(!next);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      // Optimistically remove from visible pool immediately and attach as active
      setDashboardData((prev) => {
        if (!prev) return prev;
        const acceptedOrd = (prev.availablePool || []).find(
          (o) => (o._id || o.id) === orderId
        );
        const nextPool = (prev.availablePool || []).filter(
          (o) => (o._id || o.id) !== orderId
        );
        return {
          ...prev,
          availablePool: nextPool,
          availableOrders: nextPool,
          activeOrder: acceptedOrd || prev.activeOrder,
        };
      });

      const res = await api.patch(`/delivery/orders/${orderId}/accept`);
      const data = res?.data || res;
      if (data?.success) {
        showToast("Delivery Mission Accepted! Routing to GPS cockpit...");
        broadcastOrderEvent("ORDER_ACCEPTED", orderId);
        await loadDashboard();
        setTimeout(() => {
          navigate("/fleet/active-delivery");
        }, 1000);
      } else {
        showToast(data?.message || "Failed to accept order");
        await loadDashboard();
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to accept order");
      await loadDashboard();
    }
  };

  const handleDeclineOrder = async (orderId) => {
    try {
      // Optimistically remove from visible pool immediately
      setDashboardData((prev) => {
        if (!prev) return prev;
        const nextPool = (prev.availablePool || []).filter(
          (o) => (o._id || o.id) !== orderId
        );
        return {
          ...prev,
          availablePool: nextPool,
          availableOrders: nextPool,
        };
      });

      const res = await api.patch(`/delivery/orders/${orderId}/decline`);
      const data = res?.data || res;
      if (data?.success) {
        showToast("Delivery request declined. Removed from your radar.");
        broadcastOrderEvent("ORDER_DECLINED", orderId);
      } else {
        showToast(data?.message || "Failed to decline order");
        await loadDashboard();
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to decline order");
      await loadDashboard();
    }
  };

  const handlePickupOrder = async (orderId) => {
    try {
      const res = await api.patch(`/delivery/orders/${orderId}/pickup`);
      const data = res?.data || res;
      if (data?.success) {
        showToast("Food picked up from restaurant kitchen! Ready for delivery.", "takeout_dining");
        loadDashboard();
      } else {
        showToast(data?.message || "Failed to pick up food");
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to pick up food");
    }
  };

  const handleOutForDeliveryOrder = async (orderId) => {
    try {
      const res = await api.patch(`/delivery/orders/${orderId}/out-for-delivery`);
      const data = res?.data || res;
      if (data?.success) {
        showToast("Order is now Out for Delivery! Heading to customer.", "navigation");
        loadDashboard();
      } else {
        showToast(data?.message || "Failed to start delivery");
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to start delivery");
    }
  };

  const handlePayout = () => {
    const net = dashboardData?.stats?.todayEarnings || 1420;
    showToast(`₹${net.toFixed(2)} payout initiated to registered UPI · Instant Transfer`);
  };

  const handleRouteCharging = () => {
    showToast("Routing to Ather Grid Bodakdev Hub (1.1 km away). Fast charging bay 2 reserved.");
  };

  const handleViewAllDrops = () => {
    const count = dashboardData?.stats?.completedTrips || 8;
    showToast(`Showing all ${count} completed drops for today's shift.`);
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col font-sans selection:bg-primary selection:text-white antialiased">
      {/* 1. LEFT SIDEBAR (288px Fixed Desktop / Responsive Mobile Drawer) */}
      <FleetSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isOnDuty={isOnDuty}
        onToggleDuty={handleToggleDuty}
      />

      {/* 2. TOP HEADER (64px Fixed Header) */}
      <FleetHeader
        onOpenSidebar={() => setSidebarOpen(true)}
        isOnDuty={isOnDuty}
        onShowNotification={() => showToast("3 active updates: Rain surge extended until 11:30 PM.")}
      />

      {/* 3. MAIN DASHBOARD CONTENT */}
      <div className="lg:pl-72 pt-16 flex-1 flex flex-col min-w-0 transition-all">
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto flex-1">
          {/* Active Order Prompt if an order is currently in transit */}
          {dashboardData?.activeOrder && (
            <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">navigation</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-on-surface">
                    Mission in Progress: #{dashboardData.activeOrder.orderNumber || dashboardData.activeOrder._id.slice(-6).toUpperCase()}
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    Status: <strong className="text-primary uppercase font-bold">{dashboardData.activeOrder.orderStatus?.replace(/_/g, " ")}</strong> • {dashboardData.activeOrder.restaurant?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {dashboardData.activeOrder.orderStatus === "ACCEPTED" && (
                  <button
                    type="button"
                    onClick={() => handlePickupOrder(dashboardData.activeOrder._id)}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">takeout_dining</span>
                    <span>Pick Up Food</span>
                  </button>
                )}

                {dashboardData.activeOrder.orderStatus === "PICKED_UP" && (
                  <button
                    type="button"
                    onClick={() => handleOutForDeliveryOrder(dashboardData.activeOrder._id)}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">electric_moped</span>
                    <span>Start Delivery</span>
                  </button>
                )}

                {dashboardData.activeOrder.orderStatus === "OUT_FOR_DELIVERY" && (
                  <button
                    type="button"
                    onClick={() => navigate("/fleet/active-delivery")}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">pin</span>
                    <span>Verify OTP</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate("/fleet/active-delivery")}
                  className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>Cockpit</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Cluster State & Active Dispatch Banner */}
          <ClusterBanner
            isOnDuty={isOnDuty}
            onToggleDuty={handleToggleDuty}
          />

          {/* KPI Metric Row (5 Cards) */}
          <FleetKpiCards stats={dashboardData?.stats} />

          {/* Main 2-Column Responsive Layout (8 cols left / 4 cols right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Live Radar & Incoming Order Stack (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Interactive Heatmap / Radar Graphic Panel */}
              <FleetRadar />

              {/* Radar Incoming Stack / Active Requests */}
              <IncomingDeliveryRadar
                onShowToast={showToast}
                orders={dashboardData?.availablePool}
                activeOrder={dashboardData?.activeOrder}
                isOnDuty={isOnDuty}
                onToggleDuty={handleToggleDuty}
                onAcceptOrder={handleAcceptOrder}
                onDeclineOrder={handleDeclineOrder}
                onPickupOrder={handlePickupOrder}
                onOutForDelivery={handleOutForDeliveryOrder}
              />
            </div>

            {/* RIGHT COLUMN: Ledger Breakdown, EV Telemetry, Recent Drops (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Shift Earnings & Payout Breakdown */}
              <ShiftLedger onPayoutClick={handlePayout} stats={dashboardData?.stats} />

              {/* Vehicle & EV Telemetry Card */}
              <EVTelemetry onRouteClick={handleRouteCharging} />

              {/* Recent Completed Drops Log */}
              <RecentDrops onViewAllClick={handleViewAllDrops} drops={dashboardData?.recentDrops} />
            </div>
          </div>
        </main>
      </div>

      {/* Floating Action Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage("")}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
