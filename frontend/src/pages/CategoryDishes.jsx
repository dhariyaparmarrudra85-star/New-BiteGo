import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import CartDrawer from "../components/CartDrawer";
import DishCustomizationModal from "../components/DishCustomizationModal";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { API_BASE_URL } from "../services/api";
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  Star,
  Sparkles,
  Store,
  Clock,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

// Category Meta definitions
const CATEGORY_META = {
  pizza: {
    name: "Pizza",
    title: "Woodfired & Gourmet Pizzas",
    subtitle: "Authentic Neapolitan hand-tossed crusts, rich mozzarella & artisanal toppings",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
  },
  burgers: {
    name: "Burgers",
    title: "Crispy & Gourmet Burgers",
    subtitle: "Smashed patties, crispy cottage cheese & brioche buns grilled to perfection",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
  },
  biryani: {
    name: "Biryani",
    title: "Royal Dum Handi Biryani",
    subtitle: "Fragrant long-grain basmati slow-dum cooked with authentic spices & saffron",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=80",
  },
  momos: {
    name: "Momos",
    title: "Steamed & Pan-Fried Momos",
    subtitle: "Delicate dumplings packed with fresh ingredients & paired with fiery garlic chili chutney",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80",
  },
  chaat: {
    name: "Chaat",
    title: "Tangy Street Chaat & Bites",
    subtitle: "Crispy puris, chilled dahi, tangy tamarind saunth & authentic street flavors",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80",
  },
  dosa: {
    name: "Dosa",
    title: "Crispy South Indian Dosas",
    subtitle: "Golden fermented crepes roasted in pure desi ghee, served with fresh chutneys & sambar",
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=1200&q=80",
  },
  "paneer-tikka": {
    name: "Paneer Tikka",
    title: "Smoky Tandoori Paneer Tikka",
    subtitle: "Charcoal-grilled cottage cheese skewers marinated in spiced yogurt and herbs",
    image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=1200&q=80",
  },
  "fried-rice": {
    name: "Fried Rice",
    title: "Wok-Tossed Fried Rice",
    subtitle: "High-flame wok tossed Jasmine and Basmati rice with garden fresh veggies",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=1200&q=80",
  },
  sandwiches: {
    name: "Sandwiches",
    title: "Bombay Grilled Sandwiches",
    subtitle: "Loaded toasted sandwiches, cheese melts, focaccias & house special spreads",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80",
  },
  desserts: {
    name: "Desserts",
    title: "Decadent Desserts & Mithai",
    subtitle: "Sizzling brownies, fusion cheesecakes, warm gulab jamuns & artisan pastries",
    image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=1200&q=80",
  },
};

const ALL_TRENDING_CATEGORIES = [
  "Pizza",
  "Burgers",
  "Biryani",
  "Momos",
  "Chaat",
  "Dosa",
  "Paneer Tikka",
  "Fried Rice",
  "Sandwiches",
  "Desserts",
];

