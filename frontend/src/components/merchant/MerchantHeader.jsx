import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MerchantHeader({
  onOpenSidebar = () => {},
  takingOrders = true,
  onToggleTakingOrders = () => {},
  searchQuery = "",
  onSearchChange = () => {},
  onAddItemClick,
  onShowToast = () => {},
}) {
  const navigate = useNavigate();
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [notificationCount] = useState(4);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleToggleSound = () => {
    setSoundAlerts(!soundAlerts);
    onShowToast(soundAlerts ? "Kitchen buzzer sound muted" : "Kitchen buzzer sound enabled");
  };

  const handleNotificationClick = () => {
    onShowToast("4 active kitchen updates: 2 incoming tickets, 2 rider arrivals at Bodakdev");
  };

  const handleAddItem = () => {
    if (onAddItemClick) {
      onAddItemClick();
    } else {
      navigate("/merchant/menu?add=true");
    }
  };

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-[#f9f9ff]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-slate-200/60 font-sans">
      {/* Left: Mobile hamburger & Search Area */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        {/* Global Search Bar */}
        <div className="relative w-56 sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 pointer-events-none">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-white rounded-xl text-xs sm:text-sm text-[#151c27] placeholder:text-slate-400 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#b12408]/20 focus:border-[#b12408]/50 transition-all shadow-xs"
            placeholder="Search orders, menu items, or tickets..."
            type="text"
          />
        </div>

        {/* Shift Badge Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 bg-[#f0f3ff] px-3.5 py-1.5 rounded-full text-slate-600 text-xs font-semibold border border-slate-200/60">
          <span className="material-symbols-outlined text-[16px] text-slate-500">
            schedule
          </span>
          <span>Today: Lunch &amp; Dinner Shift (11:00 AM - 11:30 PM)</span>
        </div>
      </div>

      {/* Right: Operational Controls */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">
        {/* Taking Orders Toggle */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-slate-200/80">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              takingOrders ? "bg-[#006947] animate-pulse" : "bg-rose-500"
            }`}
          />
          <span className="text-xs font-bold text-[#151c27] hidden sm:inline">
            {takingOrders ? "Taking Orders" : "Store Paused"}
          </span>
          <label className="relative inline-flex items-center cursor-pointer ml-0.5 sm:ml-1">
            <input
              checked={takingOrders}
              onChange={onToggleTakingOrders}
              className="sr-only peer"
              type="checkbox"
            />
            <div className="w-8 sm:w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#006947]" />
          </label>
        </div>

        {/* Sound Alerts Button */}
        <button
          aria-label="Sound Alerts"
          onClick={handleToggleSound}
          title={soundAlerts ? "Mute sound alerts" : "Unmute sound alerts"}
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-[#151c27] transition-colors cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-[19px] sm:text-[20px]">
            {soundAlerts ? "volume_up" : "volume_off"}
          </span>
          {soundAlerts && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#b12408]" />
          )}
        </button>

        {/* Notifications Button */}
        <button
          aria-label="Order Notifications"
          onClick={handleNotificationClick}
          title="Kitchen notifications"
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-[#151c27] transition-colors cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-[19px] sm:text-[20px]">
            notifications
          </span>
          <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-4 h-4 rounded-full bg-[#b12408] text-white text-[10px] flex items-center justify-center font-bold">
            {notificationCount}
          </span>
        </button>

        {/* Add New Item Button */}
        <button
          onClick={handleAddItem}
          className="flex items-center gap-1.5 bg-[#b12408] hover:bg-[#921d06] text-white px-3 sm:px-4 h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#b12408]/20 transition-all cursor-pointer active:scale-95"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="hidden md:inline">Add New Item</span>
          <span className="md:hidden">Add</span>
        </button>

        {/* Profile Avatar / Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-label="Manager Profile"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#b12408] flex items-center justify-center text-white shrink-0 shadow-xs cursor-pointer hover:ring-2 hover:ring-[#b12408]/30 transition-all"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
              person
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 space-y-2 z-50 animate-in fade-in zoom-in duration-150">
              <div className="p-2 border-b border-slate-100">
                <p className="text-xs font-black text-slate-900">Chef Vikram Patel</p>
                <p className="text-[11px] text-slate-500">General Manager · Bodakdev Hub</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onShowToast("Opened store profile & timings");
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">store</span>
                <span>Store Profile</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onShowToast("Session secured for Vikram Patel");
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
