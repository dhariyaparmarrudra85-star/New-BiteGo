import React, { useState, useEffect } from "react";
import api from "../../services/api";

export default function CustomerManagement({ onActionToast }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== "all") params.isActive = statusFilter === "active";

      const res = await api.get("/admin/customers", { params });
      if (res.data?.success) {
        setCustomers(res.data.customers || []);
      }
    } catch (err) {
      console.error("Fetch customers error:", err);
      if (onActionToast) onActionToast("Failed to fetch customers list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleToggleStatus = async (customer) => {
    const nextStatus = !customer.isActive;
    setActionLoadingId(customer._id);
    try {
      const res = await api.patch(`/admin/users/${customer._id}/status`, {
        isActive: nextStatus,
      });
      if (res.data?.success) {
        if (onActionToast)
          onActionToast(
            `Customer ${customer.name} has been ${nextStatus ? "activated" : "suspended"}.`
          );
        setCustomers((prev) =>
          prev.map((c) => (c._id === customer._id ? { ...c, isActive: nextStatus } : c))
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update customer status.";
      if (onActionToast) onActionToast(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setModalLoading(true);
    try {
      const res = await api.get(`/admin/customers/${customer._id}`);
      if (res.data?.success) {
        setCustomerOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error("Fetch customer details error:", err);
      setCustomerOrders([]);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high/40 p-space-lg flex flex-col gap-space-md">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
              Customer Management &amp; Accounts Directory
            </h2>
            <span className="inline-flex items-center gap-1 font-label-sm text-label-sm font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
              {customers.length} Patrons
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mt-0.5">
            Search consumer accounts, inspect order histories, suspend or reinstate account access
          </p>
        </div>

        {/* Search bar & filter */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, phone..."
              className="pl-9 pr-3 py-1.5 rounded-xl bg-surface-container-low border border-surface-container-high/40 text-xs font-medium text-on-surface focus:outline-none focus:border-primary w-64"
            />
          </div>

          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Search
          </button>

          <button
            type="button"
            onClick={fetchCustomers}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
          >
            <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>
              sync
            </span>
            <span>Refresh</span>
          </button>
        </form>
      </div>

      {/* Filter capsules */}
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

      {/* Customers Data Table */}
      <div className="overflow-x-auto no-scrollbar rounded-xl bg-surface-container-lowest border border-surface-container-high/30">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 rounded-l-lg">Customer</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Total Orders</th>
              <th className="py-3 px-4">Lifetime Spend</th>
              <th className="py-3 px-4">Account Status</th>
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
                  <p className="mt-2 text-xs">Loading customer directory...</p>
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-on-surface-variant">
                  <p className="text-sm font-semibold">No customers found</p>
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c._id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                        {c.name ? c.name[0] : "C"}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-on-surface">{c.name}</p>
                        <p className="text-[11px] text-secondary">
                          Joined {new Date(c.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-middle">
                    <p className="text-xs text-on-surface font-medium">{c.email}</p>
                    <p className="text-[11px] text-secondary">{c.phone || "No phone registered"}</p>
                  </td>
                  <td className="py-3.5 px-4 align-middle">
                    <span className="font-bold text-xs text-on-surface">{c.totalOrders || 0}</span>
                  </td>
                  <td className="py-3.5 px-4 align-middle">
                    <span className="font-bold text-xs text-on-surface">
                      ₹{Number(c.totalSpent || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 align-middle">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        c.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-error-container text-on-error-container"
                      }`}
                    >
                      {c.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 align-middle text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleViewCustomer(c)}
                        className="h-7 px-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => handleToggleStatus(c)}
                        disabled={actionLoadingId === c._id}
                        className={`h-7 px-2.5 rounded-lg text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                          c.isActive
                            ? "bg-error-container hover:bg-error text-on-error-container hover:text-on-error"
                            : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                        }`}
                      >
                        {c.isActive ? "Suspend" : "Reactivate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Customer Profile & Orders History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-surface-container-high flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {selectedCustomer.name ? selectedCustomer.name[0] : "C"}
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-xs text-secondary">
                    {selectedCustomer.email} • {selectedCustomer.phone || "No phone"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-surface-container-low rounded-xl">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant">
                  Lifetime Orders
                </span>
                <p className="font-bold text-base text-on-surface mt-0.5">
                  {selectedCustomer.totalOrders || 0}
                </p>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant">
                  Total Spent
                </span>
                <p className="font-bold text-base text-primary mt-0.5">
                  ₹{Number(selectedCustomer.totalSpent || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant">
                  Account Status
                </span>
                <p
                  className={`font-bold text-xs uppercase mt-1 ${
                    selectedCustomer.isActive ? "text-emerald-700" : "text-error"
                  }`}
                >
                  {selectedCustomer.isActive ? "Active / Normal" : "Suspended"}
                </p>
              </div>
            </div>

            {/* Orders History */}
            <div>
              <h4 className="font-label-md text-label-md font-bold text-on-surface mb-2">
                Recent Orders Placed
              </h4>
              {modalLoading ? (
                <div className="py-6 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-[24px] text-primary">
                    progress_activity
                  </span>
                  <p className="text-xs mt-1">Loading customer order history...</p>
                </div>
              ) : customerOrders.length === 0 ? (
                <p className="text-xs text-secondary italic py-4">
                  No orders recorded for this customer account yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {customerOrders.map((ord) => (
                    <div
                      key={ord._id}
                      className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-primary">
                          #{ord.orderNumber || ord._id.slice(-6)}
                        </span>
                        <p className="text-on-surface font-semibold mt-0.5">
                          {ord.restaurant?.name || "Restaurant Outlet"}
                        </p>
                        <span className="text-[10px] text-secondary">
                          {new Date(ord.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-on-surface">
                          ₹{Number(ord.totalAmount).toFixed(2)}
                        </span>
                        <p
                          className={`text-[10px] font-bold uppercase ${
                            ord.orderStatus === "DELIVERED"
                              ? "text-emerald-700"
                              : ord.orderStatus === "CANCELLED"
                              ? "text-error"
                              : "text-amber-700"
                          }`}
                        >
                          {ord.orderStatus}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-surface-container-high/40 flex items-center justify-between">
              <button
                onClick={() => {
                  handleToggleStatus(selectedCustomer);
                  setSelectedCustomer(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer ${
                  selectedCustomer.isActive
                    ? "bg-error-container text-on-error-container hover:bg-error hover:text-on-error"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {selectedCustomer.isActive ? "Suspend Customer Account" : "Reactivate Customer Account"}
              </button>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
