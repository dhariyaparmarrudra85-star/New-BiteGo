import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";
import ExecutiveHeader from "../components/admin/ExecutiveHeader";
import KPIGrid from "../components/admin/KPIGrid";
import VelocityChart from "../components/admin/VelocityChart";
import ClusterDensity from "../components/admin/ClusterDensity";
import LiveOrdersTable from "../components/admin/LiveOrdersTable";
import OperationsCards from "../components/admin/OperationsCards";
import CustomerManagement from "../components/admin/CustomerManagement";
import DeliveryPartnerManagement from "../components/admin/DeliveryPartnerManagement";
import MerchantManagement from "../components/admin/MerchantManagement";
import api from "../services/api";

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const showToast = (message) => {
    setToastMessage(message);
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get("/admin/overview");
      if (res.data?.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Fetch stats error:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 20000); // 20s interval
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen selection:bg-primary selection:text-on-primary">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-lg border border-surface-container-high/40 animate-fade-in transition-all">
          <span className="material-symbols-outlined text-[20px] text-primary-fixed">
            info
          </span>
          <span className="font-label-md text-label-md font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-inverse-on-surface/70 hover:text-inverse-on-surface ml-2 p-0.5 cursor-pointer"
            aria-label="Dismiss toast"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* 1. Fixed Admin Sidebar */}
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onActionToast={showToast}
        activeNav={activeTab}
        onSelectTab={handleTabChange}
      />

      {/* Main Content Area (offset by sidebar width on lg screens) */}
      <div className="pl-0 lg:pl-72 min-h-screen flex flex-col bg-surface">
        {/* 2. Fixed Top Header */}
        <AdminHeader
          onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onActionToast={showToast}
        />

        {/* 3. Vertically Scrollable Content Canvas */}
        <main className="w-full pt-16 bg-surface px-space-lg py-space-lg flex-1">
          <div className="flex flex-col w-full gap-space-lg pb-space-2xl">
            {/* Executive Header & Operational Barometer */}
            <ExecutiveHeader onActionToast={showToast} stats={stats} />

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-2 p-1.5 bg-surface-container-lowest rounded-2xl border border-surface-container-high/40 shadow-xs overflow-x-auto no-scrollbar">
              {[
                { id: "overview", label: "Overview & Analytics", icon: "dashboard" },
                { id: "orders", label: "Live Orders Dispatch", icon: "receipt_long" },
                { id: "customers", label: "Customers", icon: "person" },
                { id: "delivery", label: "Delivery Fleet", icon: "two_wheeler" },
                { id: "merchants", label: "Approved Merchants", icon: "storefront" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-primary text-on-primary shadow-xs"
                      : "bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {activeTab === "overview" && (
              <>
                {/* 9 Real MongoDB KPI Cards Grid */}
                <KPIGrid stats={stats} loading={statsLoading} />

                {/* Deep Analytics Visualizations (Split 7 / 5 Columns) */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
                  <VelocityChart onActionToast={showToast} />
                  <ClusterDensity onActionToast={showToast} />
                </section>

                {/* Real-Time Live Order Dispatch Supervision Table */}
                <LiveOrdersTable onActionToast={showToast} />

                {/* Quick Platform Ops Drawer / Bottom Rail */}
                <OperationsCards onActionToast={showToast} />
              </>
            )}

            {/* Tab: Orders Dispatch */}
            {activeTab === "orders" && (
              <LiveOrdersTable onActionToast={showToast} />
            )}

            {/* Tab: Customers */}
            {activeTab === "customers" && (
              <CustomerManagement onActionToast={showToast} />
            )}

            {/* Tab: Delivery Partners */}
            {activeTab === "delivery" && (
              <DeliveryPartnerManagement onActionToast={showToast} />
            )}

            {/* Tab: Merchants */}
            {activeTab === "merchants" && (
              <MerchantManagement onActionToast={showToast} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
