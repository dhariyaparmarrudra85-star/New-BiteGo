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
      className="group bg-white rounded-xl border border-slate-200 hover:border-[#b12408]/30 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full cursor-pointer block"
    >
      {/* Image Container with Badges */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
        />

        {/* Gradient overlay for badge readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
          {isPureVeg ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#006947]/90 backdrop-blur-sm text-white text-[11px] font-semibold tracking-wide">
              <Leaf className="w-3 h-3" />
              PURE VEG
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900/70 backdrop-blur-sm text-white text-[11px] font-medium tracking-wide">
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
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white text-slate-600 flex items-center justify-center transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorite
                  ? "fill-rose-500 text-rose-500"
                  : "text-slate-500 hover:text-rose-500"
              }`}
            />
          </button>
        </div>

        {/* Bottom Image Info */}
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-10">
          {offer && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#b12408]/90 backdrop-blur-sm text-white text-xs font-semibold">
              <Tag className="w-3 h-3" />
              <span>{offer}</span>
            </div>
          )}

          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-medium ml-auto">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{deliveryTime}</span>
          </div>
        </div>
      </div>

      {/* Restaurant Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Title & Rating */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-base font-semibold text-slate-900 group-hover:text-[#b12408] transition-colors line-clamp-1">
              {name}
            </h3>

            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#006947] text-white text-xs font-semibold flex-shrink-0">
              <span>{rating}</span>
              <Star className="w-3 h-3 fill-white" />
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-3">
            {description}
          </p>
        </div>

        {/* Pricing & Meta */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="font-semibold text-slate-900 text-sm">
            {priceForTwo}
          </span>

          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{distance}</span>
            <span className="text-slate-300">·</span>
            <span className="text-[#006947] font-medium">{deliveryInfo}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
