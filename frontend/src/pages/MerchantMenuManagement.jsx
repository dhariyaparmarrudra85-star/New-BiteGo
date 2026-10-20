import React, { useState, useEffect, useCallback } from "react";
import MerchantLayout from "../components/merchant/MerchantLayout";
import MenuToast from "../components/merchant/MenuToast";
import api from "../services/api";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  UtensilsCrossed,
  X,
  Image as ImageIcon,
} from "lucide-react";

export default function MerchantMenuManagement() {
  const [items, setItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [toastMessage, setToastMessage] = useState("");

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Data (Contains ONLY the requested fields)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Main Course",
    image: "",
    isVeg: true,
    inStock: true,
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchMenu = useCallback(async () => {
    try {
      const [resMenu, resRest] = await Promise.all([
        api.get("/merchant/menu"),
        api.get("/merchant/restaurant"),
      ]);

      if (resRest.data?.success && resRest.data.restaurant) {
        setRestaurant(resRest.data.restaurant);
      }

      if (resMenu.data?.success && resMenu.data.items) {
        setItems(resMenu.data.items);
      }
    } catch (err) {
      console.error("Fetch menu error:", err);
      showToast("Unable to fetch menu items.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "Main Course",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
      isVeg: true,
      inStock: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      description: item.description || "",
      price: item.price || "",
      category: item.category || "Main Course",
      image: item.image || "",
      isVeg: item.isVeg ?? true,
      inStock: item.inStock ?? true,
    });
    setIsModalOpen(true);
  };

  // Save Food Item (Add or Edit)
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      showToast("Please enter item name and price.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        category: formData.category,
        image: formData.image.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
        isVeg: Boolean(formData.isVeg),
        inStock: Boolean(formData.inStock),
        isAvailable: Boolean(formData.inStock),
      };

      if (editingItem) {
        const res = await api.put(`/merchant/menu/${editingItem._id}`, payload);
        if (res.data?.success) {
          showToast(`"${formData.name}" updated successfully.`);
          fetchMenu();
          setIsModalOpen(false);
        } else {
          showToast(res.data?.message || "Failed to update item.");
        }
      } else {
        const res = await api.post("/merchant/menu", payload);
        if (res.data?.success) {
          showToast(`"${formData.name}" added to menu.`);
          fetchMenu();
          setIsModalOpen(false);
        } else {
          showToast(res.data?.message || "Failed to add item.");
        }
      }
    } catch (err) {
      console.error("Save item error:", err);
      showToast(err.response?.data?.message || "Failed to save menu item.");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Availability
  const handleToggleAvailability = async (item) => {
    const nextState = !item.inStock;
    try {
      // Optimistic update
      setItems((prev) =>
        prev.map((it) => (it._id === item._id ? { ...it, inStock: nextState } : it))
      );

      const res = await api.patch(`/merchant/menu/${item._id}/availability`, {
        inStock: nextState,
        isAvailable: nextState,
      });

      if (res.data?.success) {
        showToast(
          nextState
            ? `"${item.name}" is now Available.`
            : `"${item.name}" marked Out of Stock.`
        );
      } else {
        fetchMenu();
        showToast(res.data?.message || "Failed to update status.");
      }
    } catch (err) {
      console.error("Toggle availability error:", err);
      fetchMenu();
      showToast("Network error updating item status.");
    }
  };

  // Delete Item
  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}" from your menu?`)) {
      return;
    }

    try {
      const res = await api.delete(`/merchant/menu/${item._id}`);
      if (res.data?.success) {
        showToast(`"${item.name}" removed from menu.`);
        setItems((prev) => prev.filter((it) => it._id !== item._id));
      } else {
        showToast(res.data?.message || "Failed to delete item.");
      }
    } catch (err) {
      console.error("Delete item error:", err);
      showToast("Failed to delete menu item.");
    }
  };

  // Toggle restaurant open/closed
  const handleToggleStoreStatus = async () => {
    try {
      const next = !restaurant?.isOpen;
      const res = await api.patch("/merchant/restaurant/status", { isOpen: next });
      if (res.data?.success) {
        setRestaurant((prev) => (prev ? { ...prev, isOpen: next } : prev));
        showToast(next ? "Store is now OPEN." : "Store is now CLOSED.");
      }
    } catch (err) {
      console.error("Toggle store error:", err);
      showToast("Failed to update store status.");
    }
  };

  // Extract unique categories
  const categories = ["all", ...new Set(items.map((it) => it.category).filter(Boolean))];

  // Filter items
  const filteredItems = items.filter((it) => {
    if (selectedCategory !== "all" && it.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        it.name.toLowerCase().includes(q) ||
        (it.description || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <MerchantLayout
      restaurant={restaurant}
      takingOrders={restaurant?.isOpen ?? true}
      onToggleTakingOrders={handleToggleStoreStatus}
      onShowToast={showToast}
    >
      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#151c27] tracking-tight">
              Menu Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage food items and pricing for {restaurant?.name || "your restaurant"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-[#b12408] hover:bg-[#921d06] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Food Item</span>
          </button>
        </div>

        {/* Filters: Category pills & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap capitalize ${
                  selectedCategory === cat
                    ? "bg-[#151c27] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat === "all" ? `All (${items.length})` : cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search food item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#b12408]"
            />
          </div>
        </div>

        {/* Food Items Grid */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#b12408]" />
            <p className="text-sm font-medium text-slate-600">Loading menu catalog...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
            <h3 className="text-base font-bold text-slate-700">No food items found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Add Food Item&quot; above to add your first dish to the menu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isAvailable = item.inStock ?? true;

              return (
                <div
                  key={item._id}
                  className={`bg-white rounded-xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:border-slate-300 ${
                    !isAvailable ? "opacity-75 bg-slate-50/50" : "border-slate-200"
                  }`}
                >
                  <div>
                    {/* Item Image */}
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={
                          item.image ||
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"
                        }
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80";
                        }}
                      />

                      {/* Veg / Non-Veg Indicator Badge */}
                      <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs p-1 rounded-md shadow-xs flex items-center gap-1.5 px-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.isVeg ? "bg-emerald-600" : "bg-rose-600"
                          }`}
                        />
                        <span
                          className={`text-[10px] font-bold ${
                            item.isVeg ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {item.isVeg ? "Veg" : "Non-Veg"}
                        </span>
                      </div>

                      {/* Availability status tag */}
                      <div className="absolute top-2.5 right-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                            isAvailable
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-800 text-slate-200"
                          }`}
                        >
                          {isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-[#151c27] leading-tight">
                            {item.name}
                          </h3>
                          <span className="text-[11px] text-slate-500 font-medium capitalize">
                            {item.category}
                          </span>
                        </div>
                        <span className="text-base font-black text-[#151c27] shrink-0">
                          ₹{Number(item.price).toFixed(2)}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    {/* Available / Unavailable Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={isAvailable}
                        onChange={() => handleToggleAvailability(item)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600 relative" />
                      <span className="text-[11px]">
                        {isAvailable ? "In Stock" : "Out of Stock"}
                      </span>
                    </label>

                    <div className="flex items-center gap-1.5">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="Edit Food Item"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Food Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Add / Edit Food Item (Contains ONLY the requested fields) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-bold text-[#151c27]">
                  {editingItem ? "Edit Food Item" : "Add Food Item"}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveItem} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* 1. Food Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Food Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Truffle Mushroom Pizza"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#b12408]"
                  />
                </div>

                {/* 2. Description */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Fresh ingredients, spices, and cooking details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#b12408]"
                  />
                </div>

                {/* 3. Price & Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      placeholder="e.g. 299"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#b12408]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#b12408] cursor-pointer"
                    >
                      <option value="Main Course">Main Course</option>
                      <option value="Neapolitan Pizzas">Neapolitan Pizzas</option>
                      <option value="Starters & Sides">Starters &amp; Sides</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Snacks">Snacks</option>
                    </select>
                  </div>
                </div>

                {/* 4. Food Image URL */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Food Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#b12408]"
                  />
                </div>

                {/* 5. Vegetarian / Non-Vegetarian Selection */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Dietary Indicator *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer font-bold transition-all ${
                        formData.isVeg
                          ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="isVegRadio"
                        checked={formData.isVeg}
                        onChange={() => setFormData({ ...formData, isVeg: true })}
                        className="sr-only"
                      />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                      <span>Vegetarian</span>
                    </label>

                    <label
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer font-bold transition-all ${
                        !formData.isVeg
                          ? "bg-rose-50 border-rose-400 text-rose-800"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="isVegRadio"
                        checked={!formData.isVeg}
                        onChange={() => setFormData({ ...formData, isVeg: false })}
                        className="sr-only"
                      />
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                      <span>Non-Vegetarian</span>
                    </label>
                  </div>
                </div>

                {/* 6. Available / Unavailable Toggle */}
                <div className="pt-2 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Availability Status
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Toggle whether customers can order this dish right now
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.inStock}
                      onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>

                {/* Submit Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-[#b12408] hover:bg-[#921d06] text-white font-bold cursor-pointer shadow-xs"
                  >
                    {isSaving ? "Saving..." : editingItem ? "Update Food Item" : "Add Food Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      <MenuToast message={toastMessage} onClose={() => setToastMessage("")} />
    </MerchantLayout>
  );
}
