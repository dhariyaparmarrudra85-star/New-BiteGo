import React from "react";
import { useNavigate } from "react-router-dom";
import { Flame, ArrowRight, Sparkles } from "lucide-react";

// The 10 Mandatory Trending Categories
export const TRENDING_CATEGORIES = [
  {
    id: "pizza",
    name: "Pizza",
    tagline: "Woodfired & Cheesy",
    badge: "19+ Dishes",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "burgers",
    name: "Burgers",
    tagline: "Gourmet & Crispy",
    badge: "Top Rated",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "biryani",
    name: "Biryani",
    tagline: "Slow-Dum Handi",
    badge: "Most Ordered",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "momos",
    name: "Momos",
    tagline: "Steamed & Schezwan",
    badge: "Trending",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "chaat",
    name: "Chaat",
    tagline: "Tangy & Street Bites",
    badge: "Ahmedabad Fav",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "dosa",
    name: "Dosa",
    tagline: "Crisp Mysore & Ghee",
    badge: "South Spice",
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "paneer-tikka",
    name: "Paneer Tikka",
    tagline: "Tandoori & Malai",
    badge: "21+ Dishes",
    image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "fried-rice",
    name: "Fried Rice",
    tagline: "Wok Burnt Garlic",
    badge: "Pan-Asian",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "sandwiches",
    name: "Sandwiches",
    tagline: "Bombay Grilled Toast",
    badge: "Popular",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "desserts",
    name: "Desserts",
    tagline: "Sizzling Brownie & Mithai",
    badge: "Sweet Cravings",
    image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80",
  },
];

export default function TrendingDishes({ onAddToCart = () => {} }) {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName) => {
    navigate(`/category/${encodeURIComponent(categoryName)}`);
  };

  return (
    <section
      id="trending-food-section"
      className="w-full py-12 md:py-16 bg-slate-50 border-y border-slate-200"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-[#b12408] text-xs font-bold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#b12408]" />
                Curated Cravings
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#151c27] tracking-tight">
              Trending Food Right Now
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Click any trending category to view all matching dishes across top Ahmedabad restaurants
            </p>
          </div>

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 self-start md:self-auto px-3.5 py-2 rounded-xl bg-white border border-orange-200 text-[#b12408] text-xs sm:text-sm font-semibold shadow-xs">
            <Flame className="w-4 h-4 text-[#b12408] animate-pulse" />
            <span>10 Trending Categories live today</span>
          </div>
        </div>

        {/* Categories Grid (5 columns on desktop, 3 on tablet, 2 on mobile) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {TRENDING_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryClick(cat.name)}
              className="group relative bg-white rounded-2xl border border-slate-200 hover:border-[#b12408]/40 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 text-left flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#b12408]/20 active:scale-[0.98]"
            >
              {/* Image Container */}
              <div className="relative h-32 sm:h-36 w-full overflow-hidden bg-slate-100">
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Badge */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="px-2 py-0.5 rounded-md bg-white/95 text-slate-800 text-[10px] font-bold shadow-xs">
                    {cat.badge}
                  </span>
                </div>

                {/* Arrow hint icon */}
                <div className="absolute bottom-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-[#b12408] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1 transition-all duration-300 shadow-md">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Text info */}
              <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1">
                <h3 className="text-sm sm:text-base font-bold text-[#151c27] group-hover:text-[#b12408] transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {cat.tagline}
                </p>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-[#b12408]">
                  <span>Explore Dishes</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
