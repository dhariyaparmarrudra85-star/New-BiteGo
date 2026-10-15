import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import CartDrawer from "../components/CartDrawer";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { API_BASE_URL } from "../services/api";
import {
  Tag,
  Ticket,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Percent,
  Clock,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

export default function Offers() {
  const navigate = useNavigate();
  const {
    totalItemCount,
    finalTotal,
    isCartOpen,
    setIsCartOpen,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState("");
  const [actionFeedback, setActionFeedback] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/coupons`);
        const json = await res.json();
        const list = (json.coupons && Array.isArray(json.coupons))
          ? json.coupons
          : (json.data && Array.isArray(json.data))
          ? json.data
          : [];
        setCoupons(list);
      } catch (err) {
        console.error("Failed to load coupons:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  const handleApplyOffer = async (code) => {
    setActionFeedback((prev) => ({ ...prev, [code]: "Applying..." }));
    const result = await applyCoupon(code);
    if (result.success) {
      setActionFeedback((prev) => ({ ...prev, [code]: "Applied!" }));
      setIsCartOpen(true);
    } else {
      setActionFeedback((prev) => ({ ...prev, [code]: result.message || "Invalid" }));
    }
    setTimeout(() => {
      setActionFeedback((prev) => ({ ...prev, [code]: "" }));
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* 1. NAVBAR */}
      <Navbar
        activePage="Offers"
        cartCount={totalItemCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="flex-1 w-full pt-24 pb-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>BiteGo Deals &amp; Festive Savings</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
                Exclusive Offers &amp; Promo Codes
              </h1>
              <p className="text-sm sm:text-base text-orange-100 leading-relaxed font-medium">
                Save big on every meal with handpicked discounts, flat rebates, and free delivery perks across Ahmedabad.
              </p>
            </div>
            <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Active Applied Coupon Banner */}
          {appliedCoupon && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-emerald-950">
                      Code {appliedCoupon.code} is currently active
                    </span>
                    <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                    {appliedCoupon.description || `Discount unlocked on your order`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  View in Cart
                </button>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Offer Cards Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-3" />
              <p className="text-xs font-bold text-slate-500">Unlocking current deals...</p>
            </div>
          ) : coupons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map((coupon) => {
                const isCurrentlyApplied = appliedCoupon?.code === coupon.code;
                const feedback = actionFeedback[coupon.code];

                return (
                  <div
                    key={coupon._id || coupon.code}
                    className="bg-white rounded-3xl p-6 border border-slate-100 hover:border-orange-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-orange-50 text-orange-600 text-xs font-black uppercase tracking-wider border border-orange-200">
                          <Tag className="w-3.5 h-3.5" />
                          {coupon.code}
                        </span>

                        <span className="text-[11px] font-bold text-slate-400">
                          {coupon.discountType === "percentage"
                            ? `${coupon.discountAmount}% OFF`
                            : `FLAT ₹${coupon.discountAmount} OFF`}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 leading-snug">
                        {coupon.description || `Save with code ${coupon.code}`}
                      </h3>

                      <div className="mt-3 space-y-1.5 text-xs text-slate-500 font-medium">
                        {coupon.minOrderAmount > 0 && (
                          <p>• Min. order value: ₹{coupon.minOrderAmount}</p>
                        )}
                        {coupon.maxDiscount && (
                          <p>• Maximum savings: ₹{coupon.maxDiscount}</p>
                        )}
                        <p className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>Valid on all participating Ahmedabad kitchens</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions: Copy & Apply */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(coupon.code)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedCode === coupon.code ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyOffer(coupon.code)}
                        disabled={isCurrentlyApplied}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                          isCurrentlyApplied
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-300 font-black cursor-default"
                            : "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/30"
                        }`}
                      >
                        {isCurrentlyApplied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Applied</span>
                          </>
                        ) : feedback ? (
                          <span>{feedback}</span>
                        ) : (
                          <>
                            <span>Apply Offer</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
              <p className="text-base font-bold text-slate-700">No promo coupons currently available</p>
            </div>
          )}

          {/* Quick CTA to Restaurants */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black">Ready to order your feast?</h3>
              <p className="text-xs text-slate-400 mt-1">Browse our top-rated menus and apply your discount during checkout.</p>
            </div>
            <Link
              to="/restaurants"
              className="px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-600/30 transition-all"
            >
              <span>Explore Restaurants</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Floating Cart Button */}
      {!isCartOpen && totalItemCount > 0 && (
        <aside className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom duration-300">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-800 hover:border-orange-500 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
              <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-orange-600 text-white text-[10px] font-black flex items-center justify-center">
                {totalItemCount}
              </span>
            </div>
            <div className="text-left">
              <p className="text-[11px] text-slate-300 font-semibold">{totalItemCount} items</p>
              <p className="text-sm font-black text-white">₹{finalTotal.toFixed(2)}</p>
            </div>
          </button>
        </aside>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Footer */}
      <Footer />
    </div>
  );
}
