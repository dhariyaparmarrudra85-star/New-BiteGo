import React, { useState, useEffect, useCallback } from "react";
import MerchantLayout from "../components/merchant/MerchantLayout";
import MenuToast from "../components/merchant/MenuToast";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  Store,
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Power,
  Save,
  RefreshCw,
} from "lucide-react";

export default function MerchantProfile() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Editable fields
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    hub: "",
    cuisine: "",
    phone: "",
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/merchant/restaurant");
      if (res.data?.success && res.data.restaurant) {
        const rest = res.data.restaurant;
        setRestaurant(rest);
        setFormData({
          name: rest.name || "",
          address: rest.address || "",
          hub: rest.hub || "",
          cuisine: Array.isArray(rest.cuisine) ? rest.cuisine.join(", ") : rest.cuisine || "",
          phone: rest.phone || user?.phone || "",
        });
      }
    } catch (err) {
      console.error("Fetch merchant profile error:", err);
      showToast("Unable to load restaurant profile.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Toggle restaurant open/closed
  const handleToggleStoreStatus = async () => {
    try {
      const next = !restaurant?.isOpen;
      const res = await api.patch("/merchant/restaurant/status", { isOpen: next });
      if (res.data?.success) {
        setRestaurant((prev) => (prev ? { ...prev, isOpen: next } : prev));
        showToast(next ? "Store is now OPEN and taking orders." : "Store is now CLOSED.");
      }
    } catch (err) {
      console.error("Toggle store error:", err);
      showToast("Failed to update store status.");
    }
  };

  // Save profile updates
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const cuisinesArray = formData.cuisine
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        hub: formData.hub.trim(),
        cuisine: cuisinesArray,
      };

      const res = await api.put("/merchant/restaurant", payload);
      if (res.data?.success) {
        showToast("Restaurant profile saved successfully.");
        setRestaurant(res.data.restaurant);
      } else {
        showToast(res.data?.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      showToast(err.response?.data?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const isStoreOpen = restaurant?.isOpen ?? true;

  return (
    <MerchantLayout
      restaurant={restaurant}
      takingOrders={isStoreOpen}
      onToggleTakingOrders={handleToggleStoreStatus}
      onShowToast={showToast}
    >
      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl w-full mx-auto font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#151c27] tracking-tight">
              Restaurant Profile
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              View and manage your restaurant details and operational availability
            </p>
          </div>

          {/* Store Availability Toggle Card */}
          <div className="flex items-center gap-3 bg-white p-2.5 px-4 rounded-xl border border-slate-200 shadow-xs shrink-0">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isStoreOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
              />
              <span className="text-xs font-bold text-[#151c27]">
                {isStoreOpen ? "Store Open (Taking Orders)" : "Store Closed"}
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={isStoreOpen}
                onChange={handleToggleStoreStatus}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>
        </div>

        {/* Profile Card */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#b12408]" />
            <p className="text-sm font-medium text-slate-600">Loading restaurant details...</p>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Account & Owner Overview */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <h2 className="text-sm font-bold text-[#151c27] uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-[#b12408]" />
                <span>Owner &amp; Account Information</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-medium block">Owner Name</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {user?.name || "Merchant Owner"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block">Email Address</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {user?.email || "merchant@bitego.com"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block">Phone Number</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {formData.phone || user?.phone || "Not specified"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block">Account Role</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Merchant
                  </span>
                </div>
              </div>
            </div>

            {/* Restaurant Details Form */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <h2 className="text-sm font-bold text-[#151c27] uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <Store className="w-4 h-4 text-[#b12408]" />
                <span>Restaurant Information</span>
              </h2>

              <div className="space-y-4 text-xs">
                {/* Restaurant Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#b12408]"
                  />
                </div>

                {/* Restaurant Address */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Restaurant Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#b12408]"
                  />
                </div>

                {/* Hub & Cuisine */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Operating Hub
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bodakdev Hub"
                      value={formData.hub}
                      onChange={(e) => setFormData({ ...formData, hub: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#b12408]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Cuisines (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Italian, Pizza, Fast Food"
                      value={formData.cuisine}
                      onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#b12408]"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#b12408] hover:bg-[#921d06] text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save Restaurant Profile"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </main>

      {/* Toast Notification */}
      <MenuToast message={toastMessage} onClose={() => setToastMessage("")} />
    </MerchantLayout>
  );
}
