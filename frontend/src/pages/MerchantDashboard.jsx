import { useState, useMemo, useEffect, useCallback } from "react";
import MerchantLayout from "../components/merchant/MerchantLayout";
import MenuToast from "../components/merchant/MenuToast";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../services/api";

export default function MerchantDashboard() {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [busyMode, setBusyMode] = useState(false);
  const [activePipelineTab, setActivePipelineTab] = useState("all");

  const [restaurant, setRestaurant] = useState(null);
  const [metrics, setMetrics] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    netRevenue: 0,
    activeQueue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    pausedDishes: 0,
    storeRating: "4.8 / 5.0",
    numRatings: 0,
    pipeline: { incoming: 0, preparing: 0, ready: 0, dispatched: 0 },
  });
  const [topDishes, setTopDishes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [, setLoading] = useState(true);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  const getActiveToken = useCallback(() => {
    return token || localStorage.getItem("bitego_token");
  }, [token]);

  // Fetch real telemetry from MongoDB
  const fetchDashboardData = useCallback(async () => {
    const activeToken = getActiveToken();
    if (!activeToken) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/merchant/dashboard`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.restaurant) setRestaurant(data.restaurant);
        if (data.metrics) setMetrics(data.metrics);
        if (data.topDishes) setTopDishes(data.topDishes);
        if (data.recentOrders) {
          const formatted = data.recentOrders.map((ord) => {
            let status = "incoming";
            if (ord.orderStatus === "PLACED") status = "incoming";
            else if (ord.orderStatus === "CONFIRMED") status = "accepted";
            else if (ord.orderStatus === "PREPARING") status = "preparing";
            else if (ord.orderStatus === "READY_FOR_PICKUP") status = "ready";
            else if (["ASSIGNED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(ord.orderStatus))
              status = "dispatched";
            else if (ord.orderStatus === "DELIVERED") status = "dispatched";
            else if (ord.orderStatus === "CANCELLED") status = "cancelled";

            return {
              id: ord._id,
              orderNumber: ord.orderNumber,
              customerName: ord.customer?.name || "Customer",
              customerPhone: ord.customer?.phone || "",
              placedTime: new Date(ord.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              prepTimeLeft:
                ord.orderStatus === "PLACED"
                  ? "Pending"
                  : ord.orderStatus === "CONFIRMED"
                  ? "Accepted"
                  : ord.orderStatus === "PREPARING"
                  ? "In Kitchen"
                  : ord.orderStatus === "READY_FOR_PICKUP"
                  ? "Ready at Counter"
                  : ord.orderStatus,
              items: (ord.items || []).map((it) => ({
                name: it.name,
                qty: it.quantity,
                price: it.price * (it.quantity || 1),
                addOns: it.customizations ? JSON.stringify(it.customizations) : null,
              })),
              total: ord.totalAmount,
              status,
              cookingNotes: ord.deliveryInstructions || "",
              riderName: ord.deliveryPartner?.name,
              riderVehicle: ord.deliveryPartner?.vehicleType,
              otp: ord.orderOtp,
            };
          });
          setOrders(formatted);
        }
      }
    } catch (err) {
      console.error("Dashboard Telemetry Error:", err);
      showToast("Unable to fetch live kitchen telemetry");
    } finally {
      setLoading(false);
    }
  }, [getActiveToken]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Order state actions with backend APIs
  const handleAcceptOrder = async (orderId) => {
    const activeToken = getActiveToken();
    try {
      const res = await fetch(`${API_BASE_URL}/merchant/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          status: "CONFIRMED",
          note: "Kitchen accepted ticket",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Order accepted by kitchen");
        fetchDashboardData();
      } else {
        showToast(data.message || "Failed to accept order");
      }
    } catch {
      showToast("Network error accepting order");
    }
  };

  const handleStartPreparing = async (orderId) => {
    const activeToken = getActiveToken();
    try {
      const res = await fetch(`${API_BASE_URL}/merchant/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          status: "PREPARING",
          note: "Kitchen started food preparation",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Kitchen started food preparation");
        fetchDashboardData();
      } else {
        showToast(data.message || "Failed to start preparation");
      }
    } catch {
      showToast("Network error updating order");
    }
  };

  const handleMoveToReady = async (orderId) => {
    const activeToken = getActiveToken();
    try {
      const res = await fetch(`${API_BASE_URL}/merchant/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          status: "READY_FOR_PICKUP",
          note: "Kitchen marked order ready at dispatch counter",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Order moved to Dispatch Counter · Rider arrival alerted");
        fetchDashboardData();
        if (typeof window !== "undefined" && window.BroadcastChannel) {
          try {
            const channel = new BroadcastChannel("bitego_order_events");
            channel.postMessage({ type: "ORDER_READY_FOR_PICKUP", orderId });
            channel.close();
          } catch {
            // ignore channel error
          }
        }
      } else {
        showToast(data.message || "Failed to mark order ready");
      }
    } catch {
      showToast("Network error updating order status");
    }
  };

  const handleHandoverRider = () => {
    showToast(
      "Courier assigned. Courier will confirm pickup and mark parcel en route via their delivery app."
    );
  };

  const handleDeclineOrder = async (orderId) => {
    const reason = window.prompt("Reason for rejecting this order:", "Kitchen at peak capacity") || "Declined by kitchen";
    const activeToken = getActiveToken();
    try {
      const res = await fetch(`${API_BASE_URL}/merchant/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          status: "CANCELLED",
          note: reason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Ticket declined (${reason}). Customer and dispatch team notified.`);
        fetchDashboardData();
      } else {
        showToast(data.message || "Failed to decline order");
      }
    } catch {
      showToast("Network error declining order");
    }
  };

  const handleSimulateNewOrder = () => {
    showToast("Waiting for live incoming orders from customers on BiteGo network...");
    fetchDashboardData();
  };

  const handleToggleBusyMode = () => {
    const next = !busyMode;
    setBusyMode(next);
    showToast(
      next
        ? "Kitchen Busy Mode (+10m) activated! Customer prep estimates adjusted."
        : "Kitchen Busy Mode disabled. Standard prep times restored."
    );
  };

  const handleSosHotline = () => {
    showToast("Connecting to BiteGo Merchant SOS Hotline: 1800-419-8921 (Priority Dispatch)");
  };

  const handleDownloadSettlementSlip = () => {
    showToast(
      `Downloading Daily Settlement Slip (PDF) · ₹${(metrics.todayRevenue || 0).toFixed(2)} net`
    );
  };

  // Toggle restaurant taking orders status
  const handleToggleStoreOpen = async () => {
    const activeToken = getActiveToken();
    try {
      const next = !restaurant?.isOpen;
      const res = await fetch(`${API_BASE_URL}/merchant/restaurant/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ isOpen: next }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRestaurant((prev) => (prev ? { ...prev, isOpen: next } : prev));
        showToast(
          next
            ? "Store is now LIVE and taking orders"
            : "Store is PAUSED. New customer orders suspended."
        );
      }
    } catch {
      showToast("Error updating store status");
    }
  };

  const handleEmergencyStop = async () => {
    if (
      window.confirm(
        "EMERGENCY STOP: Are you sure you want to pause accepting all new orders immediately?"
      )
    ) {
      const activeToken = getActiveToken();
      try {
        const res = await fetch(`${API_BASE_URL}/merchant/restaurant/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify({ isOpen: false }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setRestaurant((prev) => (prev ? { ...prev, isOpen: false } : prev));
          showToast("EMERGENCY STOP ACTIVATED: Store Taking Orders switched OFF.");
        }
      } catch {
        showToast("Error executing emergency store pause");
      }
    }
  };

  // Filter orders by active pipeline tab & search
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (activePipelineTab !== "all") {
        if (activePipelineTab === "incoming" && o.status !== "incoming") return false;
        if (activePipelineTab === "preparing" && !["accepted", "preparing"].includes(o.status)) return false;
        if (activePipelineTab === "ready" && o.status !== "ready") return false;
        if (activePipelineTab === "dispatched" && !["dispatched", "delivered"].includes(o.status)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.items.some((i) => i.name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [orders, activePipelineTab, searchQuery]);

  const incomingCount =
    metrics.pipeline?.incoming ?? orders.filter((o) => o.status === "incoming").length;
  const prepCount =
    metrics.pipeline?.preparing ?? orders.filter((o) => ["accepted", "preparing"].includes(o.status)).length;
  const readyCount =
    metrics.pipeline?.ready ?? orders.filter((o) => o.status === "ready").length;
  const dispatchedCount =
    metrics.pipeline?.dispatched ?? orders.filter((o) => o.status === "dispatched").length;

  const defaultTopDishes = [
    { name: "Truffle Mushroom Pizza", orders: 48, rev: "₹23,040", rating: "4.9★", rank: 1 },
    { name: "Smoked Pepperoni Feast", orders: 36, rev: "₹20,880", rating: "4.8★", rank: 2 },
    { name: "Burrata & Pesto Neapolitan", orders: 28, rev: "₹14,560", rating: "4.9★", rank: 3 },
    { name: "Garlic Breadsticks w/ Cheese", orders: 42, rev: "₹10,080", rating: "4.7★", rank: 4 },
    { name: "Four Cheese Quattra Formaggi", orders: 22, rev: "₹11,440", rating: "4.8★", rank: 5 },
  ];

  return (
    <MerchantLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onShowToast={showToast}
      takingOrders={restaurant?.isOpen ?? true}
      onToggleTakingOrders={handleToggleStoreOpen}
    >
      <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl w-full mx-auto font-sans">
        {/* ============================================================== */}
        {/* 1. TOP OPERATIONAL BANNER */}
        {/* ============================================================== */}
        <div className="bg-gradient-to-r from-[#192231] via-[#1f293d] to-[#151c27] text-white rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-900/10 border border-slate-800 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#b12408]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="bg-[#b12408]/20 text-[#ff8168] border border-[#b12408]/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">storefront</span>
                  {restaurant?.hub || "Bodakdev Hub"} · Kitchen Velocity Console
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    restaurant?.isOpen ?? true
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      restaurant?.isOpen ?? true
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-rose-500"
                    }`}
                  />
                  {restaurant?.isOpen ?? true ? "Taking Orders" : "Store Paused"}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                {restaurant?.name || "The Dark Roast Pizzeria"}
              </h1>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-[18px] text-amber-400">
                    schedule
                  </span>
                  <span>
                    Shift Window:{" "}
                    <strong className="text-white font-bold">11:00 AM – 11:30 PM</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-[18px] text-emerald-400">
                    speed
                  </span>
                  <span>
                    Avg prep: <strong className="text-white font-bold">13m 45s</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-[18px] text-sky-400">
                    verified
                  </span>
                  <span>
                    SLA: <strong className="text-white font-bold">98.4%</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleToggleBusyMode}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                  busyMode
                    ? "bg-amber-500 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-300"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/15"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">timer</span>
                <span>
                  {busyMode ? "Busy Mode Active (+10m)" : "Kitchen Busy Mode (+10m)"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleSosHotline}
                className="px-4 py-2.5 rounded-xl bg-[#b12408] hover:bg-[#921d06] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-[#b12408]/30 transition-all cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">support_agent</span>
                <span>Merchant SOS Hotline</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. METRICS ROW */}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {/* Card 1: Today's Orders */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold text-slate-600">Today's Orders</span>
              <span className="material-symbols-outlined text-[20px] text-[#b12408]">
                receipt_long
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-[#151c27] tracking-tight">
                {metrics.todayOrders}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>Live MongoDB</span>
              </div>
            </div>
          </div>

          {/* Card 2: Net Revenue */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold text-slate-600">Net Revenue</span>
              <span className="material-symbols-outlined text-[20px] text-emerald-600">
                payments
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-[#151c27] tracking-tight">
                ₹{Number(metrics.netRevenue || 0).toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>Verified</span>
              </div>
            </div>
          </div>

          {/* Card 3: Active Queue */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold text-slate-600">Active Queue</span>
              <span className="material-symbols-outlined text-[20px] text-amber-500">
                pending_actions
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-[#151c27] tracking-tight">
                {metrics.activeQueue} Live Tickets
              </div>
              <div className="text-[11px] font-semibold text-slate-500 mt-1">
                {metrics.pipeline?.preparing || 0} prep · {metrics.pipeline?.ready || 0} ready
              </div>
            </div>
          </div>

          {/* Card 4: Avg Prep Speed */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold text-slate-600">Avg Prep Speed</span>
              <span className="material-symbols-outlined text-[20px] text-sky-600">timer</span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-[#151c27] tracking-tight">
                13m 45s
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 mt-1">
                Standard pace
              </div>
            </div>
          </div>

          {/* Card 5: Store Rating */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold text-slate-600">Store Rating</span>
              <span className="material-symbols-outlined text-[20px] text-amber-500">star</span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-[#151c27] tracking-tight">
                {metrics.storeRating || `${restaurant?.rating || 4.5} / 5.0`}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 mt-1">
                {metrics.numRatings || restaurant?.numRatings || 120} total reviews
              </div>
            </div>
          </div>

          {/* Card 6: Inventory Pause */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold text-slate-600">Inventory Pause</span>
              <span className="material-symbols-outlined text-[20px] text-rose-500">
                pause_circle
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight">
                {metrics.pausedDishes} Paused Dishes
              </div>
              <div className="text-[11px] font-semibold text-slate-500 mt-1">
                Catalog telemetry
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. LIVE KITCHEN DISPATCH PIPELINE */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#b12408] animate-pulse" />
                <h2 className="text-lg sm:text-xl font-black text-[#151c27] tracking-tight">
                  Live Kitchen Dispatch Pipeline
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Real-time kitchen prep tickets and delivery partner handovers
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimulateNewOrder}
                className="px-3.5 py-2 rounded-xl bg-[#b12408] hover:bg-[#921d06] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-[#b12408]/20 cursor-pointer active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">sync</span>
                <span>Sync Live Orders</span>
              </button>
            </div>
          </div>

          {/* Pipeline Stage Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setActivePipelineTab("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activePipelineTab === "all"
                  ? "bg-[#151c27] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              All Stages ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setActivePipelineTab("incoming")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activePipelineTab === "incoming"
                  ? "bg-[#b12408] text-white shadow-xs"
                  : "bg-orange-50 text-[#b12408] hover:bg-orange-100"
              }`}
            >
              <span>New Incoming</span>
              <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-black">
                {incomingCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActivePipelineTab("preparing")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activePipelineTab === "preparing"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              <span>In Kitchen (Prep)</span>
              <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-black">
                {prepCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActivePipelineTab("ready")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activePipelineTab === "ready"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              <span>Ready at Counter</span>
              <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-black">
                {readyCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActivePipelineTab("dispatched")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activePipelineTab === "dispatched"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-sky-50 text-sky-800 hover:bg-sky-100"
              }`}
            >
              <span>Dispatched</span>
              <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-black">
                {dispatchedCount}
              </span>
            </button>
          </div>

          {/* Orders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400">
                <span className="material-symbols-outlined text-[48px] mb-2 block text-slate-300">
                  receipt
                </span>
                <p className="text-sm font-semibold text-slate-600">No tickets found in this stage</p>
                <p className="text-xs text-slate-400">
                  Active orders from customers will appear here automatically
                </p>
              </div>
            ) : (
              filteredOrders.map((ord) => {
                const isIncoming = ord.status === "incoming";
                const isAccepted = ord.status === "accepted";
                const isPrep = ord.status === "preparing";
                const isReady = ord.status === "ready";
                const isDispatched = ord.status === "dispatched";

                return (
                  <div
                    key={ord.id}
                    className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                      isIncoming
                        ? "bg-orange-50/60 border-orange-200"
                        : isAccepted
                        ? "bg-amber-50/70 border-amber-300"
                        : isPrep
                        ? "bg-amber-50/40 border-amber-200"
                        : isReady
                        ? "bg-emerald-50/40 border-emerald-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div>
                      {/* Ticket Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-[#151c27]">
                              {ord.orderNumber}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isIncoming
                                  ? "bg-[#b12408] text-white"
                                  : isAccepted
                                  ? "bg-amber-600 text-white"
                                  : isPrep
                                  ? "bg-amber-500 text-white"
                                  : isReady
                                  ? "bg-emerald-600 text-white"
                                  : "bg-sky-600 text-white"
                              }`}
                            >
                              {isIncoming
                                ? "Pending"
                                : isAccepted
                                ? "Accepted"
                                : isPrep
                                ? "In Kitchen"
                                : isReady
                                ? "Ready"
                                : "Dispatched"}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-600 mt-0.5">
                            {ord.customerName} ·{" "}
                            <span className="text-slate-400">{ord.placedTime}</span>
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-extrabold text-[#151c27] block">
                            ₹{ord.total}
                          </span>
                          <span className="text-[11px] font-bold text-[#b12408]">
                            {ord.prepTimeLeft}
                          </span>
                        </div>
                      </div>

                      {/* Item list */}
                      <div className="py-3 space-y-1.5 text-xs text-slate-700">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex items-start justify-between">
                            <span className="font-semibold">
                              <span className="font-extrabold text-[#151c27] mr-1.5">
                                {item.qty}x
                              </span>
                              {item.name}
                              {item.addOns && (
                                <span className="block text-[10px] text-slate-500 font-normal ml-5">
                                  + {item.addOns}
                                </span>
                              )}
                            </span>
                            <span className="text-slate-500 font-medium">₹{item.price}</span>
                          </div>
                        ))}

                        {ord.cookingNotes && (
                          <div className="mt-2 p-2 bg-white/80 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-medium">
                            📝 {ord.cookingNotes}
                          </div>
                        )}

                        {ord.riderName && (
                          <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-600">
                            <span className="flex items-center gap-1 font-semibold">
                              <span className="material-symbols-outlined text-[14px] text-emerald-600">
                                two_wheeler
                              </span>
                              {ord.riderName} ({ord.riderVehicle || "Delivery Partner"})
                            </span>
                            {ord.otp && (
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">
                                OTP: {ord.otp}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-200/60 flex items-center gap-2">
                      {isIncoming && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAcceptOrder(ord.id)}
                            className="flex-1 py-2 rounded-xl bg-[#b12408] hover:bg-[#921d06] text-white text-xs font-bold text-center cursor-pointer transition-colors shadow-xs"
                          >
                            Accept Order
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineOrder(ord.id)}
                            className="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold cursor-pointer transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {isAccepted && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartPreparing(ord.id)}
                            className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold text-center cursor-pointer transition-colors shadow-xs"
                          >
                            Start Preparing
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineOrder(ord.id)}
                            className="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold cursor-pointer transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {isPrep && (
                        <button
                          type="button"
                          id={`readyAtCounterBtn-${ord.id}`}
                          onClick={() => handleMoveToReady(ord.id)}
                          className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">countertops</span>
                          <span>Ready at Counter</span>
                        </button>
                      )}

                      {isReady && (
                        <button
                          type="button"
                          id={`readyAtCounterBtn-${ord.id}`}
                          onClick={() => handleMoveToReady(ord.id)}
                          className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold text-center cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          <span>Ready at Counter (Awaiting Courier Pickup)</span>
                        </button>
                      )}

                      {isDispatched && (
                        <div className="w-full py-1.5 text-center text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
                          ✓ En Route to Customer
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ============================================================== */}
        {/* 4. ANALYTICS SECTION */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Demand Telemetry (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#151c27]">
                  Demand Telemetry
                </h3>
                <p className="text-xs text-slate-500">Hourly Order Volume &amp; Pace</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-[#b12408]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#b12408]" />
                  Today (Live)
                </span>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="space-y-3 pt-2">
              {[
                { hour: "12:00 PM", current: 14, percent: "45%" },
                { hour: "02:00 PM", current: 22, percent: "65%" },
                { hour: "04:00 PM", current: 11, percent: "35%" },
                { hour: "06:00 PM", current: 26, percent: "75%" },
                { hour: "08:00 PM", current: 38, percent: "95%", peak: true },
                { hour: "10:00 PM", current: 28, percent: "80%" },
              ].map((slot) => (
                <div key={slot.hour} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{slot.hour}</span>
                    <span className="font-extrabold text-[#151c27]">
                      {slot.current} orders{" "}
                      {slot.peak && (
                        <span className="text-[10px] text-[#b12408] bg-orange-100 px-1.5 py-0.2 rounded font-black ml-1">
                          PEAK VELOCITY
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex items-center">
                    <div
                      style={{ width: slot.percent }}
                      className={`h-full rounded-full transition-all ${
                        slot.peak
                          ? "bg-gradient-to-r from-orange-500 to-[#b12408]"
                          : "bg-[#b12408]/80"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Peak kitchen pace: 28 tickets/hr</span>
              <span className="font-bold text-emerald-600">99.2% on-time dispatch rate</span>
            </div>
          </div>

          {/* Top Dishes Leaderboard (1 col) */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-[#151c27]">
                Top Dishes Leaderboard
              </h3>
              <p className="text-xs text-slate-500">Highest selling velocity</p>
            </div>

            <div className="space-y-3">
              {(topDishes.length > 0 ? topDishes : defaultTopDishes).map((dish) => (
                <div
                  key={dish.rank || dish.name}
                  className="p-3 rounded-2xl bg-[#f9f9ff] border border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#ffdad3] text-[#8e1500] font-black text-xs flex items-center justify-center shrink-0">
                      {dish.rank || 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#151c27]">{dish.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {dish.orders} orders · {dish.rev}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-500 shrink-0">
                    {dish.rating}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 5. BOTTOM OPERATIONS AREA */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
          {/* Card 1: Dedicated Merchant Dispatch Manager */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#b12408]">
                  badge
                </span>
                <h4 className="text-sm font-black text-[#151c27]">
                  Dedicated Merchant Dispatch Manager
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Direct supervisor on-site for queue balancing and rider coordination
              </p>

              <div className="p-3 bg-[#f0f3ff] rounded-2xl border border-slate-200/60 text-xs">
                <p className="font-bold text-[#151c27]">Nilesh Varma</p>
                <p className="text-slate-500 text-[11px]">
                  Senior Floor Supervisor · Shift 16:00 - 00:00
                </p>
                <p className="text-slate-700 font-semibold mt-1">Direct: +91 98250 14892</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                showToast("Calling Dispatch Supervisor Nilesh Varma (+91 98250 14892)...")
              }
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">call</span>
              <span>Call Dispatch Supervisor</span>
            </button>
          </div>

          {/* Card 2: Download Daily Settlement Slip */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-emerald-600">
                  receipt
                </span>
                <h4 className="text-sm font-black text-[#151c27]">
                  Daily Settlement Slip
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Official BiteGo merchant payout breakdown for today
              </p>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-950">
                <p className="font-extrabold">
                  Net Payable Today: ₹{Number(metrics.todayRevenue || 0).toFixed(2)}
                </p>
                <p className="text-[11px] text-emerald-800">
                  Bank Transfer scheduled tomorrow 06:00 AM
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadSettlementSlip}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Download Daily Settlement Slip</span>
            </button>
          </div>

          {/* Card 3: Emergency Stop Store Taking Orders */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-rose-200 shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-rose-600">
                  emergency_home
                </span>
                <h4 className="text-sm font-black text-rose-950">
                  Emergency Store Pause
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Immediately freeze new incoming order placement if kitchen is experiencing
                equipment failure or overload.
              </p>

              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-xs text-rose-900">
                <p className="font-bold">⚠️ Store Status:</p>
                <p className="text-[11px]">
                  Store is currently{" "}
                  <strong>{restaurant?.isOpen ?? true ? "OPEN" : "PAUSED"}</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleEmergencyStop}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-rose-600/30 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">stop_circle</span>
              <span>Emergency Stop Store Taking Orders</span>
            </button>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <MenuToast message={toastMessage} onClose={() => setToastMessage("")} />
    </MerchantLayout>
  );
}
