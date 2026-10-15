import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Compass } from "lucide-react";
import { API_BASE_URL } from "../services/api";

export default function CategorySection({ onSelectCategory = () => {} }) {
  const scrollRef = useRef(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE_URL}/restaurants/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch((err) => console.error("Error loading categories:", err));

    return () => {
      isMounted = false;
    };
  }, []);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="w-full py-12 md:py-16 bg-white border-b border-slate-100">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Navigation Controls */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-extrabold text-orange-600 mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>Curated Feasts</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Inspiration for your order
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-1 font-normal">
              Explore delicious collections curated by our master food editors
            </p>
          </div>

          {/* Desktop Arrow Scroll Controls */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              aria-label="Previous categories"
              className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 flex items-center justify-center transition-all shadow-xs hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              aria-label="Next categories"
              className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 flex items-center justify-center transition-all shadow-xs hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Categories List */}
        <div
          ref={scrollRef}
          className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.name)}
              className="flex flex-col items-center group flex-shrink-0 focus:outline-none transition-transform"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-orange-100 to-amber-100 group-hover:from-orange-500 group-hover:to-amber-500 transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:shadow-orange-500/25">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-100">
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </div>
              <span className="mt-3 text-xs sm:text-sm font-bold text-slate-800 group-hover:text-orange-600 transition-colors text-center whitespace-nowrap">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
