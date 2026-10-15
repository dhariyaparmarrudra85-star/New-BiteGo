import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../services/api";
import {
  MapPin,
  Plus,
  ShieldCheck,
  CreditCard,
  QrCode,
  Banknote,
  Ticket,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

export default function Checkout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    cartItems,
    activeRestaurant,
    clearCart,
    itemTotal,
    taxesAndPackaging,
    deliveryFee,
    couponDiscount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    finalTotal,
    deliveryInstructions,
    setDeliveryInstructions,
  } = useCart();

  // Redirect if not logged in (only after auth verification completes)
  useEffect(() => {
    if (!authLoading && !user && !localStorage.getItem("bitego_token")) {
      navigate("/login?redirect=/checkout");
    }
  }, [authLoading, user, navigate]);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // New Address Form Modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    houseFlat: "",
    area: "",
    landmark: "",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380054",
    type: "Home",
  });

  // Promo code & Tip
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [tip, setTip] = useState(30);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");

  // Fetch addresses from backend
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const token = localStorage.getItem("bitego_token");
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/users/addresses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.addresses) {
          setAddresses(data.addresses);
          const defaultAddr = data.addresses.find((a) => a.isDefault) || data.addresses[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr._id);
          }
        }
      } catch (err) {
        console.error("Failed to load addresses:", err);
      } finally {
        setLoadingAddresses(false);
      }
    };

    if (user) fetchAddresses();
  }, [user]);

  // Handle Add Address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("bitego_token");
      const res = await fetch(`${API_BASE_URL}/users/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAddress),
      });
      const data = await res.json();
      if (data.success && data.address) {
        setAddresses((prev) => [data.address, ...prev]);
        setSelectedAddressId(data.address._id);
        setShowAddressModal(false);
        setNewAddress({
          fullName: user?.name || "",
          phone: user?.phone || "",
          houseFlat: "",
          area: "",
          landmark: "",
          city: "Ahmedabad",
          state: "Gujarat",
          pincode: "380054",
          type: "Home",
        });
      }
    } catch (err) {
      console.error("Failed to save address:", err);
    }
  };

  // Handle Apply Coupon
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError("");
    if (!couponInput.trim()) return;

    const res = await applyCoupon(couponInput.trim());
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponInput("");
    }
  };

  // Grand Total Calculation with Tip
  const payableAmount = finalTotal + (Number(tip) || 0);

  // Handle Place Order
  const handlePlaceOrder = async () => {
    setOrderError("");

    if (cartItems.length === 0) {
      setOrderError("Your cart is empty. Please add items before checking out.");
      return;
    }

    if (!selectedAddressId && addresses.length === 0) {
      setOrderError("Please add or select a delivery address.");
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("bitego_token");

      const restaurantId =
        activeRestaurant?.id ||
        activeRestaurant?._id ||
        cartItems[0]?.restaurantId ||
        cartItems[0]?.restaurant?._id ||
        cartItems[0]?.restaurant?.id;

      if (!restaurantId) {
        setOrderError("Could not identify restaurant for items in cart. Please re-add items from the restaurant menu.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        restaurantId,
        items: cartItems.map((item) => ({
          menuItemId: item.menuItemId || item.id || item._id,
          name: item.name,
          quantity: item.quantity,
          customizations: item.customizations || [],
        })),
        addressId: selectedAddressId || undefined,
        deliveryInstructions,
        couponCode: appliedCoupon?.code || undefined,
        paymentMethod,
        tipAmount: Number(tip) || 0,
      };

      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.order) {
        setOrderError(data.message || "Failed to place order. Please check item availability.");
        setIsSubmitting(false);
        return;
      }

      // Success: Clear cart & Navigate to live order tracking
      const orderRef = data.order.orderNumber || data.order._id || data.order.id;
      clearCart();
      navigate(`/orders/${orderRef}`, { replace: true });
    } catch (err) {
      console.error("Order error:", err);
      setOrderError("Network error while placing order. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6 pt-28">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm border border-slate-100 space-y-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Your Cart is Empty</h2>
            <p className="text-sm text-slate-500">
              Browse Ahmedabad’s finest restaurants and handpick your feast to proceed with checkout.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-600/30 hover:bg-orange-700 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Explore Restaurants</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-orange-500 selection:text-white">
      <Navbar />

      <main className="flex-1 w-full pt-28 pb-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Checkout &amp; Delivery
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Delivering from <strong className="text-slate-800">{activeRestaurant?.name || cartItems[0]?.restaurant || "The Dark Roast Pizzeria"}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Contactless Safe Delivery</span>
            </div>
          </div>

          {/* Error Alert */}
          {orderError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{orderError}</span>
            </div>
          )}

          {/* TWO COLUMN CHECKOUT LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Addresses, Instructions, Payment */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {/* 1. DELIVERY ADDRESS SECTION */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <h2 className="text-lg font-black text-slate-900">Delivery Address</h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {loadingAddresses ? (
                  <p className="text-xs text-slate-400">Loading delivery addresses...</p>
                ) : addresses.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    No saved addresses found. Please click "Add New Address" above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr._id;

                      return (
                        <div
                          key={addr._id}
                          onClick={() => setSelectedAddressId(addr._id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between gap-2 ${
                            isSelected
                              ? "border-orange-500 bg-orange-50/50 shadow-xs"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-black uppercase text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded">
                                {addr.type || "Home"}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-orange-600" />
                              )}
                            </div>
                            <h3 className="text-sm font-extrabold text-slate-900">
                              {addr.fullName}
                            </h3>
                            <p className="text-xs text-slate-600 mt-1 leading-snug">
                              {addr.houseFlat}, {addr.area}
                              {addr.landmark && `, near ${addr.landmark}`}
                            </p>
                            <p className="text-xs text-slate-500">
                              {addr.city} - {addr.pincode}
                            </p>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-400 mt-2">
                            Phone: {addr.phone}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. DELIVERY INSTRUCTIONS */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h2 className="text-lg font-black text-slate-900">Delivery Instructions</h2>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {[
                    "Leave at door",
                    "Leave at security desk",
                    "Call on arrival",
                    "Do not ring bell",
                    "Avoid doorbell (baby sleeping)",
                  ].map((inst) => (
                    <button
                      key={inst}
                      type="button"
                      onClick={() => setDeliveryInstructions(inst)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        deliveryInstructions === inst
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {inst}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Custom instruction for courier partner..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* 3. PAYMENT METHOD SELECTION */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <h2 className="text-lg font-black text-slate-900">Payment Option</h2>
                  </div>

                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    Instant Secure Gateway
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      id: "UPI",
                      name: "Instant UPI / QR (Google Pay, PhonePe, Paytm)",
                      desc: "Zero transaction fee • Instant clearance",
                      icon: <QrCode className="w-5 h-5 text-orange-600" />,
                    },
                    {
                      id: "Card",
                      name: "Credit / Debit Card (Visa, Mastercard, RuPay)",
                      desc: "Encrypted 256-bit safe checkout",
                      icon: <CreditCard className="w-5 h-5 text-blue-600" />,
                    },
                    {
                      id: "COD",
                      name: "Cash on Delivery",
                      desc: "Pay in cash or UPI upon food handover",
                      icon: <Banknote className="w-5 h-5 text-emerald-600" />,
                    },
                  ].map((method) => {
                    const isSelected = paymentMethod === method.id;

                    return (
                      <div
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "border-orange-500 bg-orange-50/50 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            {method.icon}
                          </div>
                          <div>
                            <p className="text-sm font-extrabold text-slate-900">
                              {method.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {method.desc}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-orange-600 bg-orange-600" : "border-slate-300"
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Order Summary & Coupon Card */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-28">
              {/* Order Items Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-900">
                    Order Summary ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})
                  </h3>
                  <span className="text-xs font-bold text-orange-600">
                    {cartItems.length} items
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar">
                  {cartItems.map((item) => (
                    <div key={item.cartItemId} className="flex justify-between items-start text-xs gap-3">
                      <div>
                        <p className="font-extrabold text-slate-900">
                          {item.name} <span className="text-slate-400">× {item.quantity}</span>
                        </p>
                        {item.customizations?.length > 0 && (
                          <p className="text-[11px] text-slate-500">
                            {item.customizations.map((c) => c.name).join(", ")}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-slate-800">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Input */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Promo Coupon
                  </span>

                  {appliedCoupon ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="font-black text-emerald-900">{appliedCoupon.code}</p>
                          <p className="text-[10px] text-emerald-700">₹{couponDiscount.toFixed(2)} discount applied</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Try BITEGO50"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-bold focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Apply
                      </button>
                    </form>
                  )}

                  {couponError && (
                    <p className="text-xs text-rose-600 font-semibold">{couponError}</p>
                  )}
                </div>

                {/* Rider Tip Selector */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600">Tip for Delivery Hero</span>
                    <span className="text-orange-600 font-bold">100% goes to rider</span>
                  </div>
                  <div className="flex gap-2">
                    {[0, 20, 30, 50].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTip(t)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          tip === t
                            ? "bg-orange-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {t === 0 ? "None" : `₹${t}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Final Bill Breakdown */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-slate-800">₹{itemTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Partner Fee</span>
                    <span className="font-bold text-emerald-600">FREE (Gold Pass)</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Taxes &amp; Restaurant Packaging</span>
                    <span className="font-semibold text-slate-800">₹{taxesAndPackaging.toFixed(2)}</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Coupon Discount</span>
                      <span>- ₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {tip > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery Partner Tip</span>
                      <span className="font-semibold text-slate-800">₹{tip.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-black text-slate-900">
                    <span>To Pay</span>
                    <span className="text-xl text-orange-600">₹{payableAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Place Order CTA */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handlePlaceOrder}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white font-extrabold text-base shadow-xl shadow-orange-600/30 flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <span>{isSubmitting ? "Confirming Order..." : "Place Order"}</span>
                  <span className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-xl text-sm font-bold">
                    ₹{payableAmount.toFixed(2)} <ArrowRight className="w-4 h-4 ml-1" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ADD ADDRESS MODAL */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Add New Delivery Address</h3>

            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">Contact Person Name</label>
                <input
                  type="text"
                  required
                  value={newAddress.fullName}
                  onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Contact Phone Number</label>
                <input
                  type="text"
                  required
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">House / Flat / Tower / Floor</label>
                <input
                  type="text"
                  required
                  value={newAddress.houseFlat}
                  onChange={(e) => setNewAddress({ ...newAddress, houseFlat: e.target.value })}
                  placeholder="e.g. Flat 402, Tower B, Galaxy Heights"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Area / Street / Sector</label>
                <input
                  type="text"
                  required
                  value={newAddress.area}
                  onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                  placeholder="e.g. Sindhu Bhavan Road, Bodakdev"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">City</label>
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Pincode</label>
                  <input
                    type="text"
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
