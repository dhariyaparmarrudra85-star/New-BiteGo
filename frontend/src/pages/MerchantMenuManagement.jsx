import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import MerchantLayout from "../components/merchant/MerchantLayout";
import MenuStatsCards from "../components/merchant/MenuStatsCards";
import MenuFilters from "../components/merchant/MenuFilters";
import MenuTable from "../components/merchant/MenuTable";
import EditItemDrawer from "../components/merchant/EditItemDrawer";
import MenuToast from "../components/merchant/MenuToast";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../services/api";

export default function MerchantMenuManagement() {
  const location = useLocation();
  const { token } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchDish, setSearchDish] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState("all"); // "all" | "veg" | "non-veg"
  const [stockFilter, setStockFilter] = useState("all"); // "all" | "in" | "out" | "promo"
  const [sortBy, setSortBy] = useState("popular");
  const [toastMessage, setToastMessage] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(() =>
    location.search.includes("add=true")
  );
  const [editingItem, setEditingItem] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [, setLoading] = useState(true);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  const getActiveToken = useCallback(() => {
    return token || localStorage.getItem("bitego_token");
  }, [token]);

  // Fetch Menu from MongoDB
  const fetchMenu = useCallback(async () => {
    const activeToken = getActiveToken();
    if (!activeToken) return;

    try {
      setLoading(true);
      const [resMenu, resRest] = await Promise.all([
        fetch(`${API_BASE_URL}/merchant/menu`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        }),
        fetch(`${API_BASE_URL}/merchant/restaurant`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        }),
      ]);

      const dataMenu = await resMenu.json();
      const dataRest = await resRest.json();

      if (dataRest.success && dataRest.restaurant) {
        setRestaurant(dataRest.restaurant);
      }

      if (dataMenu.success && dataMenu.items) {
        const formatted = dataMenu.items.map((it) => ({
          id: it._id,
          code: `#${it._id.slice(-4).toUpperCase()}`,
          name: it.name,
          category: it.category,
          price: it.price,
          isVeg: it.isVeg,
          badge: it.isTrending ? "Trending" : !it.inStock ? "Out of Stock" : null,
          description: it.description || "",
          customizations:
            it.customizationGroups && it.customizationGroups.length > 0
              ? `${it.customizationGroups.length} groups`
              : "None",
          rating: it.rating?.toString() || "4.8",
          ratingCount: it.reviewsCount?.toString() || "120",
          ordersMetric: `${it.reviewsCount || 45} orders`,
          inStock: it.inStock,
          image: it.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80",
        }));
        setMenuItems(formatted);
      }
    } catch (err) {
      console.error("Fetch Menu Error:", err);
      showToast("Unable to fetch menu catalog from server");
    } finally {
      setLoading(false);
    }
  }, [getActiveToken]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  useEffect(() => {
    if (location.search.includes("add=true")) {
      const timer = setTimeout(() => {
        setEditingItem(null);
        setIsDrawerOpen(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location.search]);

  // Availability Toggle
  const handleToggleStatus = async (id) => {
    const activeToken = getActiveToken();
    const current = menuItems.find((i) => i.id === id);
    if (!current) return;

    const nextState = !current.inStock;

    // Optimistic UI update
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            inStock: nextState,
            badge: nextState ? null : "Out of Stock",
          };
        }
        return item;
      })
    );

    try {
      const res = await fetch(`${API_BASE_URL}/merchant/menu/${id}/availability`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ inStock: nextState, isAvailable: nextState }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          nextState
            ? `"${current.name}" marked as IN STOCK for customers`
            : `"${current.name}" temporarily removed from customer app`
        );
      } else {
        fetchMenu();
        showToast(data.message || "Failed to update item availability");
      }
    } catch {
      fetchMenu();
      showToast("Network error updating item status");
    }
  };

  // Bulk Quick Out-of-Stock
  const handleBulkToggle = async () => {
    showToast("Bulk updating item stocks...");
    const activeToken = getActiveToken();
    const toPause = menuItems.slice(0, 2);
    for (const item of toPause) {
      try {
        await fetch(`${API_BASE_URL}/merchant/menu/${item.id}/availability`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify({ inStock: false }),
        });
      } catch {
        // Continue
      }
    }
    fetchMenu();
    showToast("Quick bulk out-of-stock applied");
  };

  // Row Actions: Edit, Duplicate, Archive
  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsDrawerOpen(true);
    showToast(`Editing "${item.name}"`);
  };

  const handleDuplicateItem = async (item) => {
    const activeToken = getActiveToken();
    try {
      const res = await fetch(`${API_BASE_URL}/merchant/menu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          name: `${item.name} (Copy)`,
          category: item.category,
          price: item.price,
          isVeg: item.isVeg,
          description: item.description,
          image: item.image,
          inStock: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Duplicated "${item.name}" as new item`);
        fetchMenu();
      } else {
        showToast(data.message || "Failed to duplicate dish");
      }
    } catch {
      showToast("Network error duplicating dish");
    }
  };

  const handleArchiveItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}" from your menu?`)) {
      return;
    }

    const activeToken = getActiveToken();
    try {
      const res = await fetch(`${API_BASE_URL}/merchant/menu/${item.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Archived "${item.name}" from menu catalog`);
        setMenuItems((prev) => prev.filter((i) => i.id !== item.id));
      } else {
        showToast(data.message || "Failed to delete dish");
      }
    } catch {
      showToast("Network error deleting dish");
    }
  };

  // Save from Drawer (Add or Edit)
  const handleSaveDrawer = async (data) => {
    const activeToken = getActiveToken();

    try {
      if (editingItem) {
        const res = await fetch(`${API_BASE_URL}/merchant/menu/${editingItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify({
            name: data.name,
            category: data.category,
            price: Number(data.price),
            isVeg: Boolean(data.isVeg),
            description: data.description,
            image: data.image,
          }),
        });
        const resData = await res.json();
        if (res.ok && resData.success) {
          showToast(`Dish settings for "${data.name}" saved successfully`);
          fetchMenu();
        } else {
          showToast(resData.message || "Failed to save dish settings");
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/merchant/menu`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify({
            name: data.name,
            category: data.category,
            price: Number(data.price),
            isVeg: Boolean(data.isVeg),
            description: data.description,
            image: data.image,
            inStock: true,
          }),
        });
        const resData = await res.json();
        if (res.ok && resData.success) {
          showToast(`Added new item "${data.name}" to menu catalog`);
          fetchMenu();
        } else {
          showToast(resData.message || "Failed to create dish");
        }
      }
    } catch {
      showToast("Network error saving dish settings");
    }

    setEditingItem(null);
    setIsDrawerOpen(false);
  };

  // Toggle restaurant open/close
  const handleToggleStoreOpen = async () => {
    const activeToken = getActiveToken();
    try {
      const next = !restaurant?.isOpen;
      const res = await fetch(`${API_BASE_URL}/merchant/restaurant/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ isOpen: next }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRestaurant((prev) => (prev ? { ...prev, isOpen: next } : prev));
        showToast(
          next
            ? "Store is now LIVE and taking orders"
            : "Store is PAUSED. New customer orders suspended."
        );
      }
    } catch {
      showToast("Error toggling store status");
    }
  };

  // Filtered and Sorted items
  const filteredItems = useMemo(() => {
    let result = [...menuItems];

    // Category Tabs
    if (activeCategory !== "all") {
      result = result.filter((i) =>
        i.category.toLowerCase().includes(activeCategory.toLowerCase())
      );
    }

    // Search query
    if (searchDish.trim()) {
      const q = searchDish.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.code.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      );
    }

    // Dietary
    if (dietaryFilter === "veg") {
      result = result.filter((i) => i.isVeg);
    } else if (dietaryFilter === "non-veg") {
      result = result.filter((i) => !i.isVeg);
    }

    // Stock Filter
    if (stockFilter === "in") {
      result = result.filter((i) => i.inStock);
    } else if (stockFilter === "out") {
      result = result.filter((i) => !i.inStock);
    } else if (stockFilter === "promo") {
      result = result.filter((i) => i.badge !== null);
    }

    // Sorting
    if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name-asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [menuItems, activeCategory, searchDish, dietaryFilter, stockFilter, sortBy]);

  return (
    <MerchantLayout
      onAddItemClick={() => {
        setEditingItem(null);
        setIsDrawerOpen(true);
      }}
      searchQuery={searchDish}
      onSearchChange={setSearchDish}
      onShowToast={showToast}
      takingOrders={restaurant?.isOpen ?? true}
      onToggleTakingOrders={handleToggleStoreOpen}
    >
      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto font-sans">
        {/* 1. Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl font-black text-[#151c27] tracking-tight">
              Live Menu Catalog &amp; Dish Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {restaurant?.name || "The Dark Roast Pizzeria"} · Instant synchronization with BiteGo customer app
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsDrawerOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#b12408] hover:bg-[#921d06] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[#b12408]/20 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Add New Dish</span>
          </button>
        </div>

        {/* 2. Top Stats */}
        <MenuStatsCards items={menuItems} onBulkToggle={handleBulkToggle} />

        {/* 3. Filters & Categories */}
        <MenuFilters
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          searchDish={searchDish}
          onSearchChange={setSearchDish}
          dietaryFilter={dietaryFilter}
          onDietaryChange={setDietaryFilter}
          stockFilter={stockFilter}
          onStockChange={setStockFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalCount={menuItems.length}
          filteredCount={filteredItems.length}
        />

        {/* 4. Main Menu Table & Drawer Layout */}
        <div className="flex flex-col xl:flex-row items-start gap-6">
          <div className="w-full flex-1 min-w-0">
            <MenuTable
              items={filteredItems}
              onToggleStatus={handleToggleStatus}
              onEditItem={handleEditItem}
              onDuplicateItem={handleDuplicateItem}
              onArchiveItem={handleArchiveItem}
            />
          </div>

          <EditItemDrawer
            isOpen={isDrawerOpen}
            onClose={() => {
              setIsDrawerOpen(false);
              setEditingItem(null);
            }}
            editingItem={editingItem}
            onSave={handleSaveDrawer}
          />
        </div>
      </main>

      {/* Toast Notification */}
      <MenuToast message={toastMessage} onClose={() => setToastMessage("")} />
    </MerchantLayout>
  );
}
