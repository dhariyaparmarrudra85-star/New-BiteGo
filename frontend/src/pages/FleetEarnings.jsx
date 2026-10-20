import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import FleetSidebar from "../components/fleet/FleetSidebar";
import FleetHeader from "../components/fleet/FleetHeader";
import {
  Wallet,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Coins,
  ArrowRight,
} from "lucide-react";

export default function FleetEarnings() {
  const { user } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnDuty, setIsOnDuty] = useState(user?.isOnline ?? true);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [completedDeliveries, setCompletedDeliveries] = useState(0);
  const [earningsHistory, setEarningsHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const [dashRes, histRes] = await Promise.all([
        api.get("/delivery/dashboard"),
        api.get("/delivery/history"),
      ]);

      const dashData = dashRes?.data || dashRes;
      if (dashData?.success) {
        if (dashData.dutyStatus) {
          setIsOnDuty(dashData.dutyStatus.isOnline);
        }
        setTodayEarnings(
          dashData.stats?.todayEarnings ?? dashData.earnings?.todayEarnings ?? 0
        );
        setCompletedDeliveries(
          dashData.stats?.completedTrips ??
            dashData.earnings?.completedDeliveries ??
            0
        );
      }

      const histData = histRes?.data || histRes;
      if (histData?.success && Array.isArray(histData.history)) {
        setEarningsHistory(histData.history);
      } else {
        setEarningsHistory([]);
      }
    } catch (err) {
      console.error("Failed to load earnings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEarnings();
  }, []);

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
                Earnings
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Actual delivery payouts and completed trips recorded in your wallet
              </p>
            </div>

            <button
              type="button"
              onClick={loadEarnings}
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* 2 SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Card 1: Today's Earnings */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Today's Earnings
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-[#151c27] mt-1 block">
                  {loading ? "..." : `₹${todayEarnings}`}
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Credited for today's deliveries
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Total Completed Deliveries */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Total Completed Deliveries
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-[#151c27] mt-1 block">
                  {loading ? "..." : completedDeliveries}
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Successfully handed over with customer PIN
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#b12408] flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* BASIC LIST OF COMPLETED DELIVERIES & RECORDED EARNINGS */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#151c27]">
              Completed Delivery Earnings Ledger
            </h2>

            {/* LOADING STATE */}
            {loading && (
              <div className="py-16 text-center space-y-3">
                <div className="w-10 h-10 rounded-full border-3 border-orange-200 border-t-[#b12408] animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-500">
                  Loading recorded earnings...
                </p>
              </div>
            )}

            {/* EMPTY STATE */}
            {!loading && earningsHistory.length === 0 && (
              <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Coins className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  No completed delivery earnings yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Deliveries you complete will automatically be recorded here with your earnings breakdown.
                </p>
                <div className="pt-2">
                  <Link
                    to="/fleet/available-orders"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#b12408] text-white font-bold text-xs"
                  >
                    <span>Check Available Orders</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* EARNINGS LIST */}
            {!loading && earningsHistory.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                {earningsHistory.map((item) => (
                  <div
                    key={item._id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-[#151c27]">
                          Order #{item.orderNumber || item.order?.orderNumber || "COMPLETED"}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                          Credited
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(item.createdAt)}</span>
                        {item.distanceKm && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>{item.distanceKm} km</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 text-xs border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <div className="text-left sm:text-right text-slate-500 space-x-2 sm:space-x-3">
                        <span>Base: ₹{item.baseFee || 45}</span>
                        {item.surgeBonus > 0 && (
                          <span>Surge: ₹{item.surgeBonus}</span>
                        )}
                        {item.tipAmount > 0 && (
                          <span className="text-orange-600 font-semibold">Tip: ₹{item.tipAmount}</span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-emerald-600">
                          +₹{item.totalEarning || 60}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
