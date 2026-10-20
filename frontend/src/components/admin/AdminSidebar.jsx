import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Store,
  Receipt,
  Bike,
  X,
  ShieldCheck,
} from "lucide-react";

export default function AdminSidebar({
  isOpen = false,
  onClose = () => {},
}) {
  const location = useLocation();

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin/dashboard",
      active:
        location.pathname === "/admin" ||
        location.pathname === "/admin/dashboard",
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
      path: "/admin/users",
      active: location.pathname === "/admin/users",
    },
    {
      id: "restaurants",
      label: "Restaurants",
      icon: Store,
      path: "/admin/restaurants",
      active:
        location.pathname === "/admin/restaurants" ||
        location.pathname === "/admin/restaurants-and-approvals",
    },
    {
      id: "orders",
      label: "Orders",
      icon: Receipt,
      path: "/admin/orders",
      active: location.pathname === "/admin/orders",
    },
    {
      id: "delivery-agents",
      label: "Delivery Agents",
      icon: Bike,
      path: "/admin/delivery-agents",
      active:
        location.pathname === "/admin/delivery-agents" ||
        location.pathname === "/admin/delivery-partners",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* 256px Clean Fixed Sidebar matching BiteGo palette */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-[#151c27] text-white z-50 flex flex-col justify-between shadow-xl transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col">
          {/* Logo Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#b12408] flex items-center justify-center text-white shadow-sm font-black text-sm">
                BG
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-white leading-tight">
                  BiteGo
                </span>
                <span className="text-[10px] uppercase tracking-wider text-orange-400 font-bold">
                  Admin Panel
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items (The 5 core items requested) */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-sm font-semibold ${
                    isActive
                      ? "bg-[#b12408] text-white font-bold shadow-sm"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Platform Status Indicator */}
        <div className="p-4 border-t border-slate-800 bg-[#0f172a]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Platform Status</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400">Operational</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate">Ahmedabad Central Hub</span>
          </div>
        </div>
      </aside>
    </>
  );
}
