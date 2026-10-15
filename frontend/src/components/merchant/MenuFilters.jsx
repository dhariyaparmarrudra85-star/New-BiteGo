export default function MenuFilters({
  searchDish = "",
  onSearchDishChange = () => {},
  dietaryFilter = "all",
  onDietaryFilterChange = () => {},
  stockFilter = "all",
  onStockFilterChange = () => {},
  sortBy = "popular",
  onSortByChange = () => {},
  onExportCSV = () => {},
  inStockCount = 36,
  outOfStockCount = 2,
  promoCount = 8,
}) {
  return (
    <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      {/* Left side filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
            search
          </span>
          <input
            value={searchDish}
            onChange={(e) => onSearchDishChange(e.target.value)}
            className="w-full h-10 pl-9 pr-3 bg-[#f0f3ff] rounded-lg text-xs sm:text-sm text-[#151c27] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b12408]/20 border border-slate-200/60"
            placeholder="Search dish, code (#TR-01)..."
            type="text"
          />
        </div>

        {/* Dietary Chips */}
        <div className="flex items-center bg-[#f0f3ff] p-1 rounded-lg border border-slate-200/60">
          <button
            type="button"
            onClick={() => onDietaryFilterChange("all")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
              dietaryFilter === "all"
                ? "bg-white text-[#151c27] shadow-xs font-bold"
                : "text-slate-600 hover:text-[#151c27]"
            }`}
          >
            All Types
          </button>
          <button
            type="button"
            onClick={() => onDietaryFilterChange("veg")}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              dietaryFilter === "veg"
                ? "bg-white text-[#151c27] shadow-xs font-bold"
                : "text-slate-600 hover:text-[#151c27]"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-xs bg-[#006947] flex items-center justify-center p-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </span>
            <span>Pure Veg</span>
          </button>
          <button
            type="button"
            onClick={() => onDietaryFilterChange("non-veg")}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              dietaryFilter === "non-veg"
                ? "bg-white text-[#151c27] shadow-xs font-bold"
                : "text-slate-600 hover:text-[#151c27]"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-xs bg-[#b12408] flex items-center justify-center p-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </span>
            <span>Non-Veg</span>
          </button>
        </div>

        {/* Stock Availability Filter */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => onStockFilterChange(stockFilter === "in" ? "all" : "in")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
              stockFilter === "in"
                ? "bg-[#e7eefe] text-[#151c27] border-slate-300 font-bold"
                : "bg-[#f0f3ff] text-slate-700 border-slate-200/60 hover:bg-[#e7eefe]"
            }`}
          >
            In Stock ({inStockCount})
          </button>
          <button
            type="button"
            onClick={() => onStockFilterChange(stockFilter === "out" ? "all" : "out")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
              stockFilter === "out"
                ? "bg-rose-100 text-[#ba1a1a] border-rose-200 font-bold"
                : "bg-[#f0f3ff] text-[#ba1a1a] border-slate-200/60 hover:bg-rose-50"
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
          <button
            type="button"
            onClick={() => onStockFilterChange(stockFilter === "promo" ? "all" : "promo")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
              stockFilter === "promo"
                ? "bg-amber-100 text-[#b12408] border-amber-200 font-bold"
                : "bg-[#f0f3ff] text-slate-600 border-slate-200/60 hover:bg-amber-50"
            }`}
          >
            On Promo ({promoCount})
          </button>
        </div>
      </div>

      {/* Right side: Sorting & Export */}
      <div className="flex items-center gap-2 self-start lg:self-auto">
        <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
          Sort By:
        </span>
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
          className="h-10 px-3 bg-[#f0f3ff] rounded-lg text-xs font-bold text-[#151c27] focus:outline-none cursor-pointer border border-slate-200/60"
        >
          <option value="popular">Most Popular (Weekly Orders)</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="rating">Highest Customer Rating</option>
          <option value="recent">Recently Modified</option>
        </select>
        <button
          onClick={onExportCSV}
          type="button"
          className="w-10 h-10 bg-[#f0f3ff] hover:bg-[#e7eefe] rounded-lg flex items-center justify-center text-[#151c27] transition-colors border border-slate-200/60 cursor-pointer shadow-xs"
          title="Export Menu CSV"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
        </button>
      </div>
    </div>
  );
}
