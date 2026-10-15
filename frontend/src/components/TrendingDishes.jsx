import React, { useState, useEffect } from "react";
import DishCard from "./DishCard";
import { Flame, TrendingUp } from "lucide-react";
import { API_BASE_URL } from "../services/api";

export default function TrendingDishes({ onAddToCart = () => {} }) {
  const [trendingDishes, setTrendingDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE_URL}/restaurants/trending-dishes`)
      .then((res) => res.json())
      .then((data) => {
        const list = (data.dishes && Array.isArray(data.dishes)) ? data.dishes : (data.data && Array.isArray(data.data) ? data.data : []);
        if (isMounted && data.success && list.length > 0) {
          const formatted = list.slice(0, 4).map((d) => ({
            ...d,
            id: d._id || d.id,
            _id: d._id || d.id,
            restaurant: typeof d.restaurant === "string" ? d.restaurant : d.restaurant?.name || "The Dark Roast Pizzeria",
            restaurantId: d.restaurantId || d.restaurant?._id,
            type: d.isVeg ? "Veg" : "Non-Veg",
            reviews: d.reviews || "1.2k",
          }));
          setTrendingDishes(formatted);
        }
      })
      .catch((err) => console.log("Error loading trending dishes:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="w-full py-14 md:py-20 bg-slate-50/80 border-y border-slate-100">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-extrabold text-orange-600 mb-1.5">
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              <span>Crowd Favorites</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Trending Dishes Right Now
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-1 font-normal">
              Order these fastest-selling culinary creations in a single tap
            </p>
          </div>

          {/* Status text badge */}
          <div className="inline-flex items-center gap-2 self-start md:self-auto px-3.5 py-2 rounded-2xl bg-orange-100/70 border border-orange-200 text-orange-800 text-xs sm:text-sm font-bold shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600" />
            </span>
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span>Over 380 plates ordered in last hour</span>
          </div>
        </div>

        {/* 4 Dish Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingDishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
