import {
  Search,
  ArrowRight,
  Clock,
  Bike,
  Star,
  MapPin,
} from "lucide-react";

export default function Hero({
  searchQuery = "",
  onSearchChange = () => {},
  activeFilters = ["Pure Veg"],
  onToggleFilter = () => {},
  onSearchSubmit = () => {},
}) {
  const filterPills = [
    { id: "pure-veg", label: "Pure Veg" },
    { id: "under-30", label: "Under 30 Mins" },
    { id: "offers", label: "Offers & 50% OFF" },
    { id: "rating", label: "Rating 4.5+" },
    { id: "gourmet", label: "Gourmet Curated" },
  ];

  return (
    <section className="relative w-full bg-slate-50 pt-24 pb-12 md:pt-28 md:pb-16 border-b border-slate-200">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Headline, Search, and Filters */}
          <div className="lg:col-span-7 flex flex-col space-y-5">
            {/* Delivery Badge */}
            <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-[#006947]" />
              <span className="text-[#b12408] font-semibold">Fastest Delivery in Ahmedabad</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">Avg 24 mins</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-[#151c27] tracking-tight leading-tight">
              Good food is just a{" "}
              <span className="text-[#b12408]">BiteGo</span>{" "}
              away.
            </h1>

            {/* Sub-description */}
            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              Discover top-rated restaurants, authentic Gujarati snacks, sizzling biryanis & swift doorstep delivery in Ahmedabad.
            </p>

            {/* Search Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchSubmit();
              }}
              className="w-full bg-white p-1.5 sm:p-2 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-sm focus-within:border-[#b12408]/40 focus-within:shadow-md transition-all"
            >
              <div className="flex-1 flex items-center px-3 gap-2">
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search restaurants, dishes or cuisines..."
                  className="w-full py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-3 bg-[#b12408] hover:bg-[#921d06] text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer flex-shrink-0"
              >
                <span>Find Food</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {filterPills.map((pill) => {
                const isSelected = activeFilters.includes(pill.label);
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => onToggleFilter(pill.label)}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors border ${
                      isSelected
                        ? "bg-[#006947] text-white border-[#006947]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-[#b12408]/40 hover:text-[#b12408]"
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Delivery Stats Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-sm bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#b12408] flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[#151c27]">
                      Ahmedabad Delivery
                    </h2>
                    <p className="text-xs text-[#006947] font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#006947]" />
                      Network Active
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                  AMD CITY
                </span>
              </div>

              {/* Riders Metric */}
              <div className="my-4 p-3.5 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#b12408] border border-orange-100">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#151c27] leading-none">
                      1,420
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Active Riders
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#006947]/10 text-[#006947]">
                  High Speed
                </span>
              </div>

              {/* Express Zone */}
              <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-md bg-[#006947]/10 text-[#006947] flex items-center justify-center flex-shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#151c27]">
                    Express Delivery Zone
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Navrangpura & Bodakdev — under 20 min
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-[#151c27]">4.8</span>
                  </div>
                  <p className="text-xs text-slate-500">Customer Rating</p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-sm font-bold text-[#151c27]">50k+</span>
                  </div>
                  <p className="text-xs text-slate-500">Meals Delivered</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}