import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Menu,
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";

export default function FleetHeader({
  onOpenSidebar = () => {},
  isOnDuty = true,
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

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4 sm:px-6 shadow-xs">
      {/* Left: Mobile hamburger & Context */}
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
          <span className="text-sm font-bold text-[#151c27]">
            Ahmedabad Fleet
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified
          </span>
        </div>
      </div>

      {/* Right: Duty indicator & Profile menu with Logout */}
      <div className="flex items-center gap-3">
        {/* Duty Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
            isOnDuty
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-600 border-slate-200"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOnDuty ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          <span className="uppercase text-[11px] tracking-wide">
            {isOnDuty ? "Online" : "Offline"}
          </span>
        </div>

        {/* Profile Dropdown (Contains Profile & Logout) */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none"
            aria-expanded={profileOpen}
            aria-label="Agent Profile Menu"
          >
            <div className="w-8 h-8 rounded-full bg-[#151c27] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <span className="text-xs font-bold text-slate-800 hidden sm:inline max-w-[120px] truncate">
              {user?.name || "Delivery Partner"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900 truncate">
                  {user?.name || "Delivery Partner"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email || user?.phone || "Delivery Agent"}
                </p>
                <p className="text-[10px] text-orange-600 font-semibold uppercase tracking-wider mt-0.5">
                  Delivery Agent
                </p>
              </div>

              <div className="py-1">
                <Link
                  to="/fleet/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Profile</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left font-medium"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
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
