import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import DishCustomizationModal from "../components/DishCustomizationModal";
import { useCart } from "../context/CartContext";
import { API_BASE_URL } from "../services/api";
import {
  Star,
  Clock,
  MapPin,
  Leaf,
  Tag,
  Search,
  Plus,
  ArrowLeft,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

export default function RestaurantDetail() {
  const { restaurantId } = useParams();
  const { cartItems, addToCart, isCartOpen, setIsCartOpen, totalItemCount, finalTotal } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [dishSearch, setDishSearch] = useState("");
  const [selectedDishForCustomization, setSelectedDishForCustomization] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchRestaurantAndMenu = async () => {
      try {
        setLoading(true);
        // 1. Fetch Restaurant details
        const restRes = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`);
        const restData = await restRes.json();

        if (!restData.success || !restData.restaurant) {
          setError(restData.message || "Restaurant not found");
          setLoading(false);
          return;
        }

        setRestaurant(restData.restaurant);

        // 2. Fetch Menu
        const menuRes = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/menu`);
        const menuData = await menuRes.json();

        if (menuData.success && menuData.menu) {
          setMenu(menuData.menu);
          if (menuData.menu.length > 0) {
            setActiveCategory(menuData.menu[0].category);
          }
        }
      } catch (err) {
        console.error("Error loading restaurant:", err);
        setError("Failed to load restaurant details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantAndMenu();
  }, [restaurantId]);

  const handleAddClick = (dish) => {
    if (dish.customizationGroups && dish.customizationGroups.length > 0) {
      setSelectedDishForCustomization({
        ...dish,
        restaurant: restaurant?.name,
        restaurantId: restaurant?._id,
      });
    } else {
      addToCart(
        {
          id: dish._id || dish.id,
          name: dish.name,
          price: dish.price,
          image: dish.image,
          isVeg: dish.isVeg,
          restaurant: restaurant?.name,
          restaurantId: restaurant?._id,
        },
        [],
        1,
        { id: restaurant?._id, name: restaurant?.name }
      );
    }
  };

  const handleCustomizationConfirm = (dish, customizations, quantity) => {
    addToCart(
      dish,
      customizations,
      quantity,
      { id: restaurant?._id, name: restaurant?.name }
    );
  };

  // Filter menu items by search
  const filteredMenu = menu.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) => {
      if (!dishSearch.trim()) return true;
      const q = dishSearch.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
    }),
  })).filter((cat) => cat.items.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar cartCount={totalItemCount} onOpenCart={() => setIsCartOpen(true)} />
        <div className="flex-1 flex items-center justify-center pt-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-orange-200 border-t-orange-600 animate-spin" />
            <p className="text-sm font-bold text-slate-600">Summoning culinary delights...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar cartCount={totalItemCount} onOpenCart={() => setIsCartOpen(true)} />
        <div className="flex-1 flex items-center justify-center pt-24 p-6">
          <div className="max-w-md text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl font-black">
              !
            </div>
            <h2 className="text-xl font-black text-slate-900">{error || "Restaurant Not Found"}</h2>
            <p className="text-sm text-slate-500">
              The kitchen you are looking for might be temporarily offline or closed for orders.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-600/30 hover:bg-orange-700 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Ahmedabad Eateries</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* 1. NAVBAR */}
      <Navbar cartCount={totalItemCount} onOpenCart={() => setIsCartOpen(true)} />

      {/* MAIN RESTAURANT PORTAL */}
      <main className="flex-1 w-full pt-20">
        {/* RESTAURANT HERO HEADER */}
        <div className="relative bg-white border-b border-slate-100 pb-8 sm:pb-12 pt-6">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Link to="/" className="hover:text-orange-600 transition-colors">Home</Link>
              <span>/</span>
              <span className="hover:text-orange-600 transition-colors">{restaurant.city || "Ahmedabad"}</span>
              <span>/</span>
              <span className="text-slate-800 font-bold truncate max-w-xs">{restaurant.name}</span>
            </div>

            {/* Banner & Information Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Photo Box */}
              <div className="lg:col-span-5 relative h-56 sm:h-64 rounded-3xl overflow-hidden bg-slate-100 shadow-md border border-slate-100">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  {restaurant.isPureVeg ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black shadow-sm">
                      <Leaf className="w-3.5 h-3.5 fill-white" />
                      PURE VEG
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold">
                      MULTI-CUISINE
                    </span>
                  )}
                </div>
              </div>

              {/* Details Box */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                      {restaurant.name}
                    </h1>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-sm">
                      <span>{restaurant.rating}</span>
                      <Star className="w-4 h-4 fill-white" />
                      <span className="text-emerald-100 font-normal text-xs ml-0.5">({restaurant.numRatings}+)</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {restaurant.description}
                  </p>
                </div>

                {/* Meta Pills (Delivery Time, Price for Two, Hub) */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-100 text-orange-800 text-xs font-bold">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span>{restaurant.deliveryTime} arrival</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{restaurant.address}</span>
                  </div>

                  <div className="text-xs font-bold text-slate-800 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    {restaurant.priceForTwo}
                  </div>
                </div>

                {/* Offer Banner */}
                {restaurant.offer && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/70 flex items-center gap-2.5 text-xs text-orange-950 font-bold">
                    <Tag className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>{restaurant.offer}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MENU EXPLORER & CATEGORIES SECTION */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Menu Search and Filter Bar */}
          <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Category Navigation Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar pb-1 md:pb-0">
              {menu.map((cat) => (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.category);
                    const elem = document.getElementById(`cat-${cat.category.replace(/\s+/g, "-")}`);
                    if (elem) elem.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === cat.category
                      ? "bg-orange-600 text-white shadow-sm shadow-orange-600/30"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {cat.category} ({cat.items.length})
                </button>
              ))}
            </div>

            {/* Quick Dish Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={dishSearch}
                onChange={(e) => setDishSearch(e.target.value)}
                placeholder="Search in this menu..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Categorized Menu Dish List */}
          <div className="space-y-12">
            {filteredMenu.map((catGroup) => (
              <section
                key={catGroup.category}
                id={`cat-${catGroup.category.replace(/\s+/g, "-")}`}
                className="scroll-mt-40 space-y-6"
              >
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {catGroup.category}
                  </h2>
                  <span className="text-xs font-bold text-slate-400">
                    ({catGroup.items.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {catGroup.items.map((dish) => {
                    const isVeg = dish.isVeg !== undefined ? dish.isVeg : true;

                    return (
                      <div
                        key={dish._id}
                        className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:border-orange-200 hover:shadow-md transition-all flex justify-between gap-4"
                      >
                        {/* Dish Details */}
                        <div className="flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              {/* Dietary Veg / Non-veg Indicator */}
                              <div
                                className={`w-4 h-4 rounded-sm bg-white flex items-center justify-center border ${
                                  isVeg ? "border-emerald-600" : "border-rose-600"
                                }`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    isVeg ? "bg-emerald-600" : "bg-rose-600"
                                  }`}
                                />
                              </div>

                              {dish.isTrending && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Trending
                                </span>
                              )}
                            </div>

                            <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                              {dish.name}
                            </h3>

                            <p className="text-sm font-black text-slate-900 mt-1">
                              ₹{dish.price}
                            </p>

                            <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                              {dish.description}
                            </p>
                          </div>

                          {dish.customizationGroups?.length > 0 && (
                            <span className="text-[11px] font-bold text-orange-600">
                              Customizable
                            </span>
                          )}
                        </div>

                        {/* Dish Image & Add CTA */}
                        <div className="relative w-28 sm:w-32 flex flex-col items-center shrink-0">
                          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-100 shadow-xs">
                            <img
                              src={dish.image}
                              alt={dish.name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddClick(dish)}
                            className="absolute -bottom-2 w-24 py-1.5 rounded-xl bg-white hover:bg-orange-600 text-orange-600 hover:text-white border-2 border-orange-500 font-black text-xs uppercase shadow-md flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>ADD</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {filteredMenu.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                <p className="text-base font-bold text-slate-700">No dishes matched "{dishSearch}"</p>
                <button
                  type="button"
                  onClick={() => setDishSearch("")}
                  className="text-xs font-bold text-orange-600 mt-1 hover:underline"
                >
                  Clear search keyword
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FLOATING CART SUMMARY (Mobile / Quick access) */}
      {!isCartOpen && totalItemCount > 0 && (
        <aside className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom duration-300">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-slate-900 text-white backdrop-blur-md shadow-2xl border border-slate-800 hover:border-orange-500 transition-all hover:scale-105 active:scale-95 cursor-pointer"
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

      {/* DISH CUSTOMIZATION MODAL */}
      <DishCustomizationModal
        isOpen={Boolean(selectedDishForCustomization)}
        onClose={() => setSelectedDishForCustomization(null)}
        dish={selectedDishForCustomization}
        onConfirm={handleCustomizationConfirm}
      />

      {/* CART DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
