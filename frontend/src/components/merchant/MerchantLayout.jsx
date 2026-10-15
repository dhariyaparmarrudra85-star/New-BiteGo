import { useState } from "react";
import MerchantSidebar from "./MerchantSidebar";
import MerchantHeader from "./MerchantHeader";

export default function MerchantLayout({
  children,
  onAddItemClick,
  searchQuery = "",
  onSearchChange = () => {},
  onShowToast = () => {},
  takingOrders: externalTakingOrders,
  onToggleTakingOrders: externalOnToggleTakingOrders,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [localTakingOrders, setLocalTakingOrders] = useState(true);

  const takingOrders =
    externalTakingOrders !== undefined ? externalTakingOrders : localTakingOrders;

  const handleToggleTakingOrders = () => {
    if (externalOnToggleTakingOrders) {
      externalOnToggleTakingOrders();
    } else {
      const next = !localTakingOrders;
      setLocalTakingOrders(next);
      onShowToast(
        next
          ? "Store is now LIVE and taking orders"
          : "Store is PAUSED. New customer orders suspended."
      );
    }
  };

  return (
    <div className="bg-[#f9f9ff] text-[#151c27] min-h-screen flex flex-col font-sans selection:bg-[#b12408] selection:text-white">
      {/* 1. Left Fixed 288px Sidebar (Shared) */}
      <MerchantSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 2. Top Shared Header (Identical height 64px, identical controls) */}
      <MerchantHeader
        onOpenSidebar={() => setSidebarOpen(true)}
        takingOrders={takingOrders}
        onToggleTakingOrders={handleToggleTakingOrders}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onAddItemClick={onAddItemClick}
        onShowToast={onShowToast}
      />

      {/* 3. Main Page Content (Offset by 288px sidebar on lg and 64px header) */}
      <div className="lg:pl-72 pt-16 flex-1 flex flex-col min-w-0 transition-all">
        {children}
      </div>
    </div>
  );
}
