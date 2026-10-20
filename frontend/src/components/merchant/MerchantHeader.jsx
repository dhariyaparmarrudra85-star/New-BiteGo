import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Menu,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Store,
  Power,
  ShieldCheck,
} from "lucide-react";

export default function MerchantHeader({
  onOpenSidebar = () => {},
  takingOrders = true,
  onToggleTakingOrders = () => {},
  restaurant = null,
  onShowToast = () => {},
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const restaurantName = restaurant?.name || "The Dark Roast Pizzeria";
  const ownerName = user?.name || "Restaurant Owner";
  const userInitial = ownerName ? ownerName.charAt(0).toUpperCase() : "M";

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4 sm:px-6 shadow-xs font-sans">
      {/* Left: Mobile hamburger & Restaurant Context */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#151c27] truncate max-w-[200px] sm:max-w-xs">
            {restaurantName}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified Merchant
          </span>
        </div>
      </div>

      {/* Right: Store Taking Orders Toggle & Profile Menu */}
      <div className="flex items-center gap-3">
        {/* Open / Closed Store Toggle */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              takingOrders ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
            }`}
          />
          <span className="text-xs font-bold text-[#151c27] hidden sm:inline">
            {takingOrders ? "Store Open" : "Store Closed"}
          </span>
          <label className="relative inline-flex items-center cursor-pointer ml-1">
            <input
              type="checkbox"
              checked={takingOrders}
              onChange={onToggleTakingOrders}
              className="sr-only peer"
            />
            <div className="w-8 sm:w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
          </label>
        </div>

        {/* Profile Dropdown (Contains: Restaurant Profile, Settings, and Logout) */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none"
            aria-expanded={profileOpen}
            aria-label="Merchant Profile Menu"
          >
            <div className="w-8 h-8 rounded-full bg-[#b12408] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {userInitial}
            </div>
            <span className="text-xs font-bold text-slate-800 hidden sm:inline max-w-[120px] truncate">
              {ownerName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900 truncate">{ownerName}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                <p className="text-[10px] text-[#b12408] font-bold uppercase tracking-wider mt-0.5 truncate">
                  {restaurantName}
                </p>
              </div>

              <div className="py-1">
                <Link
                  to="/merchant/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Store className="w-4 h-4 text-slate-400" />
                  <span>Restaurant Profile</span>
                </Link>

                <Link
                  to="/merchant/profile#settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Settings</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left font-medium"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
