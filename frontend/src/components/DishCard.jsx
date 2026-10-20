import React from "react";
import { Star, Plus } from "lucide-react";

export default function DishCard({ dish, onAddToCart = () => {} }) {
  const {
    name,
    restaurant,
    price,
    rating,
    reviews,
    type,
    image,
  } = dish;

  const isVeg = type === "Veg";

  return (
    <div className="group bg-white rounded-xl border border-slate-200 hover:border-[#b12408]/30 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full">
      {/* Dish Image */}
      <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
        />

        {/* Veg / Non-Veg Indicator */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <div
            className={`w-5 h-5 rounded bg-white/95 flex items-center justify-center border ${
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

        {/* Rating Pill */}
        <div className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>{rating}</span>
          <span className="text-white/60">({reviews})</span>
        </div>
      </div>

      {/* Dish Details */}
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 group-hover:text-[#b12408] transition-colors line-clamp-1">
            {name}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
            {restaurant}
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-base font-bold text-slate-900">
            ₹{price}
          </span>

          <button
            type="button"
            onClick={() => onAddToCart(dish)}
            className="px-3 py-1.5 bg-orange-50 hover:bg-[#b12408] text-[#b12408] hover:text-white border border-orange-200 hover:border-[#b12408] rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD</span>
          </button>
        </div>
      </div>
    </div>
  );
}
