import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import api from "../services/api";
import {
  Bike,
  Search,
  Eye,
  RefreshCw,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Clock,
} from "lucide-react";

export default function AdminDeliveryAgents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "suspended"
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/delivery-partners");
      if (res.data?.success && res.data.partners) {
        setAgents(res.data.partners);
      }
    } catch (err) {
      console.error("Fetch agents error:", err);
      showToast("Unable to load delivery agents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Activate / Deactivate delivery agent
  const handleToggleAgentStatus = async (agent) => {
    const nextState = !agent.isActive;
    const actionText = nextState ? "activate" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${actionText} ${agent.name}?`)) {
      return;
    }

    try {
      setActionInProgress(agent._id);
      const res = await api.patch(`/admin/users/${agent._id}/status`, {
        isActive: nextState,
      });

      if (res.data?.success) {
        showToast(`Delivery agent ${agent.name} has been ${nextState ? "activated" : "deactivated"}.`);
        setAgents((prev) =>
          prev.map((a) => (a._id === agent._id ? { ...a, isActive: nextState } : a))
        );
        if (selectedAgent?._id === agent._id) {
          setSelectedAgent((prev) => (prev ? { ...prev, isActive: nextState } : prev));
        }
      } else {
        showToast(res.data?.message || "Failed to update status.");
      }
    } catch (err) {
      console.error("Toggle agent status error:", err);
      showToast(err.response?.data?.message || "Failed to update agent status.");
    } finally {
      setActionInProgress(null);
    }
  };

  // Filter agents by search & status
  const filteredAgents = agents.filter((a) => {
    if (statusFilter === "active" && !a.isActive) return false;
    if (statusFilter === "suspended" && a.isActive) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (a.name || "").toLowerCase();
      const email = (a.email || "").toLowerCase();
      const phone = (a.phone || "").toLowerCase();
      const vehicle = (a.vehicleType || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || vehicle.includes(q);
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
              Delivery Agent Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Registered courier partners and delivery assignment records
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by agent name, email, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-[#b12408] transition-colors"
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: `All Agents (${agents.length})` },
              { id: "active", label: `Active (${agents.filter((a) => a.isActive).length})` },
              { id: "suspended", label: `Deactivated (${agents.filter((a) => !a.isActive).length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-[#151c27] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Delivery Agents Table */}
        <section className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#b12408]" />
              <p className="text-sm font-medium text-slate-600">Loading delivery agents...</p>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Bike className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
              <h3 className="text-base font-bold text-slate-700">No delivery agents found</h3>
              <p className="text-xs text-slate-400 mt-1">
                No delivery partners match the selected filter.
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
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-center">Active Deliveries</th>
                    <th className="py-3 px-4 text-center">Completed Deliveries</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredAgents.map((agent) => {
                    const isWorking = actionInProgress === agent._id;

                    return (
                      <tr key={agent._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-black text-[10px] flex items-center justify-center shrink-0">
                              <Bike className="w-3.5 h-3.5" />
                            </span>
                            <span>{agent.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{agent.email}</td>
                        <td className="py-3 px-4 text-slate-500">{agent.phone || "Not specified"}</td>
                        <td className="py-3 px-4 text-slate-600">{agent.vehicleType || "Bike"}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              agent.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {agent.isActive ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-sky-700">
                          {agent.activeDeliveries || 0}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">
                          {agent.completedDeliveries || 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Details */}
                            <button
                              type="button"
                              onClick={() => setSelectedAgent(agent)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px]"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>

                            {/* Activate / Deactivate */}
                            <button
                              type="button"
                              onClick={() => handleToggleAgentStatus(agent)}
                              disabled={isWorking}
                              className={`p-1.5 px-2.5 rounded-lg font-bold transition-colors cursor-pointer text-[11px] ${
                                agent.isActive
                                  ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              }`}
                            >
                              {agent.isActive ? "Deactivate" : "Activate"}
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
        {selectedAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bike className="w-5 h-5 text-sky-600" />
                  <h3 className="text-base font-bold text-[#151c27]">{selectedAgent.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAgent(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto text-xs">
                {/* Stats summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 font-medium block">Active Orders</span>
                    <span className="text-lg font-black text-sky-700">
                      {selectedAgent.activeDeliveries || 0}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 font-medium block">Completed Deliveries</span>
                    <span className="text-lg font-black text-emerald-700">
                      {selectedAgent.completedDeliveries || 0}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2.5">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Email Address</span>
                    <span className="font-semibold text-slate-900">{selectedAgent.email}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Phone Number</span>
                    <span className="font-semibold text-slate-900">{selectedAgent.phone || "Not specified"}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Vehicle Type</span>
                    <span className="font-semibold text-slate-900">{selectedAgent.vehicleType || "Bike"}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Account Status</span>
                    <span className={`font-bold ${selectedAgent.isActive ? "text-emerald-700" : "text-rose-700"}`}>
                      {selectedAgent.isActive ? "Active Account" : "Deactivated"}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Registered On</span>
                    <span className="font-semibold text-slate-900">
                      {selectedAgent.createdAt ? new Date(selectedAgent.createdAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleAgentStatus(selectedAgent)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                    selectedAgent.isActive
                      ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  {selectedAgent.isActive ? "Deactivate Agent" : "Activate Agent"}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAgent(null)}
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