export default function CategoryDishes() {
  const { category: rawCategoryParam } = useParams();
  const navigate = useNavigate();

  const {
    items: cartItems,
    addToCart,
    updateQuantity,
    totalItemCount,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [isPureVegOnly, setIsPureVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState("rating-desc");
  const [customizingDish, setCustomizingDish] = useState(null);

  // Clean category name
  const categoryParam = useMemo(() => {
    return decodeURIComponent(rawCategoryParam || "").trim();
  }, [rawCategoryParam]);

  const categorySlug = useMemo(() => {
    return categoryParam.toLowerCase().replace(/[^a-z0-9]/g, "-");
  }, [categoryParam]);

  const currentMeta = useMemo(() => {
    return (
      CATEGORY_META[categorySlug] || {
        name: categoryParam,
        title: `${categoryParam} in Ahmedabad`,
        subtitle: `Explore all matching dishes available from open restaurants`,
        image:
          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
      }
    );
  }, [categorySlug, categoryParam]);

  // Fetch real dishes from backend API
  const fetchCategoryDishes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${API_BASE_URL}/restaurants/category/${encodeURIComponent(categoryParam)}`
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.dishes)) {
        setDishes(data.dishes);
      } else {
        setDishes([]);
        if (!data.success && data.message) {
          setError(data.message);
        }
      }
    } catch (err) {
      console.error("Error fetching category dishes:", err);
      setError("Unable to load dishes. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCategoryDishes();
  }, [categoryParam]);

  // Find quantity of a dish in current cart
  const getCartQuantityForDish = (dishId) => {
    if (!dishId) return 0;
    const items = cartItems.filter(
      (item) => item.id === dishId || item.menuItemId === dishId
    );
    return items.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  };

  const getCartItemForDish = (dishId) => {
    return cartItems.find(
      (item) => item.id === dishId || item.menuItemId === dishId
    );
  };

  // Add to cart handler
  const handleAddDish = (dish) => {
    if (!dish) return;
    if (dish.customizationGroups && dish.customizationGroups.length > 0) {
      setCustomizingDish(dish);
    } else {
      const restId = dish.restaurantId || dish.restaurant?._id;
      const restName =
        dish.restaurantName || dish.restaurant?.name || "BiteGo Restaurant";

      addToCart(dish, [], 1, {
        id: restId,
        name: restName,
      });
    }
  };

  // Handle customization confirmation
  const handleConfirmCustomization = (dish, selectedOptions, qty) => {
    const targetDish = dish || customizingDish;
    const restId = targetDish.restaurantId || targetDish.restaurant?._id;
    const restName =
      targetDish.restaurantName || targetDish.restaurant?.name || "BiteGo Restaurant";

    addToCart(targetDish, selectedOptions, qty, {
      id: restId,
      name: restName,
    });
    setCustomizingDish(null);
  };

  // Handle quantity changes for items already in cart
  const handleIncrement = (dish) => {
    const dishId = dish._id || dish.id;
    const existing = getCartItemForDish(dishId);
    if (existing) {
      updateQuantity(existing.cartItemId || existing.id, 1);
    } else {
      handleAddDish(dish);
    }
  };

  const handleDecrement = (dish) => {
    const dishId = dish._id || dish.id;
    const existing = getCartItemForDish(dishId);
    if (existing) {
      updateQuantity(existing.cartItemId || existing.id, -1);
    }
  };

  // Filter & sort dishes
  const displayedDishes = useMemo(() => {
    let list = [...dishes];

    // Filter by search text
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.restaurantName?.toLowerCase().includes(q)
      );
    }

    // Filter by Pure Veg
    if (isPureVegOnly) {
      list = list.filter((d) => d.isVeg === true);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "rating-desc") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "price-asc") return (a.price || 0) - (b.price || 0);
      if (sortBy === "price-desc") return (b.price || 0) - (a.price || 0);
      return 0;
    });

    return list;
  }, [dishes, searchFilter, isPureVegOnly, sortBy]);

  // Unique restaurants count
  const participatingRestaurants = useMemo(() => {
    const names = new Set();
    dishes.forEach((d) => {
      if (d.restaurantName) names.add(d.restaurantName);
    });
    return Array.from(names);
  }, [dishes]);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* 1. NAVBAR */}
      <Navbar
        activePage="Restaurants"
        cartCount={totalItemCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="flex-1 w-full pt-20 pb-20">
        {/* Category Hero Banner */}
        <section className="relative bg-[#151c27] text-white overflow-hidden py-10 sm:py-14 border-b border-slate-800">
          <div className="absolute inset-0 z-0 opacity-25">
            <img
              src={currentMeta.image}
              alt={currentMeta.name}
              className="w-full h-full object-cover filter blur-xs scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#151c27] via-[#151c27]/90 to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb / Back button */}
            <div className="flex items-center gap-2 mb-4">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>All Categories</span>
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-orange-400 font-medium text-xs sm:text-sm">
                {currentMeta.name}
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold tracking-wide uppercase mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  Trending Category in Ahmedabad
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                  {currentMeta.name}
                </h1>

                <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                  {currentMeta.subtitle}
                </p>

                {/* Live stats */}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>
                      {loading
                        ? "Loading dishes..."
                        : `${dishes.length} matching dish${
                            dishes.length === 1 ? "" : "es"
                          } found`}
                    </span>
                  </div>
                  {participatingRestaurants.length > 0 && (
                    <>
                      <span className="text-slate-600">•</span>
                      <div className="flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-orange-400" />
                        <span>Across {participatingRestaurants.length} open kitchens</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Category Switcher Tabs */}
              <div className="w-full md:w-auto overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 py-1">
                  {ALL_TRENDING_CATEGORIES.map((cat) => {
                    const isActive = cat.toLowerCase() === categoryParam.toLowerCase();
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => navigate(`/category/${encodeURIComponent(cat)}`)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#b12408] text-white shadow-sm"
                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
          {/* Controls Bar: Search & Filters */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search within category */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={`Search within ${currentMeta.name}...`}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b12408]/20 focus:border-[#b12408] transition-all"
              />
            </div>

            {/* Filters & Sorting */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Pure Veg Toggle */}
              <button
                type="button"
                onClick={() => setIsPureVegOnly(!isPureVegOnly)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                  isPureVegOnly
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Pure Veg Only</span>
              </button>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#b12408]/20 cursor-pointer"
                >
                  <option value="rating-desc">Rating: High to Low</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* 1. LOADING STATE */}
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-orange-200 border-t-[#b12408] animate-spin" />
              <p className="text-sm font-semibold text-slate-600">
                Fetching all available {currentMeta.name} dishes across Ahmedabad...
              </p>
            </div>
          )}

          {/* 2. ERROR STATE */}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto space-y-4">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
              <h3 className="text-base font-bold text-red-900">
                Failed to load category dishes
              </h3>
              <p className="text-xs text-red-700">{error}</p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={fetchCategoryDishes}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Try Again
                </button>
                <Link
                  to="/"
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs shadow-sm transition-colors hover:bg-slate-50"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          )}

          {/* 3. EMPTY STATE */}
          {!loading && !error && displayedDishes.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 text-[#b12408] flex items-center justify-center mx-auto shadow-inner">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                No dishes available in this category yet.
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We couldn't find dishes matching your current filters in{" "}
                <span className="font-semibold text-slate-700">
                  {currentMeta.name}
                </span>
                . Explore our other trending categories or check back shortly!
              </p>
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#151c27] hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <span>Explore All Categories</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* 4. DISHES GRID */}
          {!loading && !error && displayedDishes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {displayedDishes.map((dish) => {
                const dishId = dish._id || dish.id;
                const cartQty = getCartQuantityForDish(dishId);
                const isVeg = dish.isVeg !== undefined ? dish.isVeg : true;

                return (
                  <div
                    key={dishId}
                    className="group bg-white rounded-2xl border border-slate-200 hover:border-[#b12408]/30 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Top image & badges */}
                    <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = currentMeta.image;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

                      {/* Veg / Non-Veg Indicator */}
                      <div className="absolute top-3 left-3 z-10">
                        <div
                          className={`w-5 h-5 rounded bg-white shadow-xs flex items-center justify-center border ${
                            isVeg ? "border-emerald-600" : "border-rose-600"
                          }`}
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              isVeg ? "bg-emerald-600" : "bg-rose-600"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Rating pill */}
                      <div className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{dish.rating || 4.8}</span>
                        <span className="text-white/60 font-normal">
                          ({dish.reviewsCount || 120})
                        </span>
                      </div>

                      {/* Category tag */}
                      {dish.category && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className="px-2.5 py-0.5 rounded-lg bg-white/95 text-slate-800 text-[10px] font-bold shadow-xs">
                            {dish.category}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dish Info */}
                    <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 space-y-3">
                      <div>
                        {/* Restaurant Name */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                          <Store className="w-3.5 h-3.5 text-[#b12408] flex-shrink-0" />
                          <span className="truncate">{dish.restaurantName}</span>
                        </div>

                        {/* Dish Name */}
                        <h3 className="text-base font-extrabold text-[#151c27] group-hover:text-[#b12408] transition-colors line-clamp-1">
                          {dish.name}
                        </h3>

                        {/* Description */}
                        {dish.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {dish.description}
                          </p>
                        )}
                      </div>

                      {/* Footer: Price + Add / Quantity Controls */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-lg font-black text-[#151c27]">
                            ₹{dish.price}
                          </span>
                          {dish.customizationGroups?.length > 0 && (
                            <span className="block text-[10px] font-bold text-orange-600">
                              Customizable
                            </span>
                          )}
                        </div>

                        {/* Cart CTA Controls */}
                        <div>
                          {cartQty === 0 ? (
                            <button
                              type="button"
                              onClick={() => handleAddDish(dish)}
                              className="px-4 py-2 bg-orange-50 hover:bg-[#b12408] text-[#b12408] hover:text-white border-2 border-[#b12408]/30 hover:border-[#b12408] rounded-xl font-extrabold text-xs tracking-wider flex items-center gap-1.5 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
                              <span>ADD</span>
                            </button>
                          ) : (
                            <div className="flex items-center bg-white border-2 border-[#b12408] rounded-xl overflow-hidden shadow-xs">
                              <button
                                type="button"
                                onClick={() => handleDecrement(dish)}
                                aria-label="Decrease quantity"
                                className="w-8 h-8 flex items-center justify-center text-[#b12408] hover:bg-orange-50 active:bg-orange-100 transition-colors cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                              <span className="w-8 text-center text-xs font-black text-[#151c27]">
                                {cartQty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleIncrement(dish)}
                                aria-label="Increase quantity"
                                className="w-8 h-8 flex items-center justify-center text-[#b12408] hover:bg-orange-50 active:bg-orange-100 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Floating Cart Button */}
      {!isCartOpen && totalItemCount > 0 && (
        <aside aria-label="Cart Overview" className="fixed bottom-5 right-5 z-40">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label="Open Cart"
            className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#151c27] hover:bg-slate-800 text-white shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer border border-slate-700"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-orange-400" />
              <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[#b12408] text-white text-[10px] font-bold flex items-center justify-center">
                {totalItemCount}
              </span>
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-tight">View Cart</div>
              <div className="text-[10px] text-slate-300">
                {totalItemCount} item{totalItemCount === 1 ? "" : "s"}
              </div>
            </div>
          </button>
        </aside>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Customization Modal */}
      {customizingDish && (
        <DishCustomizationModal
          isOpen={Boolean(customizingDish)}
          onClose={() => setCustomizingDish(null)}
          dish={customizingDish}
          onConfirm={handleConfirmCustomization}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
