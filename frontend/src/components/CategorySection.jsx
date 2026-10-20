import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
    <section className="w-full py-10 md:py-12 bg-white border-b border-slate-100">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#151c27] tracking-tight">
              Inspiration for your order
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Explore curated food collections across Ahmedabad
            </p>
          </div>

          {/* Scroll Controls */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              aria-label="Previous categories"
              className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              aria-label="Next categories"
              className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Categories */}
        <div
          ref={scrollRef}
          className="flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.name)}
              className="flex flex-col items-center group flex-shrink-0 focus:outline-none"
            >
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-2 border-slate-200 group-hover:border-[#b12408] transition-colors overflow-hidden bg-slate-100">
                <img
                  src={category.image}
                  alt={category.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="mt-2 text-xs sm:text-sm font-medium text-slate-700 group-hover:text-[#b12408] transition-colors text-center whitespace-nowrap">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
