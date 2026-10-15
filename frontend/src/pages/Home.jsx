import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import CategorySection from "../components/CategorySection";
import RestaurantSection from "../components/RestaurantSection";
import TrendingDishes from "../components/TrendingDishes";
import GoldPass from "../components/GoldPass";
import CartDrawer from "../components/CartDrawer";
import DishCustomizationModal from "../components/DishCustomizationModal";
import Footer from "../components/Footer";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function Home() {
  const {
    items: cartItems,
    addToCart,
    updateQuantity: handleUpdateQuantity,
    removeFromCart: handleRemoveItem,
    totalItemCount,
    total: calculatedTotal,
  } = useCart();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState(["Pure Veg 🌱"]);
  const [customizingDish, setCustomizingDish] = useState(null);

  // Add Dish to Cart (handles modal if customizable)
  const handleAddToCart = (dish) => {
    if (!dish) return;
    if (dish.customizationGroups && dish.customizationGroups.length > 0) {
      setCustomizingDish(dish);
    } else {
      const resId =
        dish.restaurantId ||
        dish.restaurant?._id ||
        dish.restaurant?.id ||
        null;
      const resName =
        (typeof dish.restaurant === "string" ? dish.restaurant : dish.restaurant?.name) ||
        dish.restaurantName ||
        "BiteGo Kitchen";

      addToCart(dish, [], 1, {
        id: resId,
        name: resName,
      });
      setIsCartOpen(true);
    }
  };

  const handleConfirmCustomization = (arg1, arg2, arg3) => {
    const dish = arg1?.dish || arg1 || customizingDish;
    const customizations = Array.isArray(arg2) ? arg2 : (arg1?.selectedOptions || []);
    const quantity = typeof arg3 === "number" ? arg3 : (arg1?.quantity || 1);

    const resId =
      dish.restaurantId ||
      dish.restaurant?._id ||
      dish.restaurant?.id ||
      null;
    const resName =
      (typeof dish.restaurant === "string" ? dish.restaurant : dish.restaurant?.name) ||
      dish.restaurantName ||
      "BiteGo Kitchen";

    addToCart(dish, customizations, quantity, {
      id: resId,
      name: resName,
    });
    setCustomizingDish(null);
    setIsCartOpen(true);
  };

  // Filter Toggle
  const handleToggleFilter = (filterLabel) => {
    setActiveFilters((prev) =>
      prev.includes(filterLabel)
        ? prev.filter((f) => f !== filterLabel)
        : [...prev, filterLabel]
    );
  };

  // Category selection scrolls to restaurant section or fills search
  const handleSelectCategory = (categoryName) => {
    setSearchQuery(categoryName);
    const elem = document.getElementById("restaurants-section");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-orange-500 selection:text-white">
      {/* 1. FIXED NAVBAR */}
      <Navbar
        cartCount={totalItemCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full">
        {/* 2. HERO + SEARCH */}
        <Hero
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilters={activeFilters}
          onToggleFilter={handleToggleFilter}
          onSearchSubmit={() => {
            const elem = document.getElementById("restaurants-section");
            if (elem) elem.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* 3. FOOD CATEGORY / INSPIRATION SECTION */}
        <CategorySection onSelectCategory={handleSelectCategory} />

        {/* 4. POPULAR RESTAURANTS IN AHMEDABAD */}
        <RestaurantSection
          searchQuery={searchQuery}
          activeFilters={activeFilters}
        />

        {/* 5. TRENDING DISHES RIGHT NOW */}
        <TrendingDishes onAddToCart={handleAddToCart} />

        {/* 6. BITEGO GOLD PASS */}
        <GoldPass />
      </main>

      {/* 7. FLOATING CART BUTTON (Bottom-Right) */}
      {!isCartOpen && totalItemCount > 0 && (
        <aside aria-label="Cart Overview" className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-6 duration-300">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label="Open Cart"
            className="group flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-slate-900/95 hover:bg-slate-950 text-white backdrop-blur-md shadow-[0_12px_30px_-5px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_36px_-5px_rgba(234,88,12,0.35)] border border-slate-800 hover:border-orange-500/50 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/40 group-hover:rotate-6 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black flex items-center justify-center shadow-xs">
                {totalItemCount}
              </span>
            </div>

            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-300 leading-tight">
                {totalItemCount} {totalItemCount === 1 ? "item" : "items"} in cart
              </span>
              <span className="text-sm font-black text-white">
                ₹{calculatedTotal.toFixed(2)}
              </span>
            </div>

            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:bg-orange-600 transition-colors ml-1">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </aside>
      )}

      {/* 8. CART DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* DISH CUSTOMIZATION MODAL */}
      <DishCustomizationModal
        isOpen={Boolean(customizingDish)}
        dish={customizingDish}
        onClose={() => setCustomizingDish(null)}
        onConfirm={handleConfirmCustomization}
      />

      {/* 9. FOOTER */}
      <Footer />
    </div>
  );
}
