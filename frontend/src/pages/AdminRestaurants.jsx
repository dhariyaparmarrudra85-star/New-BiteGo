import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";
import RestaurantPageHeader from "../components/admin/restaurants/RestaurantPageHeader";
import RestaurantFilterToolbar from "../components/admin/restaurants/RestaurantFilterToolbar";
import RestaurantMetricRibbon from "../components/admin/restaurants/RestaurantMetricRibbon";
import UrgentActionPipeline from "../components/admin/restaurants/UrgentActionPipeline";
import MasterRestaurantDirectory from "../components/admin/restaurants/MasterRestaurantDirectory";
import CommissionInspectorDrawer from "../components/admin/restaurants/CommissionInspectorDrawer";

export default function AdminRestaurants() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Filter toolbar state
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleExportLedger = () => {
    showToast("Restaurant ledger export prepared.");
  };

  const handleBulkCommission = () => {
    setSelectedRestaurant({
      id: "BULK-AHM",
      name: "Ahmedabad Central Merchant Pool",
      emoji: "🏪",
      hub: "All Hubs",
      fssaiStatus: "Approved ✓",
      payoutEst: "₹3,42,100",
      bank: "Escrow Pool Batch",
      commission: "18.0%",
    });
    setIsDrawerOpen(true);
    showToast("Bulk commission controls opened.");
  };

  const handleRegisterOutlet = () => {
    setSelectedRestaurant({
      id: "REST-0843",
      name: "New Partner Onboarding",
      emoji: "🏪",
      hub: "Ahmedabad Core",
      fssaiStatus: "Pending Verification",
      payoutEst: "₹0",
      bank: "Bank Mandate Pending",
      commission: "18.0%",
    });
    setIsDrawerOpen(true);
  };

  const handleOpenRateInspector = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsDrawerOpen(true);
  };

  const handleSaveDrawerAdjustments = (newRate, restaurant) => {
    setIsDrawerOpen(false);
    showToast(
      `Commission rate for ${restaurant.name} adjusted to ${Number(newRate).toFixed(1)}%`
    );
  };

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
        activeNav="restaurants"
      />

      {/* Main Content Area */}
      <div className="pl-0 lg:pl-72 min-h-screen flex flex-col bg-surface">
        {/* 2. Fixed Top Header */}
        <AdminHeader
          onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onActionToast={showToast}
        />

        {/* 3. Main Dashboard Content */}
        <main className="w-full pt-16 bg-surface px-space-lg py-space-lg flex-1">
          <div className="flex flex-col w-full gap-space-lg pb-space-2xl">
            {/* Operational Header */}
            <RestaurantPageHeader
              onExportLedger={handleExportLedger}
              onBulkCommission={handleBulkCommission}
              onRegisterOutlet={handleRegisterOutlet}
            />

            {/* Filter & Search Toolbar */}
            <RestaurantFilterToolbar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {/* Metric Ribbon */}
            <RestaurantMetricRibbon />

            {/* Urgent Action Pipeline: Pending Onboarding Applications */}
            <UrgentActionPipeline onActionToast={showToast} />

            {/* Master Restaurant Directory Table Section */}
            <MasterRestaurantDirectory
              onOpenRateInspector={handleOpenRateInspector}
              onActionToast={showToast}
              filterStatus={activeFilter}
              searchQuery={searchQuery}
            />
          </div>
        </main>
      </div>

      {/* 4. Side Inspector Preview / Drawer Overlay */}
      <CommissionInspectorDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveDrawerAdjustments}
        restaurant={selectedRestaurant}
      />
    </div>
  );
}
