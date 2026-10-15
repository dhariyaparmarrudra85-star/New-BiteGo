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
    <div className="group bg-white rounded-3xl border border-slate-100 hover:border-orange-200 overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_36px_-6px_rgba(234,88,12,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full">
      {/* Dish Image and Badges */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Veg / Non-Veg Indicator */}
        <div className="absolute top-3 left-3 z-10">
          <div
            className={`w-5 h-5 rounded-md bg-white/95 backdrop-blur-xs flex items-center justify-center border shadow-xs ${
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

        {/* Rating & Reviews Pill */}
        <div className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-bold">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{rating}</span>
          <span className="text-white/60 font-normal">({reviews})</span>
        </div>
      </div>

      {/* Dish Details & Actions */}
      <div className="p-5 flex flex-col justify-between flex-1">
        <div>
          <h4 className="text-base font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
            {name}
          </h4>
          <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-1">
            {restaurant}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              Price
            </span>
            <span className="text-lg font-black text-slate-900 leading-tight">
              ₹{price}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onAddToCart(dish)}
            className="px-4 py-2 bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white border border-orange-200 hover:border-orange-600 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-orange-600/30 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>ADD</span>
          </button>
        </div>
      </div>
    </div>
  );
}
