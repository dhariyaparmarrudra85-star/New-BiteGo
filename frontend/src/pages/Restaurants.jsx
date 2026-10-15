import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import RestaurantCard from "../components/RestaurantCard";
import CartDrawer from "../components/CartDrawer";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { API_BASE_URL } from "../services/api";
import { Search, Sparkles, Filter, Store, ArrowRight, ShoppingBag } from "lucide-react";

export default function Restaurants() {
  const { totalItemCount, finalTotal, isCartOpen, setIsCartOpen } = useCart();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedHub, setSelectedHub] = useState("All Hubs");
  const [sortBy, setSortBy] = useState("rating-desc");

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/restaurants`);
        const json = await res.json();
        const list = (json.data && Array.isArray(json.data))
          ? json.data
          : (json.restaurants && Array.isArray(json.restaurants))
          ? json.restaurants
          : [];
        setRestaurants(list);
      } catch (err) {
        console.error("Failed to load restaurants:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const hubs = useMemo(() => {
    const set = new Set();
    restaurants.forEach((r) => {
      if (r.hub) set.add(r.hub);
    });
    return ["All Hubs", ...Array.from(set)];
  }, [restaurants]);

  const filteredRestaurants = useMemo(() => {
    let result = [...restaurants];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.cuisine?.toLowerCase().includes(q) ||
          r.address?.toLowerCase().includes(q)
      );
    }

    if (activeFilter === "Pure Veg") {
      result = result.filter((r) => r.isPureVeg || r.type === "Pure Veg");
    } else if (activeFilter === "Top Rated") {
      result = result.filter((r) => (r.rating || 0) >= 4.5);
    } else if (activeFilter === "Offers") {
      result = result.filter((r) => Boolean(r.offer));
    }

    if (selectedHub !== "All Hubs") {
      result = result.filter((r) => r.hub === selectedHub);
    }

    result.sort((a, b) => {
      if (sortBy === "rating-desc") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "cost-asc") return (a.costNumeric || 500) - (b.costNumeric || 500);
      if (sortBy === "cost-desc") return (b.costNumeric || 500) - (a.costNumeric || 500);
      return 0;
    });

    return result;
  }, [restaurants, searchQuery, activeFilter, selectedHub, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* 1. NAVBAR */}
      <Navbar
        activePage="Restaurants"
        cartCount={totalItemCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 w-full pt-24 pb-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold border border-orange-100">
                <Store className="w-3.5 h-3.5" />
                <span>Verified Ahmedabad Kitchens</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                All Restaurants &amp; Eateries
              </h1>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                Discover award-winning kitchens, heritage Gujarati dining halls, and gourmet artisan pizzerias across the city.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-gradient-to-tr from-orange-400/20 to-amber-300/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by restaurant name, cuisine or dish..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto no-scrollbar">
              {["All", "Pure Veg", "Top Rated", "Offers"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(f)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === f
                      ? "bg-orange-600 text-white shadow-sm shadow-orange-600/30"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f}
                </button>
              ))}

              {/* Hub Dropdown */}
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                className="px-3 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                {hubs.map((hub) => (
                  <option key={hub} value={hub}>
                    {hub}
                  </option>
                ))}
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="rating-desc">Rating: High to Low</option>
                <option value="cost-asc">Cost: Low to High</option>
                <option value="cost-desc">Cost: High to Low</option>
              </select>
            </div>
          </div>

          {/* Restaurant Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-3" />
              <p className="text-xs font-bold text-slate-500">Loading verified kitchens...</p>
            </div>
          ) : filteredRestaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant._id || restaurant.id}
                  restaurant={restaurant}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
              <p className="text-base font-bold text-slate-800">No restaurants match your filters</p>
              <p className="text-xs text-slate-500">Try clearing your search query or choosing another delivery hub.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("All");
                  setSelectedHub("All Hubs");
                }}
                className="mt-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-bold text-xs hover:bg-orange-100"
              >
                Reset Filters
              </button>
            </div>
          )}
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
