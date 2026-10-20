import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useParams, useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../services/api";
import Navbar from "../components/Navbar";
import DeliveryTracking from "../components/DeliveryTracking";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import {
  RotateCcw,
  CheckCircle2,
  Star,
  ChevronRight,
  ShoppingBag,
  ListOrdered,
  Radio,
} from "lucide-react";
import { useCart } from "../context/CartContext";

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { orderId, id } = useParams();
  const navigate = useNavigate();
  const cart = useCart();

  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTip, setSelectedTip] = useState("30");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewTab, setViewTab] = useState("tracking"); // "tracking" | "history"
  const [historyFilter, setHistoryFilter] = useState("all"); // "all" | "ongoing" | "delivered" | "cancelled"

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [courierRating, setCourierRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem("bitego_token");
    if (!token) {
      const targetParam = orderId || id || searchParams.get("orderId");
      const redirectUrl = targetParam ? `/orders/${targetParam}` : "/orders";
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }
  }, [orderId, id, searchParams, navigate]);

  // Fetch all customer orders and specific target order
  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem("bitego_token");
    if (!token) {
      setLoading(false);
      return;
    }

    const targetId = orderId || id || searchParams.get("orderId");

    try {
      // If a specific order ID or orderNumber is provided in params, fetch it directly
      if (targetId) {
        try {
          const singleRes = await fetch(`${API_BASE_URL}/orders/${targetId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const singleData = await singleRes.json();
          if (singleData.success && singleData.order) {
            setActiveOrder(singleData.order);
            setViewTab("tracking");
          }
        } catch (singleErr) {
          console.warn("Could not load single order by ID:", singleErr);
        }
      }

      // Fetch all customer orders for the history list
      const res = await fetch(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);

        if (targetId) {
          const match = data.orders.find(
            (o) => o.orderNumber === targetId || o._id === targetId
          );
          if (match) {
            setActiveOrder(match);
            setViewTab("tracking");
            return;
          }
        }

        // If no targetId, default to latest ongoing order, or simply the most recent order
        if (!targetId) {
          const ongoing = data.orders.find((o) =>
            [
              "PLACED",
              "CONFIRMED",
              "PREPARING",
              "READY_FOR_PICKUP",
              "ASSIGNED",
              "ACCEPTED",
              "PICKED_UP",
              "OUT_FOR_DELIVERY",
            ].includes(o.orderStatus)
          );
          if (ongoing) {
            setActiveOrder(ongoing);
          } else if (data.orders.length > 0) {
            setActiveOrder(data.orders[0]);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [orderId, id, searchParams]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time synchronization via BroadcastChannel and window events
  useEffect(() => {
    let channel = null;
    if (typeof window !== "undefined" && window.BroadcastChannel) {
      try {
        channel = new BroadcastChannel("bitego_order_events");
        channel.onmessage = (e) => {
          if (
            e.data?.type &&
            [
              "ORDER_READY_FOR_PICKUP",
              "ORDER_ACCEPTED",
              "ORDER_PICKED_UP",
              "ORDER_OUT_FOR_DELIVERY",
              "ORDER_DELIVERED",
              "ORDER_STATUS_UPDATED",
            ].includes(e.data.type)
          ) {
            fetchOrders();
          }
        };
      } catch {
        // Fallback to polling
      }
    }

    const handleSync = () => fetchOrders();
    window.addEventListener("focus", handleSync);
    window.addEventListener("visibilitychange", handleSync);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("visibilitychange", handleSync);
    };
  }, [fetchOrders]);

  // Live polling every 3 seconds while the active order is in progress
  useEffect(() => {
    if (!activeOrder) return;
    const isOngoing = [
      "PLACED",
      "CONFIRMED",
      "PREPARING",
      "READY_FOR_PICKUP",
      "ASSIGNED",
      "ACCEPTED",
      "PICKED_UP",
      "OUT_FOR_DELIVERY",
    ].includes(activeOrder.orderStatus);

    if (!isOngoing) return;

    const interval = setInterval(async () => {
      const token = localStorage.getItem("bitego_token");
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE_URL}/orders/${activeOrder._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.order) {
          setActiveOrder(data.order);
          // Also update in orders list
          setOrders((prev) =>
            prev.map((o) => (o._id === data.order._id ? data.order : o))
          );
        }
      } catch (err) {
        console.error("Polling error for order status:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeOrder?._id, activeOrder?.orderStatus]);

  // Order Cancellation Handler
  const handleCancelOrder = async () => {
    if (!activeOrder) return;
    const confirm = window.confirm("Are you sure you want to cancel this order?");
    if (!confirm) return;

    const token = localStorage.getItem("bitego_token");
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${activeOrder._id}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: "Customer requested cancellation" }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setActiveOrder(data.order);
        setOrders((prev) =>
          prev.map((o) => (o._id === data.order._id ? data.order : o))
        );
        alert("Order has been successfully cancelled.");
      } else {
        alert(data.message || "Failed to cancel order.");
      }
    } catch (err) {
      console.error("Cancellation error:", err);
      alert("Unable to cancel order right now.");
    }
  };

  // Reorder Handler
  const handleReorder = () => {
    if (!activeOrder || !activeOrder.items) return;
    // Add available items to cart
    activeOrder.items.forEach((item) => {
      cart.addToCart(
        {
          _id: item.menuItem || item.id,
          name: item.name,
          price: item.price,
          isVeg: item.isVeg,
          image: item.image,
        },
        item.quantity || 1,
        item.selectedCustomizations || null,
        activeOrder.restaurant
      );
    });
    navigate("/checkout");
  };

  // Review Submission Handler
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!activeOrder) return;
    setSubmittingReview(true);

    const token = localStorage.getItem("bitego_token");
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${activeOrder._id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurantRating,
          deliveryRating: courierRating,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewSuccess(true);
        setTimeout(() => {
          setShowReviewModal(false);
          setReviewSuccess(false);
          fetchOrders();
        }, 1500);
      } else {
        alert(data.message || "Could not submit review.");
      }
    } catch (err) {
      console.error("Review submission error:", err);
      alert("Review submission failed.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filtered order history list
  const filteredHistory = orders.filter((o) => {
    if (historyFilter === "ongoing") {
      return ["PLACED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(o.orderStatus);
    }
    if (historyFilter === "delivered") return o.orderStatus === "DELIVERED";
    if (historyFilter === "cancelled") return o.orderStatus === "CANCELLED";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* 1. FIXED NAVBAR */}
      <Navbar
        activePage="Orders"
        cartCount={cart.totalItemCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full pt-28 pb-16 md:pt-32 md:pb-24">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          {/* Top Tabs Switcher: Live Tracking vs Order History */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-3xl border border-slate-100 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewTab("tracking")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  viewTab === "tracking"
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>Live Order Tracking</span>
                {activeOrder && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setViewTab("history")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  viewTab === "history"
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                <span>Order History ({orders.length})</span>
              </button>
            </div>

            {activeOrder && activeOrder.orderStatus === "DELIVERED" && !activeOrder.review?.restaurantRating && (
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>Rate &amp; Review Order #{activeOrder.orderNumber}</span>
              </button>
            )}
          </div>

          {viewTab === "tracking" ? (
            activeOrder ? (
              <DeliveryTracking
                order={activeOrder}
                onCancelOrder={handleCancelOrder}
                onReorder={handleReorder}
                onOpenReview={() => setShowReviewModal(true)}
              />
            ) : loading ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 space-y-3">
                <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-700">Loading order tracking...</p>
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900">No active orders right now</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Browse top restaurants in Ahmedabad and place your hot feast to start tracking!
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-600 text-white font-extrabold text-sm shadow-lg shadow-orange-600/30 hover:bg-orange-700 transition-all"
                >
                  <span>Explore Restaurants</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )
          ) : (
            /* ORDER HISTORY TAB VIEW */
            <div className="space-y-6">
              {/* History Filter Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: "all", label: "All Orders" },
                  { id: "ongoing", label: "Ongoing" },
                  { id: "delivered", label: "Delivered" },
                  { id: "cancelled", label: "Cancelled" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setHistoryFilter(f.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      historyFilter === f.id
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* History Orders List */}
              {filteredHistory.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-600">No orders found in this category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredHistory.map((ord) => {
                    const isCompleted = ord.orderStatus === "DELIVERED";
                    const isCancelled = ord.orderStatus === "CANCELLED";
                    return (
                      <div
                        key={ord._id}
                        className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:border-orange-200 transition-all flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-black text-slate-900">
                              #{ord.orderNumber}
                            </span>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                                isCompleted
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : isCancelled
                                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200 animate-pulse"
                              }`}
                            >
                              {ord.orderStatus}
                            </span>
                          </div>

                          <h4 className="text-base font-extrabold text-slate-900">
                            {ord.restaurant?.name || "Restaurant Partner"}
                          </h4>

                          <p className="text-xs text-slate-500 font-medium line-clamp-1">
                            {ord.items?.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                          </p>

                          <div className="flex items-center gap-4 text-xs font-bold text-slate-600 pt-1">
                            <span>₹{ord.totalAmount?.toFixed(2)}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-400 font-normal">
                              {new Date(ord.createdAt).toLocaleDateString()} at{" "}
                              {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveOrder(ord);
                              setViewTab("tracking");
                              setSearchParams({ orderId: ord.orderNumber });
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>View Live Tracking</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          {isCompleted && (
                            <button
                              type="button"
                              onClick={() => {
                                ord.items?.forEach((item) => {
                                  cart.addToCart(
                                    {
                                      _id: item.menuItem || item.id,
                                      name: item.name,
                                      price: item.price,
                                      isVeg: item.isVeg,
                                    },
                                    item.quantity || 1,
                                    item.selectedCustomizations,
                                    ord.restaurant
                                  );
                                });
                                navigate("/checkout");
                              }}
                              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reorder</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* REVIEW RATING MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Rate Your Experience</h3>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {reviewSuccess ? (
              <div className="text-center py-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900">Thank you for rating!</h4>
                <p className="text-xs text-slate-500">Your review helps our culinary community flourish.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Restaurant Rating */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Rate {activeOrder?.restaurant?.name || "The Restaurant"}
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRestaurantRating(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            star <= restaurantRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200 hover:text-amber-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Courier Rating */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Rate Courier Partner ({activeOrder?.deliveryPartner?.name || "Delivery Partner"})
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCourierRating(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            star <= courierRating
                              ? "fill-emerald-500 text-emerald-500"
                              : "text-slate-200 hover:text-emerald-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <label htmlFor="review-comment" className="block text-xs font-bold text-slate-700 mb-1">
                    Your Feedback (Optional)
                  </label>
                  <textarea
                    id="review-comment"
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us about the taste, packaging, and delivery speed..."
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md shadow-orange-600/30 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CART DRAWER IF OPENED */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* 10. FOOTER */}
      <Footer />
    </div>
  );
}
