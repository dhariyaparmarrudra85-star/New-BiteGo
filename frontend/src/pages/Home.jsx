import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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

  // Category selection navigates to category dishes page
  const handleSelectCategory = (categoryName) => {
    navigate(`/category/${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
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

        {/* 3. TRENDING FOOD RIGHT NOW (10 Trending Categories) */}
        <TrendingDishes onAddToCart={handleAddToCart} />

        {/* 4. POPULAR RESTAURANTS IN AHMEDABAD */}
        <RestaurantSection
          searchQuery={searchQuery}
          activeFilters={activeFilters}
        />

        {/* 5. BITEGO GOLD PASS */}
        <GoldPass />
      </main>

      {/* 7. FLOATING CART BUTTON (Bottom-Right) */}
      {!isCartOpen && totalItemCount > 0 && (
        <aside aria-label="Cart Overview" className="fixed bottom-5 right-5 z-40">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label="Open Cart"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#151c27] hover:bg-slate-800 text-white shadow-lg transition-colors cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[#b12408] text-white text-[9px] font-bold flex items-center justify-center">
                {totalItemCount}
              </span>
            </div>

            <div className="flex flex-col text-left">
              <span className="text-xs text-slate-300">
                {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
              </span>
              <span className="text-sm font-bold">
                ₹{calculatedTotal.toFixed(2)}
              </span>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 ml-1" />
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
