import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Receipt,
  Wallet,
  X,
  CheckCircle2,
} from "lucide-react";

export default function MerchantSidebar({
  isOpen = false,
  onClose = () => {},
  takingOrders = true,
  restaurantName = "BiteGo Merchant",
}) {
  const location = useLocation();

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/merchant/dashboard",
      active:
        location.pathname === "/merchant" ||
        location.pathname === "/merchant/dashboard" ||
        location.pathname === "/partner",
    },
    {
      id: "orders",
      label: "Orders",
      icon: Receipt,
      path: "/merchant/orders",
      active: location.pathname === "/merchant/orders",
    },
    {
      id: "menu",
      label: "Menu",
      icon: UtensilsCrossed,
      path: "/merchant/menu",
      active:
        location.pathname === "/merchant/menu" ||
        location.pathname.startsWith("/merchant/menu"),
    },
    {
      id: "earnings",
      label: "Earnings",
      icon: Wallet,
      path: "/merchant/earnings",
      active: location.pathname === "/merchant/earnings",
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

      {/* 260px Clean Fixed Sidebar matching BiteGo palette */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-[#151c27] text-white z-50 flex flex-col justify-between shadow-xl transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col">
          {/* Logo Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
            <Link to="/merchant/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#b12408] flex items-center justify-center text-white shadow-sm font-black text-sm">
                BG
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-white leading-tight">
                  BiteGo
                </span>
                <span className="text-[10px] uppercase tracking-wider text-orange-400 font-bold">
                  Merchant Hub
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

          {/* Navigation Items (The 4 core items requested) */}
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

        {/* Bottom Store Status Indicator */}
        <div className="p-4 border-t border-slate-800 bg-[#0f172a]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Store Taking Orders</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  takingOrders ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
                }`}
              />
              <span
                className={`text-xs font-bold ${
                  takingOrders ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {takingOrders ? "Open" : "Closed"}
              </span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate">{restaurantName}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
