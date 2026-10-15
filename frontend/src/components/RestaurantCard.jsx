import React from "react";
import { Link } from "react-router-dom";
import { Star, Clock, Heart, Leaf, MapPin, Tag } from "lucide-react";

export default function RestaurantCard({
  restaurant,
  isFavorite = false,
  onToggleFavorite = () => {},
}) {
  const {
    id,
    _id,
    name,
    description,
    rating,
    deliveryTime,
    priceForTwo,
    offer,
    type,
    image,
    distance = "2.4 km",
    deliveryInfo = "Free Delivery above ₹199",
  } = restaurant;

  const restaurantId = _id || id;
  const isPureVeg = type === "Pure Veg" || restaurant.isPureVeg;

  return (
    <Link
      to={`/restaurant/${restaurantId}`}
      className="group bg-white rounded-3xl border border-slate-100 hover:border-orange-200 overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_16px_36px_-6px_rgba(234,88,12,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-pointer block"
    >
      {/* Image Container with Badges */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient shadow overlay for badge readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges: Pure Veg Tag & Favorite Button */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
          {isPureVeg ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-black tracking-wide shadow-sm">
              <Leaf className="w-3 h-3 fill-white" />
              PURE VEG
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold tracking-wide">
              MULTI-CUISINE
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(restaurantId);
            }}
            aria-label={`Favorite ${name}`}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-slate-700 flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-90"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorite
                  ? "fill-rose-500 text-rose-500"
                  : "text-slate-600 hover:text-rose-500"
              }`}
            />
          </button>
        </div>

        {/* Bottom Image Info: Offer & Delivery Time */}
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-10">
          {offer && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-600/95 backdrop-blur-md text-white text-xs font-black tracking-wide shadow-md shadow-orange-600/30">
              <Tag className="w-3 h-3 fill-white" />
              <span>{offer}</span>
            </div>
          )}

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-semibold ml-auto">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{deliveryTime}</span>
          </div>
        </div>
      </div>

      {/* Restaurant Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title & Rating */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
              {name}
            </h3>

            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-xs font-black shadow-xs flex-shrink-0">
              <span>{rating}</span>
              <Star className="w-3 h-3 fill-white" />
            </div>
          </div>

          {/* Description / Cuisines */}
          <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 font-normal leading-relaxed mb-4">
            {description}
          </p>
        </div>

        {/* Pricing, Distance & Delivery Meta */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span className="font-extrabold text-slate-900 text-sm">
            {priceForTwo}
          </span>

          <div className="flex items-center gap-1 text-slate-500 text-[11px] sm:text-xs">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{distance}</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-bold">{deliveryInfo}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
