import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import api from "../services/api";
import {
  Users,
  Store,
  Bike,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
} from "lucide-react";

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState("customer"); // "customer" | "merchant" | "delivery"
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "suspended"
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/users?role=${activeTab}`);
      if (res.data?.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error("Fetch users error:", err);
      showToast("Unable to load users from server.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Activate / Deactivate user
  const handleToggleUserStatus = async (userObj) => {
    const nextState = !userObj.isActive;
    const actionText = nextState ? "activate" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${actionText} ${userObj.name}?`)) {
      return;
    }

    try {
      setActionInProgress(userObj._id);
      const res = await api.patch(`/admin/users/${userObj._id}/status`, {
        isActive: nextState,
      });

      if (res.data?.success) {
        showToast(`User ${userObj.name} has been ${nextState ? "activated" : "deactivated"}.`);
        setUsers((prev) =>
          prev.map((u) => (u._id === userObj._id ? { ...u, isActive: nextState } : u))
        );
        if (selectedUser?._id === userObj._id) {
          setSelectedUser((prev) => (prev ? { ...prev, isActive: nextState } : prev));
        }
      } else {
        showToast(res.data?.message || "Failed to update user status.");
      }
    } catch (err) {
      console.error("Toggle user status error:", err);
      showToast(err.response?.data?.message || "Failed to update user status.");
    } finally {
      setActionInProgress(null);
    }
  };

  // Filter users by search & status
  const filteredUsers = users.filter((u) => {
    if (statusFilter === "active" && !u.isActive) return false;
    if (statusFilter === "suspended" && u.isActive) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const phone = (u.phone || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
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
              User Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage platform customers, merchants, and delivery agents
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-[#b12408] transition-colors"
            />
          </div>
        </div>

        {/* 3 Primary Tabs & Status Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("customer")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === "customer"
                  ? "bg-[#b12408] text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customers</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === "customer" ? "bg-white/20 text-white" : "bg-orange-100 text-[#b12408]"
                }`}
              >
                {activeTab === "customer" ? users.length : ""}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("merchant")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === "merchant"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Merchants</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === "merchant" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                }`}
              >
                {activeTab === "merchant" ? users.length : ""}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("delivery")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === "delivery"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>Delivery Agents</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === "delivery" ? "bg-white/20 text-white" : "bg-sky-100 text-sky-800"
                }`}
              >
                {activeTab === "delivery" ? users.length : ""}
              </span>
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-700 font-bold focus:outline-none focus:border-[#b12408] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Deactivated / Suspended</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <section className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#b12408]" />
              <p className="text-sm font-medium text-slate-600">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
              <h3 className="text-base font-bold text-slate-700">No users found</h3>
              <p className="text-xs text-slate-400 mt-1">
                No registered accounts match the selected tab and filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Registration Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredUsers.map((u) => {
                    const isWorking = actionInProgress === u._id;
                    const dateStr = u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A";

                    return (
                      <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-black text-[10px] flex items-center justify-center shrink-0">
                              {(u.name || "U").charAt(0).toUpperCase()}
                            </span>
                            <span>{u.name || "User"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3 px-4 text-slate-500">{u.phone || "Not provided"}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              u.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {u.isActive ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{dateStr}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Details */}
                            <button
                              type="button"
                              onClick={() => setSelectedUser(u)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px]"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>

                            {/* Activate / Deactivate */}
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u)}
                              disabled={isWorking}
                              className={`p-1.5 px-2.5 rounded-lg font-bold transition-colors cursor-pointer text-[11px] ${
                                u.isActive
                                  ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              }`}
                            >
                              {u.isActive ? "Deactivate" : "Activate"}
                            </button>
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
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#151c27]">User Account Details</h3>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-3.5 text-xs">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-[#b12408] text-white flex items-center justify-center font-black text-lg">
                    {(selectedUser.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{selectedUser.name}</h4>
                    <p className="text-slate-500">{selectedUser.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      Role: {selectedUser.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Phone</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{selectedUser.phone || "Not specified"}</p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Account Status</span>
                    <p className={`font-bold mt-0.5 ${selectedUser.isActive ? "text-emerald-700" : "text-rose-700"}`}>
                      {selectedUser.isActive ? "Active Account" : "Deactivated / Suspended"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Verification</span>
                    <p className="font-semibold text-slate-900 mt-0.5 capitalize">
                      {selectedUser.verificationStatus || "approved"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Registered On</span>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleUserStatus(selectedUser)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                    selectedUser.isActive
                      ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  {selectedUser.isActive ? "Deactivate User" : "Activate User"}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
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
