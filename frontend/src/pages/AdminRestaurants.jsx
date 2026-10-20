import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import api from "../services/api";
import {
  Store,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  X,
  MapPin,
  UtensilsCrossed,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  Power,
} from "lucide-react";

// Safe helpers for defensively rendering data
const formatAddress = (addr) => {
  if (!addr) return "Bodakdev, Ahmedabad";
  if (typeof addr === "string") return addr;
  if (typeof addr === "object") {
    const parts = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Bodakdev, Ahmedabad";
  }
  return String(addr);
};

const formatCuisine = (c) => {
  if (!c) return "Various Cuisines";
  if (Array.isArray(c)) return c.join(", ");
  return String(c);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
};

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "pending" | "approved" | "suspended" | "rejected"
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError("");
      const res = await api.get("/admin/restaurants");
      if (res.data?.success) {
        setRestaurants(res.data.restaurants || []);
      } else {
        setFetchError(res.data?.message || "Failed to load restaurants.");
      }
    } catch (err) {
      console.error("Fetch restaurants error:", err);
      setFetchError("Unable to load restaurants from server. Please check your connection or login session.");
      showToast("Unable to load restaurants from server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // Approve restaurant / merchant
  const handleApprove = async (rest) => {
    const targetId = rest.applicationId || rest.merchantUserId || rest.restaurantId || rest._id;
    if (!targetId) {
      showToast("Missing restaurant identifier for approval.");
      return;
    }

    try {
      setActionInProgress(rest._id);
      const res = await api.patch(`/admin/merchants/${targetId}/approve`);
      if (res.data?.success) {
        showToast(`Approved "${rest.name}" successfully.`);
        fetchRestaurants();
        if (selectedRestaurant?._id === rest._id) {
          setSelectedRestaurant((prev) =>
            prev ? { ...prev, verificationStatus: "approved", isOpen: true, isSuspended: false } : prev
          );
        }
      } else {
        showToast(res.data?.message || "Failed to approve restaurant.");
      }
    } catch (err) {
      console.error("Approve error:", err);
      showToast(err.response?.data?.message || "Failed to approve restaurant.");
    } finally {
      setActionInProgress(null);
    }
  };

  // Reject restaurant / merchant
  const handleReject = async (rest) => {
    const targetId = rest.applicationId || rest.merchantUserId || rest.restaurantId || rest._id;
    if (!targetId) {
      showToast("Missing restaurant identifier for rejection.");
      return;
    }

    const reason =
      window.prompt("Reason for rejecting this restaurant application:", "Incomplete documentation or unverified address") ||
      "Declined by administrator";

    try {
      setActionInProgress(rest._id);
      const res = await api.patch(`/admin/merchants/${targetId}/reject`, {
        reason,
      });
      if (res.data?.success) {
        showToast(`Rejected "${rest.name}": ${reason}`);
        fetchRestaurants();
        if (selectedRestaurant?._id === rest._id) {
          setSelectedRestaurant((prev) =>
            prev ? { ...prev, verificationStatus: "rejected", isOpen: false } : prev
          );
        }
      } else {
        showToast(res.data?.message || "Failed to reject restaurant.");
      }
    } catch (err) {
      console.error("Reject error:", err);
      showToast(err.response?.data?.message || "Failed to reject restaurant.");
    } finally {
      setActionInProgress(null);
    }
  };

  // Activate or Deactivate Restaurant (Toggle Taking Orders)
  const handleToggleActive = async (rest) => {
    const nextOpen = !rest.isOpen;
    const actionText = nextOpen ? "activate" : "deactivate";

    try {
      setActionInProgress(rest._id);
      const targetId = rest.restaurantId || rest._id;
      const res = await api.patch(`/admin/restaurants/${targetId}/status`, {
        isOpen: nextOpen,
      });

      if (res.data?.success) {
        showToast(`"${rest.name}" is now ${nextOpen ? "Active (Taking Orders)" : "Inactive (Closed)"}.`);
        setRestaurants((prev) =>
          prev.map((r) => (r._id === rest._id ? { ...r, isOpen: nextOpen } : r))
        );
        if (selectedRestaurant?._id === rest._id) {
          setSelectedRestaurant((prev) =>
            prev ? { ...prev, isOpen: nextOpen } : prev
          );
        }
      } else {
        showToast(res.data?.message || `Failed to ${actionText} restaurant.`);
      }
    } catch (err) {
      console.error("Toggle active error:", err);
      showToast(err.response?.data?.message || `Failed to ${actionText} restaurant.`);
    } finally {
      setActionInProgress(null);
    }
  };

  // Suspend / Reactivate restaurant
  const handleToggleSuspend = async (rest) => {
    const nextSuspended = !rest.isSuspended;
    const actionText = nextSuspended ? "suspend" : "reactivate";

    if (!window.confirm(`Are you sure you want to ${actionText} "${rest.name}"?`)) {
      return;
    }

    try {
      setActionInProgress(rest._id);
      let res;
      if (rest.restaurantId) {
        res = await api.patch(`/admin/restaurants/${rest.restaurantId}/status`, {
          isSuspended: nextSuspended,
        });
      } else if (rest.merchantUserId) {
        res = await api.patch(`/admin/users/${rest.merchantUserId}/status`, {
          isActive: !nextSuspended,
        });
      }

      if (res?.data?.success) {
        showToast(`"${rest.name}" has been ${nextSuspended ? "suspended" : "reactivated"}.`);
        fetchRestaurants();
        if (selectedRestaurant?._id === rest._id) {
          setSelectedRestaurant((prev) =>
            prev ? { ...prev, isSuspended: nextSuspended, isOpen: nextSuspended ? false : prev.isOpen } : prev
          );
        }
      } else {
        showToast(res?.data?.message || "Failed to update restaurant status.");
      }
    } catch (err) {
      console.error("Toggle suspend error:", err);
      showToast(err.response?.data?.message || "Failed to update restaurant status.");
    } finally {
      setActionInProgress(null);
    }
  };

  // Filter restaurants by search & status
  const filteredRestaurants = restaurants.filter((r) => {
    if (statusFilter !== "all") {
      if (statusFilter === "suspended") {
        if (!r.isSuspended) return false;
      } else {
        if (r.verificationStatus !== statusFilter || r.isSuspended) return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (r.name || "").toLowerCase();
      const owner = (r.owner || "").toLowerCase();
      const ownerEmail = (r.ownerEmail || "").toLowerCase();
      const ownerPhone = (r.ownerPhone || "").toLowerCase();
      const address = formatAddress(r.address).toLowerCase();
      const cuisine = formatCuisine(r.cuisine).toLowerCase();
      return (
        name.includes(q) ||
        owner.includes(q) ||
        ownerEmail.includes(q) ||
        ownerPhone.includes(q) ||
        address.includes(q) ||
        cuisine.includes(q)
      );
    }
    return true;
  });

  return (
    <AdminLayout>
      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#151c27] tracking-tight">
              Restaurant Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Review restaurant applications, manage approvals, and control store status
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by restaurant, owner, cuisine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-[#b12408] transition-colors"
              />
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchRestaurants}
              disabled={loading}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer flex items-center justify-center shrink-0"
              title="Refresh restaurants"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#b12408]" : ""}`} />
            </button>
          </div>
        </div>

        {/* Error Alert (if fetch failed) */}
        {fetchError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{fetchError}</span>
            </div>
            <button
              type="button"
              onClick={fetchRestaurants}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: `All (${restaurants.length})` },
              {
                id: "pending",
                label: `Pending Approval (${restaurants.filter((r) => r.verificationStatus === "pending" && !r.isSuspended).length})`,
              },
              {
                id: "approved",
                label: `Approved (${restaurants.filter((r) => r.verificationStatus === "approved" && !r.isSuspended).length})`,
              },
              {
                id: "suspended",
                label: `Suspended (${restaurants.filter((r) => r.isSuspended).length})`,
              },
              {
                id: "rejected",
                label: `Rejected (${restaurants.filter((r) => r.verificationStatus === "rejected").length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-[#151c27] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Restaurants Table */}
        <section className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#b12408]" />
              <p className="text-sm font-medium text-slate-600">Loading restaurants...</p>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Store className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
              <h3 className="text-base font-bold text-slate-700">No restaurants registered yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                When restaurant merchants apply or are onboarded, they will appear here for verification and management.
              </p>
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Store className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
              <h3 className="text-base font-bold text-slate-700">No restaurants found</h3>
              <p className="text-xs text-slate-400 mt-1">
                No restaurant outlets match the selected status filter and search query.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
                className="mt-3 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Restaurant Name</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Approval Status</th>
                    <th className="py-3 px-4">Store Status</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredRestaurants.map((r) => {
                    const isWorking = actionInProgress === r._id;
                    const isPending = r.verificationStatus === "pending";
                    const isApproved = r.verificationStatus === "approved";
                    const isRejected = r.verificationStatus === "rejected";
                    const isSuspended = r.isSuspended;

                    return (
                      <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Restaurant Name & Cuisine */}
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#b12408] border border-orange-100 flex items-center justify-center shrink-0 overflow-hidden font-black text-xs">
                              {r.image ? (
                                <img
                                  src={r.image}
                                  alt={r.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <Store className="w-4 h-4" />
                              )}
                            </div>
                            <div className="truncate max-w-[170px]">
                              <div className="truncate font-bold text-slate-900">{r.name}</div>
                              <div className="text-[10px] text-slate-400 font-medium truncate">
                                {formatCuisine(r.cuisine)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Owner Name & Email */}
                        <td className="py-3 px-4 text-slate-800">
                          <div className="truncate max-w-[140px]">
                            <div className="font-semibold text-slate-800 truncate">
                              {r.owner || "Merchant Owner"}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {r.ownerEmail && r.ownerEmail !== "N/A" ? r.ownerEmail : ""}
                            </div>
                          </div>
                        </td>

                        {/* 3. Contact Details */}
                        <td className="py-3 px-4 text-slate-600">
                          <div className="text-xs font-medium text-slate-700">
                            {r.ownerPhone && r.ownerPhone !== "N/A"
                              ? r.ownerPhone
                              : r.ownerEmail && r.ownerEmail !== "N/A"
                              ? r.ownerEmail
                              : "Not provided"}
                          </div>
                        </td>

                        {/* 4. Approval Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isPending
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : isApproved
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-rose-100 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {isPending ? "Pending" : isApproved ? "Approved" : "Rejected"}
                          </span>
                        </td>

                        {/* 5. Active / Inactive / Suspended Status */}
                        <td className="py-3 px-4">
                          {isSuspended ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-white">
                              Suspended
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.isOpen
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {r.isOpen ? "Active" : "Inactive"}
                            </span>
                          )}
                        </td>

                        {/* 6. Registration Date */}
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {formatDate(r.createdAt)}
                        </td>

                        {/* 7. Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Details */}
                            <button
                              type="button"
                              onClick={() => setSelectedRestaurant(r)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px]"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>

                            {/* Pending Approvals: Approve and Reject */}
                            {isPending && !isSuspended && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(r)}
                                  disabled={isWorking}
                                  className="p-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer text-[11px] flex items-center gap-1 shadow-2xs"
                                  title="Approve Restaurant"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleReject(r)}
                                  disabled={isWorking}
                                  className="p-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                                  title="Reject Restaurant"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {/* Approved: Activate / Deactivate (Toggle Open/Closed Taking Orders) */}
                            {isApproved && !isSuspended && (
                              <button
                                type="button"
                                onClick={() => handleToggleActive(r)}
                                disabled={isWorking}
                                className={`p-1.5 px-2.5 rounded-lg font-bold transition-colors cursor-pointer text-[11px] ${
                                  r.isOpen
                                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                }`}
                                title={r.isOpen ? "Deactivate Restaurant" : "Activate Restaurant"}
                              >
                                {r.isOpen ? "Deactivate" : "Activate"}
                              </button>
                            )}

                            {/* Approved: Suspend / Reactivate button */}
                            {isApproved && (
                              <button
                                type="button"
                                onClick={() => handleToggleSuspend(r)}
                                disabled={isWorking}
                                className={`p-1.5 px-2.5 rounded-lg font-bold transition-colors cursor-pointer text-[11px] ${
                                  isSuspended
                                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                    : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                }`}
                                title={isSuspended ? "Reactivate Restaurant" : "Suspend Restaurant"}
                              >
                                {isSuspended ? "Reactivate" : "Suspend"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* View Details Modal */}
        {selectedRestaurant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#b12408] border border-orange-100 flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#151c27] leading-tight">
                      {selectedRestaurant.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {formatCuisine(selectedRestaurant.cuisine)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRestaurant(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 overflow-y-auto text-xs">
                {/* Status Bar */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Approval Status
                    </span>
                    <span
                      className={`font-black uppercase tracking-wider text-xs ${
                        selectedRestaurant.isSuspended
                          ? "text-slate-800"
                          : selectedRestaurant.verificationStatus === "approved"
                          ? "text-emerald-700"
                          : selectedRestaurant.verificationStatus === "pending"
                          ? "text-amber-700"
                          : "text-rose-700"
                      }`}
                    >
                      {selectedRestaurant.isSuspended
                        ? "Suspended"
                        : selectedRestaurant.verificationStatus === "approved"
                        ? "Approved ✓"
                        : selectedRestaurant.verificationStatus === "pending"
                        ? "Pending Approval"
                        : "Rejected"}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Store Availability
                    </span>
                    <span
                      className={`font-bold ${
                        selectedRestaurant.isOpen ? "text-emerald-700" : "text-slate-600"
                      }`}
                    >
                      {selectedRestaurant.isOpen ? "Active (Taking Orders)" : "Inactive (Closed)"}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Owner Name
                    </span>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {selectedRestaurant.owner || "Merchant Owner"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Registration Date
                    </span>
                    <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(selectedRestaurant.createdAt)}</span>
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Owner Phone
                    </span>
                    <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedRestaurant.ownerPhone || "Not provided"}</span>
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Owner Email
                    </span>
                    <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{selectedRestaurant.ownerEmail || "N/A"}</span>
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Cuisine Specialities
                    </span>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {formatCuisine(selectedRestaurant.cuisine)}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Operating Hub
                    </span>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {selectedRestaurant.hub || "Bodakdev Hub"}
                    </p>
                  </div>
                </div>

                {/* Full Address */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Full Address
                  </span>
                  <div className="font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#b12408] shrink-0 mt-0.5" />
                    <span>{formatAddress(selectedRestaurant.address)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedRestaurant.verificationStatus === "pending" && !selectedRestaurant.isSuspended && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(selectedRestaurant)}
                        disabled={actionInProgress === selectedRestaurant._id}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReject(selectedRestaurant)}
                        disabled={actionInProgress === selectedRestaurant._id}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {selectedRestaurant.verificationStatus === "approved" && (
                    <>
                      {!selectedRestaurant.isSuspended && (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(selectedRestaurant)}
                          disabled={actionInProgress === selectedRestaurant._id}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
                            selectedRestaurant.isOpen
                              ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          {selectedRestaurant.isOpen ? "Deactivate Store" : "Activate Store"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleSuspend(selectedRestaurant)}
                        disabled={actionInProgress === selectedRestaurant._id}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
                          selectedRestaurant.isSuspended
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                        }`}
                      >
                        {selectedRestaurant.isSuspended ? "Reactivate Restaurant" : "Suspend Restaurant"}
                      </button>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRestaurant(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#151c27] text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-bold animate-in fade-in">
            {toastMessage}
          </div>
        )}
      </main>
    </AdminLayout>
  );
}
