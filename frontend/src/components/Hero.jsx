import {
  Search,
  Mic,
  ArrowRight,
  Zap,
  Radio,
  Clock,
  Bike,
  Star,
  Sparkles,
} from "lucide-react";

export default function Hero({
  searchQuery = "",
  onSearchChange = () => {},
  activeFilters = ["Pure Veg 🌱"],
  onToggleFilter = () => {},
  onSearchSubmit = () => {},
}) {
  const filterPills = [
    { id: "pure-veg", label: "Pure Veg 🌱" },
    { id: "under-30", label: "Under 30 Mins ⚡" },
    { id: "offers", label: "Offers & 50% OFF 🏷️" },
    { id: "rating", label: "Rating 4.5+ ⭐" },
    { id: "gourmet", label: "Gourmet Curated ✓" },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50/40 to-orange-50/30 pt-28 pb-16 md:pt-32 md:pb-20 border-b border-slate-100">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 -left-20 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Headline, Search, and Filters */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            {/* Delivery Badge */}
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-white/90 border border-orange-200 shadow-sm text-xs sm:text-sm font-bold text-orange-900">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600" />
              </span>
              <span className="text-orange-700 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                Fastest Delivery in Ahmedabad
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 font-medium">Avg 24 mins</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Good food is just a{" "}
              <span className="relative inline-block text-orange-600 whitespace-nowrap">
                <span>BiteGo</span>
                {/* Wavy Underline SVG */}
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-orange-500"
                  viewBox="0 0 120 12"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 7C15 2 25 11 38 7C51 3 61 11 74 7C87 3 97 11 110 7C114 5.5 117 6 118 7"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              away.
            </h1>

            {/* Sub-description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              Discover top-rated restaurants, authentic Gujarati snacks, sizzling biryanis &amp; swift doorstep delivery in Ahmedabad.
            </p>

            {/* Search Box Card */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchSubmit();
              }}
              className="w-full bg-white p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl shadow-[0_10px_35px_-5px_rgba(0,0,0,0.08)] border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 transition-shadow focus-within:shadow-[0_15px_40px_-5px_rgba(234,88,12,0.15)] focus-within:border-orange-300"
            >
              <div className="flex-1 flex items-center px-3 gap-2.5">
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search restaurants, dishes or cuisines (e.g. Manek Chowk Khakhra, Kathiyawadi Thali, Wood-fired Pizza...)"
                  className="w-full py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                />
                <button
                  type="button"
                  title="Voice search"
                  className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors flex-shrink-0"
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>

              <button
                type="submit"
                className="px-6 py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex-shrink-0"
              >
                <span>Find Food</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {filterPills.map((pill) => {
                const isSelected = activeFilters.includes(pill.label);
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => onToggleFilter(pill.label)}
                    className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 border ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30"
                        : "bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/50"
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Ahmedabad Live Food Radar Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] relative overflow-hidden group hover:border-orange-200 transition-all">
              {/* Subtle accent glow */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-orange-500/10 to-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-orange-600 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                      Ahmedabad Live Food Radar
                    </h2>
                    <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                      Live Network Tracking
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-black tracking-wider uppercase px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                  AMD CITY
                </span>
              </div>

              {/* Big Metric: Active Riders */}
              <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-orange-50/80 to-amber-50/80 border border-orange-100/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-orange-600 border border-orange-100">
                    <Bike className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900 leading-none">
                      1,420
                    </p>
                    <p className="text-xs font-semibold text-slate-600 mt-1">
                      Active Riders on Street
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                    High Speed
                  </span>
                </div>
              </div>

              {/* Express Delivery Zone */}
              <div className="mb-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">
                    Express Delivery Zone
                  </p>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Navrangpura &amp; Bodakdev guarantee under 20m
                  </p>
                </div>
              </div>

              {/* Stats Footer: Customer Love & Meals Delivered */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div className="p-3 rounded-xl bg-white border border-slate-100/80 shadow-xs">
                  <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-black text-slate-900">
                      4.8★
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Customer Love
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-100/80 shadow-xs">
                  <div className="flex items-center gap-1 text-orange-600 mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-black text-slate-900">
                      50k+
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Meals Delivered
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}