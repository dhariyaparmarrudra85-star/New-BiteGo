import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import FleetSidebar from "../components/fleet/FleetSidebar";
import FleetHeader from "../components/fleet/FleetHeader";
import MissionHeader from "../components/fleet/MissionHeader";
import NavigationMap from "../components/fleet/NavigationMap";
import CustomerDropoff from "../components/fleet/CustomerDropoff";
import OrderChecklist from "../components/fleet/OrderChecklist";
import FinancialClearance from "../components/fleet/FinancialClearance";
import DeliveryOtp from "../components/fleet/DeliveryOtp";
import { broadcastOrderEvent } from "../utils/orderEvents";

export default function ActiveDelivery() {
  const { user, toggleDeliveryDuty } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnDuty, setIsOnDuty] = useState(user?.isOnline ?? true);
  const [toast, setToast] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (message, icon = "check_circle", isError = false) => {
    setToast({ message, icon, isError });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const loadActiveMission = async () => {
    try {
      const res = await api.get("/delivery/dashboard");
      const data = res?.data || res;
      if (data?.success) {
        if (data.dutyStatus) {
          setIsOnDuty(data.dutyStatus.isOnline);
        }
        if (data.activeOrder) {
          setActiveOrder(data.activeOrder);
        } else {
          setActiveOrder(null);
        }
      }
    } catch (err) {
      console.error("Failed to load active mission:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveMission();
    const interval = setInterval(loadActiveMission, 4000);
    return () => clearInterval(interval);
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
          ? "Duty status set to ONLINE. Actively tracking transit."
          : "Duty status PAUSED. Break timer started.",
        next ? "toggle_on" : "pause_circle"
      );
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to toggle duty", "error", true);
      setIsOnDuty(!next);
    }
  };

  const handlePickup = async () => {
    if (!activeOrder) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/delivery/orders/${activeOrder._id}/pickup`);
      const data = res?.data || res;
      if (data?.success) {
        setActiveOrder(data.order);
        broadcastOrderEvent("ORDER_PICKED_UP", activeOrder._id);
        showToast("Order picked up from kitchen! Heading to customer location.", "takeout_dining");
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Error picking up order", "error", true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOutForDelivery = async () => {
    if (!activeOrder) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/delivery/orders/${activeOrder._id}/out-for-delivery`);
      const data = res?.data || res;
      if (data?.success) {
        setActiveOrder(data.order);
        broadcastOrderEvent("ORDER_OUT_FOR_DELIVERY", activeOrder._id);
        showToast("En route to customer dropoff! GPS navigation active.", "navigation");
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Error updating transit status", "error", true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOtp = async (otpCode) => {
    if (!activeOrder) return false;
    setActionLoading(true);
    try {
      const res = await api.post(`/delivery/orders/${activeOrder._id}/verify-otp`, { otp: otpCode });
      const data = res?.data || res;
      if (data?.success) {
        const earningAmount = data.earning?.totalEarning || (activeOrder.deliveryFee + 45);
        broadcastOrderEvent("ORDER_DELIVERED", activeOrder._id);
        showToast(`Delivery completed! ₹${earningAmount} credited to earnings.`, "verified");
        setActiveOrder(null);
        setTimeout(() => {
          navigate("/fleet/dashboard");
        }, 1800);
        return true;
      }
      return false;
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Invalid delivery OTP. Please verify with customer.", "error", true);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-background font-body-md text-on-surface min-h-screen flex flex-col font-sans selection:bg-primary selection:text-white antialiased">
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
        onShowNotification={() =>
          showToast("Live transit update: Customer notified of approaching fleet partner.", "notifications")
        }
      />

      {/* 3. MAIN COCKPIT BODY */}
      <div className="lg:pl-72 pt-16 flex-1 flex flex-col min-w-0 transition-all">
        <main className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-[1600px] w-full mx-auto flex-1">
          {!activeOrder ? (
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-slate-200 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px]">task_alt</span>
              </div>
              <h2 className="text-xl font-bold text-on-surface">No Active Delivery Mission</h2>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                You currently do not have an ongoing delivery assignment. Return to the Radar Dashboard to accept available drops or wait for priority dispatches.
              </p>
              <button
                type="button"
                onClick={() => navigate("/fleet/dashboard")}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm transition-all shadow-md cursor-pointer"
              >
                Go to Radar Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Active Mission Progress Bar Header & Stepper */}
              <MissionHeader
                order={activeOrder}
                onPickup={handlePickup}
                onOutForDelivery={handleOutForDelivery}
                actionLoading={actionLoading}
              />

              {/* Primary 60/40 Split Cockpit */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
                {/* LEFT PANEL: High Precision Vector GPS Navigation HUD (7 cols = ~60%) */}
                <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-6">
                  <NavigationMap onShowToast={showToast} />
                </div>

                {/* RIGHT PANEL: Drop-off, Customer Communication, Verification & Handover (5 cols = ~40%) */}
                <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6">
                  <CustomerDropoff onShowToast={showToast} order={activeOrder} />
                  <OrderChecklist items={activeOrder?.items} />
                  <FinancialClearance order={activeOrder} />
                  <div id="deliveryOtpSection">
                    <DeliveryOtp
                      onShowToast={showToast}
                      onVerifyOtp={handleVerifyOtp}
                      order={activeOrder}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Interactive Toast Notification Container */}
      <div
        className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 bg-inverse-surface text-inverse-on-surface px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700/80 ${
          toast
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-32 opacity-0 pointer-events-none"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[24px] ${
            toast?.isError ? "text-error" : "text-tertiary-fixed"
          }`}
        >
          {toast?.icon || "check_circle"}
        </span>
        <span className="text-sm font-semibold">{toast?.message}</span>
      </div>
    </div>
  );
}
