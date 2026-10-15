import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function MerchantSidebar({
  isOpen = false,
  onClose = () => {},
}) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isMenuPage =
    location.pathname === "/merchant/menu" ||
    location.pathname.startsWith("/merchant/menu");

  const isDashboardPage =
    location.pathname === "/merchant" ||
    location.pathname === "/merchant/dashboard" ||
    location.pathname === "/partner";

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "dashboard",
      href: "/merchant/dashboard",
      active: isDashboardPage,
    },
    {
      id: "live-orders",
      label: "Live Orders",
      icon: "receipt_long",
      href: "/merchant/dashboard",
      badge: "4 Live",
      badgeClass: "bg-[#b12408] text-white font-bold",
      active: false,
    },
    {
      id: "kds",
      label: "Kitchen Display (KDS)",
      icon: "outdoor_grill",
      href: "/merchant/dashboard",
      active: false,
    },
    {
      id: "menu-management",
      label: "Menu Management",
      icon: "restaurant_menu",
      href: "/merchant/menu",
      active: isMenuPage,
    },
    {
      id: "earnings",
      label: "Earnings & Payouts (₹)",
      icon: "payments",
      href: "#",
      active: false,
    },
    {
      id: "offers",
      label: "Offers & Promotions",
      icon: "loyalty",
      href: "#",
      active: false,
    },
    {
      id: "reviews",
      label: "Reviews & Ratings",
      icon: "reviews",
      href: "#",
      active: false,
    },
    {
      id: "profile-timings",
      label: "Store Profile & Timings",
      icon: "store",
      href: "#",
      active: false,
    },
    {
      id: "settings",
      label: "Settings",
      icon: "settings",
      href: "#",
      active: false,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* 288px Fixed Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between overflow-y-auto transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col">
          {/* Logo Header */}
          <div className="p-6 flex items-center justify-between">
            <Link to="/merchant/dashboard" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#b12408] flex items-center justify-center text-white font-bold shadow-md shadow-[#b12408]/20">
                <span className="material-symbols-outlined text-[24px]">local_pizza</span>
              </div>
              <div>
                <span className="text-lg font-extrabold text-[#151c27] tracking-tight block leading-tight">
                  BiteGo
                </span>
                <span className="text-[11px] text-[#b12408] uppercase font-bold tracking-wider">
                  Merchant Hub
                </span>
              </div>
            </Link>

            {/* Mobile close */}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Active Store Widget */}
          <div className="px-4 mb-4">
            <div className="bg-[#f0f3ff] rounded-xl p-3 flex flex-col gap-1 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#5b403b] font-bold uppercase tracking-wider">
                  Active Store
                </span>
                <span className="flex items-center gap-1 bg-[#6ffbbe] text-[#005236] text-[11px] font-bold px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#006947] animate-pulse" />
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <div className="truncate">
                  <p className="text-sm font-bold text-[#151c27] truncate">
                    The Dark Roast Pizzeria
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    Bodakdev, Ahmedabad
                  </p>
                </div>
                <button
                  aria-label="Switch Outlet"
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  type="button"
                  onClick={() => alert("Active Outlet: Bodakdev Hub, SG Highway")}
                >
                  <span className="material-symbols-outlined text-[20px]">unfold_more</span>
                </button>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="px-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                  item.active
                    ? "bg-[#b12408] text-white shadow-md shadow-[#b12408]/20 font-bold"
                    : "text-slate-600 hover:bg-[#e7eefe] hover:text-[#151c27] font-semibold"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full ${
                      item.badgeClass || "bg-slate-200 text-slate-800"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Profile & Help */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="bg-[#f0f3ff] rounded-xl p-3 flex items-center justify-between mb-3 border border-slate-100">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-9 h-9 rounded-full bg-[#ffdad3] flex items-center justify-center text-[#8e1500] font-bold text-sm shrink-0">
                <span className="material-symbols-outlined text-[20px]">restaurant</span>
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-[#151c27] truncate">
                  {user?.name || "Merchant Partner"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email || "General Manager"}
                </p>
              </div>
            </div>
            <button
              aria-label="Logout"
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>

          <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">call</span>
              +91 79 4002 9182
            </span>
            <span
              onClick={() => alert("Merchant Help Hotline: +91 79 4002 9182 (24/7 Priority Support)")}
              className="text-[11px] text-[#b12408] font-bold uppercase cursor-pointer hover:underline"
            >
              Help
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
