import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Plus,
  Minus,
  Trash2,
  Ticket,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Check,
} from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CartDrawer({
  isOpen = false,
  onClose = () => {},
  cartItems: propCartItems,
  onUpdateQuantity: propUpdateQuantity,
  onRemoveItem: propRemoveItem,
  onCheckout: propCheckout,
}) {
  const navigate = useNavigate();
  const cartCtx = useCart();

  const [inputCoupon, setInputCoupon] = useState("");
  const [showCouponInput, setShowCouponInput] = useState(false);

  if (!isOpen) return null;

  const cartItems = cartCtx ? (cartCtx.cartItems || cartCtx.items || []) : (propCartItems || []);
  const onUpdateQuantity = cartCtx ? cartCtx.updateQuantity : (propUpdateQuantity || (() => {}));
  const onRemoveItem = cartCtx ? (cartCtx.removeItem || cartCtx.removeFromCart) : (propRemoveItem || (() => {}));
  const itemTotal = cartCtx ? (cartCtx.itemTotal !== undefined ? cartCtx.itemTotal : (cartCtx.subtotal || 0)) : cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const deliveryFee = cartCtx ? (cartCtx.deliveryFee !== undefined ? cartCtx.deliveryFee : 0) : 0;
  const taxesAndPackaging = cartCtx ? (cartCtx.taxesAndPackaging !== undefined ? cartCtx.taxesAndPackaging : (itemTotal > 0 ? Number((itemTotal * 0.05).toFixed(2)) : 0)) : (itemTotal > 0 ? Number((itemTotal * 0.05).toFixed(2)) : 0);
  const couponDiscount = cartCtx ? (cartCtx.couponDiscount !== undefined ? cartCtx.couponDiscount : 0) : (itemTotal > 200 ? 100 : 0);
  const finalTotal = cartCtx ? (cartCtx.finalTotal !== undefined ? cartCtx.finalTotal : (cartCtx.total !== undefined ? cartCtx.total : Math.max(0, itemTotal + deliveryFee + taxesAndPackaging - couponDiscount))) : Math.max(0, itemTotal + deliveryFee + taxesAndPackaging - couponDiscount);
  const appliedCoupon = cartCtx ? (cartCtx.appliedCoupon || cartCtx.coupon) : null;
  const couponError = cartCtx ? cartCtx.couponError : "";
  const restaurantName = cartCtx?.activeRestaurant?.name || cartCtx?.restaurant?.name || "The Dark Roast Pizzeria";
  const restaurantArea = (cartCtx?.activeRestaurant?.address && typeof cartCtx.activeRestaurant.address === "object" ? cartCtx.activeRestaurant.address.area : cartCtx?.activeRestaurant?.address) || "Bodakdev";
  const deliveryTime = cartCtx?.restaurant?.deliveryTime || "25 mins";

  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || inputCoupon).trim();
    if (!code) return;
    if (cartCtx) {
      await cartCtx.applyCoupon(code);
      setInputCoupon("");
      setShowCouponInput(false);
    }
  };

  const handleProceedCheckout = () => {
    onClose();
    if (propCheckout) {
      propCheckout(finalTotal);
    }
    navigate("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md md:w-[440px] bg-white shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="text-lg font-black text-slate-900 truncate max-w-[260px]">
                  {restaurantName}
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                <span className="truncate">{restaurantArea}</span>
                <span className="text-slate-300">•</span>
                <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{deliveryTime} arrival</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close cart drawer"
              className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 no-scrollbar">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-base font-extrabold text-slate-800">
                  Your cart is empty
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Add some delicious dishes from Ahmedabad’s finest kitchens to get started.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>Selected Items ({cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0)})</span>
                  <span className="text-orange-600">Fresh Preparation</span>
                </div>

                {cartItems.map((item) => {
                  const itemId = item.cartItemId || item.id;
                  return (
                    <div
                      key={itemId}
                      className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-orange-200 transition-colors flex items-center justify-between gap-3"
                    >
                      {/* Item Image & Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold text-slate-900 truncate">
                            {item.name}
                          </h4>
                          {item.customizationText && (
                            <p className="text-[11px] text-orange-600 font-semibold truncate">
                              {item.customizationText}
                            </p>
                          )}
                          <p className="text-xs font-bold text-slate-600 mt-0.5">
                            ₹{item.price * item.quantity}
                            {item.quantity > 1 && (
                              <span className="text-[11px] text-slate-400 font-normal ml-1">
                                (₹{item.price} each)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Quantity Controls & Delete */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-1 py-0.5 shadow-xs">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(itemId, -1)}
                            aria-label="Decrease quantity"
                            className="w-6 h-6 rounded-lg text-slate-600 hover:bg-orange-50 hover:text-orange-600 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-black text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(itemId, 1)}
                            aria-label="Increase quantity"
                            className="w-6 h-6 rounded-lg text-slate-600 hover:bg-orange-50 hover:text-orange-600 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(itemId)}
                          aria-label={`Remove ${item.name}`}
                          className="w-7 h-7 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Coupon Box */}
                {appliedCoupon ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <Ticket className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                          <span>{appliedCoupon.code}</span>
                          <span className="text-[10px] bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded">
                            APPLIED
                          </span>
                        </p>
                        <p className="text-[11px] text-emerald-700 font-semibold">
                          ₹{couponDiscount.toFixed(2)} savings unlocked on this feast
                        </p>
                      </div>
                    </div>
                    {cartCtx && (
                      <button
                        type="button"
                        onClick={cartCtx.removeCoupon}
                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Ticket className="w-4 h-4 text-orange-600" />
                        <span>Have a Promo Code?</span>
                      </div>
                      {!showCouponInput && (
                        <button
                          type="button"
                          onClick={() => setShowCouponInput(true)}
                          className="text-xs font-extrabold text-orange-600 hover:text-orange-700 cursor-pointer"
                        >
                          Apply Coupon
                        </button>
                      )}
                    </div>

                    {showCouponInput && (
                      <div className="space-y-2 pt-1">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={inputCoupon}
                            onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                            placeholder="e.g. BITEGO50"
                            className="flex-1 text-xs px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold uppercase focus:outline-none focus:border-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyCoupon()}
                            className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {["BITEGO50", "GOLD100", "FEAST20"].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => handleApplyCoupon(c)}
                              className="px-2 py-0.5 rounded-lg bg-orange-100/60 hover:bg-orange-200/60 text-orange-800 text-[10px] font-bold border border-orange-200"
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                        {couponError && (
                          <p className="text-[11px] text-rose-600 font-semibold">{couponError}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Bill Breakdown */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs">
                  <p className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-2">
                    Bill Details
                  </p>

                  <div className="flex justify-between text-slate-600">
                    <span>Item Total</span>
                    <span className="font-semibold text-slate-800">
                      ₹{itemTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <span>Delivery Partner Fee</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1 rounded">
                        Gold Pass
                      </span>
                    </span>
                    <span className="font-bold text-emerald-600">
                      {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Taxes &amp; Restaurant Packaging</span>
                    <span className="font-semibold text-slate-800">
                      ₹{taxesAndPackaging.toFixed(2)}
                    </span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Coupon Discount</span>
                      <span>- ₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-2.5 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                    <span>To Pay</span>
                    <span className="text-base text-orange-600">
                      ₹{finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer & Checkout CTA */}
          <div className="p-5 sm:p-6 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mb-3 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safe &amp; contactless delivery guaranteed</span>
            </div>

            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={handleProceedCheckout}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-orange-600/30 flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <span className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-xl text-sm font-bold">
                ₹{finalTotal.toFixed(2)} <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
