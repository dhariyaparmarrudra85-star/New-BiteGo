import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MapPin,
  ChevronDown,
  Search,
  ShoppingBag,
  Sparkles,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Store,
  Bike,
  LogIn,
  Bell,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { API_BASE_URL } from "../services/api";

export default function Navbar({
  cartCount,
  onOpenCart = () => {},
  searchQuery = "",
  onSearchChange = () => {},
  activePage = "",
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, getRedirectPathForUser } = useAuth();
  
  const cartCtx = useCart();
  const finalCartCount = cartCount !== undefined ? cartCount : (cartCtx?.totalItemCount || 0);

  const currentPath = activePage || (
    location.pathname.startsWith("/orders") ? "Orders" :
    location.pathname.startsWith("/profile") ? "Profile" :
    location.pathname.startsWith("/restaurants") ? "Restaurants" :
    location.pathname.startsWith("/offers") ? "Offers" :
    location.pathname === "/" ? "Home" :
    ""
  );

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Restaurants", href: "/restaurants" },
    { name: "Offers", href: "/offers" },
    { name: "Orders", href: "/orders" },
    { name: "Profile", href: user ? "/profile" : "/login" },
  ];

  const getRoleBadge = (role) => {
    switch (role) {
      case "superadmin":
        return { label: "Super Admin", color: "text-purple-600 bg-purple-50 border-purple-200" };
      case "admin":
        return { label: "Operations Admin", color: "text-blue-600 bg-blue-50 border-blue-200" };
      case "merchant":
        return { label: "Merchant Partner", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
      case "delivery":
        return { label: "Fleet Courier", color: "text-amber-600 bg-amber-50 border-amber-200" };
      default:
        return { label: "Foodie Member", color: "text-orange-600 bg-orange-50 border-orange-200" };
    }
  };

  const roleInfo = user ? getRoleBadge(user.role) : null;
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "BG";

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("bitego_token");
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        // silently ignore network errors
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    const token = localStorage.getItem("bitego_token");
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Mark all read failed:", e);
    }
  };

  const handleMarkRead = async (id) => {
    const token = localStorage.getItem("bitego_token");
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Mark read failed:", e);
    }
  };

  const handlePortalSwitch = () => {
    if (!user) return;
    if (user.role === "customer") {
      navigate("/profile");
      return;
    }
    const dest = getRedirectPathForUser(user);
    navigate(dest);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] transition-all">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3 sm:gap-6">
        {/* Left Side: Brand Logo & Location */}
        <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/30 group-hover:scale-105 transition-transform duration-200">
              <span className="text-xl">🔥</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                  Bite<span className="text-orange-600">Go</span>
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 hidden xs:block -mt-1">
                Ahmedabad Express
              </span>
            </div>
          </Link>

          {/* Location Selector */}
          <div className="h-7 w-px bg-slate-200 hidden sm:block" />

          <button
            type="button"
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-50 hover:bg-orange-50 border border-slate-200/80 hover:border-orange-200 transition-all text-left group"
          >
            <MapPin className="w-4 h-4 text-orange-600 flex-shrink-0 group-hover:animate-bounce" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight group-hover:text-orange-600 transition-colors truncate max-w-[120px] sm:max-w-[150px]">
                  Ahmedabad, Gujarat
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600" />
              </div>
            </div>
          </button>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-50/80 border border-slate-200/60 p-1.5 rounded-full">
          {navLinks.map((link) => {
            const isActive = currentPath === link.name;
            return (
              <Link
                key={link.name}
                to={link.href}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-orange-600 text-white shadow-sm shadow-orange-600/30"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Search Box, Cart, and User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Quick Search on Desktop */}
          <div className="hidden xl:flex items-center relative w-52">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Dishes, restaurants..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
            />
          </div>

          {/* Cart Button */}
          <button
            type="button"
            onClick={onOpenCart}
            aria-label="Open Cart Drawer"
            className="relative flex items-center justify-center p-2.5 sm:px-3.5 sm:py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/80 transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            <ShoppingBag className="w-5 h-5 text-orange-600" />
            <span className="hidden md:inline font-bold text-xs sm:text-sm ml-1.5">
              Cart
            </span>
            {finalCartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-orange-600 text-white text-[11px] font-black flex items-center justify-center shadow-md shadow-orange-600/40 animate-in zoom-in">
                {finalCartCount}
              </span>
            )}
          </button>

          {/* Notifications Bell (for logged-in users) */}
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
                title="View platform and order alerts"
                className="relative flex items-center justify-center p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
              >
                <Bell className="w-5 h-5 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-rose-600/40 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No notifications right now
                      </div>
                    ) : (
                      notifications.slice(0, 15).map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => {
                            if (!notif.isRead) handleMarkRead(notif._id);
                            if (notif.data?.orderId) {
                              setShowNotifications(false);
                              navigate(`/orders/${notif.data.orderId}`);
                            }
                          }}
                          className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                            notif.isRead ? "opacity-75" : "bg-orange-50/30"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                              notif.isRead ? "bg-slate-300" : "bg-orange-500"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(notif.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile / Auth Area */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={handlePortalSwitch}
                title={`Open ${user.role} workspace`}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 transition-colors text-left"
              >
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-400 to-amber-300 border-2 border-orange-400 flex items-center justify-center text-slate-900 font-black text-xs shadow-xs">
                    {userInitials}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>

                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[110px]">
                    {user.name}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top duration-200">
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Dishes, restaurants..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = currentPath === link.name;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between ${
                    isActive
                      ? "bg-orange-50 text-orange-600 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{link.name}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                  )}
                </Link>
              );
            })}

            {/* Quick Partner Onboarding Links */}
            <div className="pt-2 mt-2 border-t border-slate-100 flex flex-col gap-1">
              <Link
                to="/become-merchant"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-orange-50 flex items-center gap-2"
              >
                <Store className="w-4 h-4 text-orange-600" />
                <span>Partner with BiteGo (Restaurants)</span>
              </Link>
              <Link
                to="/become-delivery-partner"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-orange-50 flex items-center gap-2"
              >
                <Bike className="w-4 h-4 text-emerald-600" />
                <span>Join Delivery Fleet</span>
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                  {userInitials}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{user.name}</p>
                  <p className="text-[10px] text-orange-600 font-semibold">{roleInfo?.label}</p>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold"
              >
                Sign In
              </Link>
            )}

            <div className="flex items-center gap-2">
              {user && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-bold"
                >
                  Sign Out
                </button>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCart();
                }}
                className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Cart ({finalCartCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}