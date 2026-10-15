import { useState, useMemo, useEffect } from "react";
import RestaurantCard from "./RestaurantCard";
import { Sparkles, ArrowUpDown } from "lucide-react";
import { API_BASE_URL } from "../services/api";

export default function RestaurantSection({ searchQuery = "", activeFilters = [] }) {
  const [restaurants, setRestaurants] = useState([]);
  const [sortBy, setSortBy] = useState("rating-desc");
  const [favorites, setFavorites] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch real restaurants from MongoDB API
  useEffect(() => {
    let isMounted = true;
    const fetchRestaurants = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/restaurants`);
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.data) && json.data.length > 0) {
          // Normalize restaurants
          const list = json.data.map((r) => ({
            ...r,
            id: r._id || r.id,
            distance: r.distance || "2.1 km",
            deliveryInfo: r.deliveryInfo || "Free Delivery",
            deliveryNumeric: r.deliveryNumeric || parseInt(r.deliveryTime) || 30,
            costNumeric: r.costNumeric || (typeof r.priceForTwo === "string" ? parseInt(r.priceForTwo.replace(/\D/g, "")) : 500) || 500,
          }));
          setRestaurants(list);
        }
      } catch (err) {
        console.error("Failed to load live restaurants, using cached fallback:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRestaurants();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch customer favorites if logged in
  useEffect(() => {
    const token = localStorage.getItem("bitego_token");
    if (!token) return;

    fetch(`${API_BASE_URL}/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.favorites)) {
          const favMap = {};
          data.favorites.forEach((f) => {
            if (f.restaurant) favMap[f.restaurant._id || f.restaurant] = true;
          });
          setFavorites(favMap);
        }
      })
      .catch((err) => console.error("Error loading favorites:", err));
  }, []);

  const toggleFavorite = async (restaurantId) => {
    // Optimistic toggle
    setFavorites((prev) => ({
      ...prev,
      [restaurantId]: !prev[restaurantId],
    }));

    const token = localStorage.getItem("bitego_token");
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/favorites/toggle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ targetType: "restaurant", targetId: restaurantId }),
        });
      } catch (e) {
        console.error("Toggle favorite failed:", e);
      }
    }
  };

  // Filter and Sort Restaurants
  const filteredAndSortedRestaurants = useMemo(() => {
    let result = [...restaurants];

    // Filter by search query if any
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          (r.cuisine && r.cuisine.toLowerCase().includes(q))
      );
    }

    // Filter by active pills
    if (activeFilters.includes("Pure Veg 🌱") && !activeFilters.includes("All")) {
      // If pure veg is active and user has toggled or selected other pills
      // Keep pure veg filter applied
      result = result.filter((r) => r.isPureVeg || r.type === "Pure Veg");
    }

    if (activeFilters.includes("Fast Delivery ⚡")) {
      result = result.filter((r) => (r.deliveryNumeric || 30) <= 25);
    }

    if (activeFilters.includes("Top Rated ★")) {
      result = result.filter((r) => (r.rating || 0) >= 4.5);
    }

    if (activeFilters.includes("Great Offers %")) {
      result = result.filter((r) => Boolean(r.offer));
    }

    // Sort logic
    result.sort((a, b) => {
      switch (sortBy) {
        case "rating-desc":
          return (b.rating || 0) - (a.rating || 0);
        case "time-asc":
          return (a.deliveryNumeric || 0) - (b.deliveryNumeric || 0);
        case "cost-asc":
          return (a.costNumeric || 0) - (b.costNumeric || 0);
        case "cost-desc":
          return (b.costNumeric || 0) - (a.costNumeric || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [restaurants, searchQuery, activeFilters, sortBy]);

  return (
    <section id="restaurants-section" className="w-full py-14 md:py-20 bg-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-extrabold text-orange-600 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Handpicked Culinary Jewels</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Popular Restaurants in Ahmedabad
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-1 font-normal">
              Based on orders near Bodakdev, SG Highway &amp; Navrangpura
            </p>
          </div>

          {/* Sorting Control */}
          <div className="flex items-center gap-2.5 self-start md:self-auto bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-600 pl-2 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-orange-600" />
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white text-xs sm:text-sm font-bold text-slate-800 py-1.5 px-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500 cursor-pointer shadow-xs"
            >
              <option value="rating-desc">Rating (High to Low)</option>
              <option value="time-asc">Delivery Time</option>
              <option value="cost-asc">Cost: Low to High</option>
              <option value="cost-desc">Cost: High to Low</option>
            </select>
          </div>
        </div>

        {/* Responsive Restaurant Grid: 1 col mobile, 2 col tablet, 3 col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredAndSortedRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              isFavorite={Boolean(favorites[restaurant.id])}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>

        {filteredAndSortedRestaurants.length === 0 && (
          <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-base font-bold text-slate-700">No restaurants match your search.</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing your filters or search keywords.</p>
          </div>
        )}
      </div>
    </section>
  );
}
