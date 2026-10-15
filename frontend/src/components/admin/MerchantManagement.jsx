import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function MerchantManagement({ onActionToast }) {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== "all") params.isActive = statusFilter === "active";

      const res = await api.get("/admin/merchants", { params });
      if (res.data?.success) {
        setMerchants(res.data.merchants || []);
      }
    } catch (err) {
      console.error("Fetch merchants error:", err);
      if (onActionToast) onActionToast("Failed to fetch merchants list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMerchants();
  };

  const handleToggleStatus = async (merchant) => {
    const nextStatus = !merchant.isActive;
    setActionLoadingId(merchant._id);
    try {
      const res = await api.patch(`/admin/users/${merchant._id}/status`, {
        isActive: nextStatus,
      });
      if (res.data?.success) {
        if (onActionToast)
          onActionToast(
            `Merchant ${merchant.name} (${merchant.restaurant?.name || "Kitchen"}) has been ${
              nextStatus ? "activated" : "suspended"
            }.`
          );
        setMerchants((prev) =>
          prev.map((m) =>
            m._id === merchant._id
              ? {
                  ...m,
                  isActive: nextStatus,
                  restaurant: m.restaurant
                    ? { ...m.restaurant, isOpen: nextStatus ? m.restaurant.isOpen : false }
                    : null,
                }
              : m
          )
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update merchant status.";
      if (onActionToast) onActionToast(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high/40 p-space-lg flex flex-col gap-space-md">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
              Approved Kitchen Merchants &amp; Outlets
            </h2>
            <span className="inline-flex items-center gap-1 font-label-sm text-label-sm font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
              {merchants.length} Outlets
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mt-0.5">
            View registered merchant partners, attached kitchen brands, and manage operational active states
          </p>
        </div>

        {/* Search bar & links */}
        <div className="flex items-center gap-2 flex-wrap">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search merchant, restaurant..."
                className="pl-9 pr-3 py-1.5 rounded-xl bg-surface-container-low border border-surface-container-high/40 text-xs font-medium text-on-surface focus:outline-none focus:border-primary w-60"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Search
            </button>
          </form>

          <Link
            to="/admin/applications"
            className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Review Applications</span>
          </Link>

          <button
            type="button"
            onClick={fetchMerchants}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
          >
            <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>
              sync
            </span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {["all", "active", "suspended"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
              statusFilter === st
                ? "bg-on-surface text-surface shadow-xs"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto no-scrollbar rounded-xl bg-surface-container-lowest border border-surface-container-high/30">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 rounded-l-lg">Merchant Partner</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Restaurant Brand</th>
              <th className="py-3 px-4">Kitchen Hub</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right rounded-r-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high/60 font-body-sm text-body-sm text-on-surface">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-[28px] text-primary">
                    progress_activity
                  </span>
                  <p className="mt-2 text-xs">Loading approved merchants...</p>
                </td>
              </tr>
            ) : merchants.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-on-surface-variant">
                  <p className="text-sm font-semibold">No approved merchants found</p>
                </td>
              </tr>
            ) : (
              merchants.map((m) => (
                <tr key={m._id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs uppercase">
                        {m.name ? m.name[0] : "M"}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-on-surface">{m.name}</p>
                        <p className="text-[11px] text-secondary">
                          Registered {new Date(m.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-middle">
                    <p className="text-xs text-on-surface font-medium">{m.email}</p>
                    <p className="text-[11px] text-secondary">{m.phone || "No phone"}</p>
                  </td>
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-on-surface">
                        {m.restaurant?.name || "Kitchen Brand"}
                      </span>
                      <span className="text-[11px] text-secondary">
                        {m.restaurant?.cuisine?.join(", ") || "Multi-Cuisine"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-middle">
                    <span className="text-xs font-medium text-on-surface">
                      {m.restaurant?.hub || "Bodakdev Hub"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          m.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-error-container text-on-error-container"
                        }`}
                      >
                        {m.isActive ? "Active" : "Suspended"}
                      </span>
                      {m.restaurant && (
                        <span
                          className={`text-[10px] font-semibold ${
                            m.restaurant.isOpen ? "text-emerald-700" : "text-neutral-500"
                          }`}
                        >
                          ({m.restaurant.isOpen ? "Open" : "Closed"})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-middle text-right">
                    <button
                      onClick={() => handleToggleStatus(m)}
                      disabled={actionLoadingId === m._id}
                      className={`h-7 px-3 rounded-lg text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                        m.isActive
                          ? "bg-error-container hover:bg-error text-on-error-container hover:text-on-error"
                          : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                      }`}
                    >
                      {m.isActive ? "Suspend" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
