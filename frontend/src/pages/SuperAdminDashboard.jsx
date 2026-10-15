import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api, { API_BASE_URL } from "../services/api";

export default function SuperAdminDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview"); 
  // 'overview' | 'admins' | 'users' | 'merchants' | 'delivery' | 'orders' | 'settings' | 'audit'

  const [stats, setStats] = useState(null);
  const [platformActivity, setPlatformActivity] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [merchantsList, setMerchantsList] = useState([]);
  const [deliveryList, setDeliveryList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [settings, setSettings] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & searches
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [merchantSearchQuery, setMerchantSearchQuery] = useState("");
  const [deliverySearchQuery, setDeliverySearchQuery] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [auditSearchQuery, setAuditSearchQuery] = useState("");

  // Modals
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editAdminData, setEditAdminData] = useState({
    name: "",
    phone: "",
    password: "",
    isActive: true,
  });

  const [selectedUserDetail, setSelectedUserDetail] = useState(null);

  // Rejection modal
  const [rejectItem, setRejectItem] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Settings form state
  const [settingsFormData, setSettingsFormData] = useState({
    deliveryFee: 35.0,
    taxRate: 5.0,
    platformCommission: 18.0,
    serviceAvailability: true,
    minOrderAmount: 99.0,
    freeDeliveryThreshold: 499.0,
    surgeMultiplier: 1.0,
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch overview & core data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        resOverview,
        resAdmins,
        resUsers,
        resMerchants,
        resDelivery,
        resOrders,
        resSettings,
        resAudit,
      ] = await Promise.all([
        api.get("/superadmin/overview"),
        api.get("/superadmin/admins"),
        api.get("/superadmin/users"),
        api.get("/superadmin/merchants"),
        api.get("/superadmin/delivery-partners"),
        api.get("/superadmin/orders"),
        api.get("/superadmin/settings"),
        api.get("/superadmin/audit-logs"),
      ]);

      if (resOverview.data?.success) {
        setStats(resOverview.data.stats);
        setPlatformActivity(resOverview.data.platformActivity || []);
      }
      if (resAdmins.data?.success) setAdminsList(resAdmins.data.admins || []);
      if (resUsers.data?.success) setUsersList(resUsers.data.users || []);
      if (resMerchants.data?.success) setMerchantsList(resMerchants.data.merchants || []);
      if (resDelivery.data?.success) setDeliveryList(resDelivery.data.partners || []);
      if (resOrders.data?.success) setOrdersList(resOrders.data.orders || []);
      if (resSettings.data?.success) {
        setSettings(resSettings.data.settings);
        setSettingsFormData({
          deliveryFee: resSettings.data.settings.deliveryFee || 35.0,
          taxRate: resSettings.data.settings.taxRate || 5.0,
          platformCommission: resSettings.data.settings.platformCommission || 18.0,
          serviceAvailability: resSettings.data.settings.serviceAvailability ?? true,
          minOrderAmount: resSettings.data.settings.minOrderAmount || 99.0,
          freeDeliveryThreshold: resSettings.data.settings.freeDeliveryThreshold || 499.0,
          surgeMultiplier: resSettings.data.settings.surgeMultiplier || 1.0,
        });
      }
      if (resAudit.data?.success) setAuditLogs(resAudit.data.logs || []);
    } catch (err) {
      console.error("Super Admin data fetch error:", err);
      showToast("Error loading Super Admin telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  // 1. Admin Management Handlers
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/superadmin/admins", newAdminData);
      if (res.data?.success) {
        showToast(`Admin account for ${newAdminData.name} created!`);
        setIsCreateAdminOpen(false);
        setNewAdminData({ name: "", email: "", password: "", phone: "" });
        fetchAllData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create Admin.");
    }
  };

  const handleEditAdminOpen = (admin) => {
    setEditingAdmin(admin);
    setEditAdminData({
      name: admin.name || "",
      phone: admin.phone || "",
      password: "",
      isActive: admin.isActive ?? true,
    });
  };

  const handleEditAdminSubmit = async (e) => {
    e.preventDefault();
    if (!editingAdmin) return;
    try {
      const payload = {
        name: editAdminData.name,
        phone: editAdminData.phone,
        isActive: editAdminData.isActive,
      };
      if (editAdminData.password.trim()) payload.password = editAdminData.password.trim();

      const res = await api.patch(`/superadmin/admins/${editingAdmin._id}`, payload);
      if (res.data?.success) {
        showToast(`Admin ${editAdminData.name} updated successfully!`);
        setEditingAdmin(null);
        fetchAllData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update Admin.");
    }
  };

  const handleToggleAdminStatus = async (adminId, currentActive) => {
    try {
      const res = await api.patch(`/superadmin/admins/${adminId}/status`, {
        isActive: !currentActive,
      });
      if (res.data?.success) {
        showToast(res.data.message || "Admin status updated.");
        fetchAllData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Error updating Admin status.");
    }
  };

  const handleDeleteAdmin = async (adminId, adminName) => {
    if (!window.confirm(`Are you sure you want to permanently delete Admin "${adminName}"?`)) {
      return;
    }
    try {
      const res = await api.delete(`/superadmin/admins/${adminId}`);
      if (res.data?.success) {
        showToast(`Admin ${adminName} deleted.`);
        fetchAllData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete Admin.");
    }
  };

  // 2. User Management Handlers (Suspend / Reactivate)
  const handleToggleUserStatus = async (userId, currentActive) => {
    try {
      const res = await api.patch(`/superadmin/users/${userId}/status`, {
        isActive: !currentActive,
      });
      if (res.data?.success) {
        showToast(res.data.message);
        fetchAllData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Error updating user status.");
    }
  };

  // 3. Merchant Approvals & Rejections
  const handleApproveMerchant = async (appId, restaurantName) => {
    try {
      const res = await api.patch(`/superadmin/merchants/${appId}/approve`);
      if (res.data?.success) {
        showToast(`Approved merchant application for ${restaurantName}!`);
        fetchAllData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve merchant.");
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      showToast("Please provide a rejection reason.");
      return;
    }
    try {
      const endpoint =
        rejectItem.type === "merchant"
          ? `/superadmin/merchants/${rejectItem.id}/reject`
          : `/superadmin/delivery/${rejectItem.id}/reject`;

      const res = await api.patch(endpoint, { reason: rejectReason });
      if (res.data?.success) {
        showToast(`Application rejected with recorded compliance reason.`);
        setRejectItem(null);
        setRejectReason("");
        fetchAllData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject application.");
    }
  };

  // 4. Delivery Partner Approvals
  const handleApproveDelivery = async (appId, partnerName) => {
    try {
      const res = await api.patch(`/superadmin/delivery/${appId}/approve`);
      if (res.data?.success) {
        showToast(`Approved courier application for ${partnerName}!`);
        fetchAllData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve courier.");
    }
  };

  // 5. Platform Settings Save
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const res = await api.put("/superadmin/settings", settingsFormData);
      if (res.data?.success) {
        setSettings(res.data.settings);
        showToast("Platform settings updated and persisted in MongoDB!");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Error updating settings.");
    } finally {
      setSettingsSaving(false);
    }
  };

  // Filtered lists
  const filteredUsers = usersList.filter((u) => {
    if (userRoleFilter !== "all" && u.role !== userRoleFilter) return false;
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase();
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredMerchants = merchantsList.filter((m) => {
    if (!merchantSearchQuery.trim()) return true;
    const q = merchantSearchQuery.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.restaurant?.name?.toLowerCase().includes(q)
    );
  });

  const filteredDelivery = deliveryList.filter((d) => {
    if (!deliverySearchQuery.trim()) return true;
    const q = deliverySearchQuery.toLowerCase();
    return (
      d.name?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q) ||
      d.vehicleNumber?.toLowerCase().includes(q)
    );
  });

  const filteredOrders = ordersList.filter((o) => {
    if (!orderSearchQuery.trim()) return true;
    const q = orderSearchQuery.toLowerCase();
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.restaurant?.name?.toLowerCase().includes(q)
    );
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditSearchQuery.trim()) return true;
    const q = auditSearchQuery.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.performedByName?.toLowerCase().includes(q) ||
      log.target?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased selection:bg-primary selection:text-on-primary">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-lg border border-surface-container-high/40 animate-fade-in transition-all">
          <span className="material-symbols-outlined text-[20px] text-primary-fixed">
            verified
          </span>
          <span className="font-label-md text-label-md font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-inverse-on-surface/70 hover:text-inverse-on-surface ml-2 p-0.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-xl border-b border-surface-container-high/50 z-40 px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-on-primary font-bold flex items-center justify-center text-sm shadow-xs">
              B
            </div>
            <span className="font-bold text-lg tracking-tight text-on-surface">
              Bite<span className="text-primary">Go</span>
            </span>
          </Link>
          <span className="h-4 w-px bg-surface-container-high" />
          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 text-[11px] font-bold uppercase tracking-wider">
            👑 Super Admin Root Console
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">dashboard</span>
            <span>Admin Operations</span>
          </Link>

          <div className="flex items-center gap-2 pl-2 border-l border-surface-container-high">
            <div className="w-8 h-8 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-xs">
              {user?.name?.slice(0, 2).toUpperCase() || "SA"}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold leading-tight">{user?.name || "Super Admin"}</span>
              <span className="text-[10px] text-purple-700 uppercase font-black">ROOT PRIVILEGE</span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="ml-2 p-1.5 rounded-lg text-secondary hover:text-error hover:bg-error-container/20 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto pt-24 pb-16 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900/10 via-surface-container-low to-surface-container-lowest border border-purple-500/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
              Platform Super Authority • Zero-Trust Security Gate
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              BiteGo Super Admin Master Console
            </h1>
            <p className="text-sm text-secondary mt-1 max-w-2xl">
              Create and supervise operational administrators, manage platform-wide users, oversee real MongoDB orders &amp; revenue, adjust business settings, and inspect audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsCreateAdminOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Create Admin</span>
            </button>
            <button
              onClick={fetchAllData}
              className="p-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors cursor-pointer shadow-xs"
              title="Refresh Telemetry"
            >
              <span className={`material-symbols-outlined text-[20px] ${loading ? "animate-spin text-purple-700" : ""}`}>
                sync
              </span>
            </button>
          </div>
        </div>

        {/* Real MongoDB Dashboard Statistics Ribbon */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high/60 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-secondary block">Customers</span>
            <div className="text-2xl font-black text-on-surface mt-1">
              {stats?.totalCustomers ?? 0}
            </div>
            <span className="text-[10px] text-blue-700 font-bold">Registered Patrons</span>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high/60 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-secondary block">Merchants</span>
            <div className="text-2xl font-black text-on-surface mt-1">
              {stats?.totalMerchants ?? 0}
            </div>
            <span className="text-[10px] text-amber-700 font-bold">
              {stats?.pendingMerchantApps ?? 0} Pending Apps
            </span>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high/60 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-secondary block">Delivery Fleet</span>
            <div className="text-2xl font-black text-on-surface mt-1">
              {stats?.totalDelivery ?? 0}
            </div>
            <span className="text-[10px] text-purple-700 font-bold">
              {stats?.pendingDeliveryApps ?? 0} Pending Apps
            </span>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high/60 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-secondary block">Admins</span>
            <div className="text-2xl font-black text-purple-700 mt-1">
              {stats?.totalAdmins ?? 0}
            </div>
            <span className="text-[10px] text-secondary font-bold">Appointed by Root</span>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high/60 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-secondary block">Orders &amp; Revenue</span>
            <div className="text-2xl font-black text-on-surface mt-1">
              ₹{Number(stats?.totalRevenue ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-700 font-bold">
              {stats?.completedOrders ?? 0} / {stats?.totalOrders ?? 0} Delivered
            </span>
          </div>
        </section>

        {/* Tab Navigation Bar */}
        <div className="flex border-b border-surface-container-high/80 gap-2 sm:gap-6 text-xs sm:text-sm font-bold overflow-x-auto no-scrollbar pb-1">
          {[
            { id: "overview", label: "Overview & Activity" },
            { id: "admins", label: `Admins (${adminsList.length})` },
            { id: "users", label: `Users (${usersList.length})` },
            { id: "merchants", label: `Merchants (${merchantsList.length})` },
            { id: "delivery", label: `Delivery Fleet (${deliveryList.length})` },
            { id: "orders", label: `Orders (${ordersList.length})` },
            { id: "settings", label: "Platform Settings" },
            { id: "audit", label: `Audit Logs (${auditLogs.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-2 transition-all whitespace-nowrap cursor-pointer border-b-2 ${
                activeTab === tab.id
                  ? "border-purple-700 text-purple-700 font-black"
                  : "border-transparent text-secondary hover:text-on-surface"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & REAL ACTIVITY */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-3xl border border-surface-container-high/60 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-700 text-[20px]">security</span>
                Role-Based Architecture &amp; Governance
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                BiteGo enforces absolute zero-trust role segregation. Super Admin is the sole authority permitted to create operational Admins, update global system settings, and inspect security telemetry.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                  <span className="text-[11px] font-bold text-purple-900 uppercase">Tier 1 • Super Admin</span>
                  <p className="text-xs text-purple-800 mt-1">
                    Direct root privilege, admin provisioning, dynamic commission &amp; tax settings, full audit log inspection.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high/60">
                  <span className="text-[11px] font-bold text-on-surface uppercase">Tier 2 • Operational Admin</span>
                  <p className="text-xs text-secondary mt-1">
                    Merchant onboarding verification, delivery fleet approvals, order dispatch monitoring.
                  </p>
                </div>
              </div>

              {/* Real Platform Activity Feed */}
              <div className="pt-4 border-t border-surface-container-high">
                <h4 className="font-bold text-xs uppercase tracking-wider text-secondary mb-3">
                  Live Platform Activity Feed
                </h4>
                {platformActivity.length === 0 ? (
                  <p className="text-xs text-secondary italic">No recent activity recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {platformActivity.slice(0, 6).map((item) => (
                      <div
                        key={item._id}
                        className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-purple-700 text-[18px]">
                            history_toggle_off
                          </span>
                          <div>
                            <span className="font-bold text-on-surface">{item.action}</span>
                            <span className="text-secondary ml-1.5">Target: {item.target || item.targetUserName}</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-secondary font-mono">
                          {new Date(item.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Metrics & System Health */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-container-high/60 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-bold text-base text-on-surface flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-emerald-700 text-[20px]">dns</span>
                  Platform Invariants &amp; Health
                </h3>
                <div className="space-y-3 pt-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
                    <span className="text-secondary">MongoDB Atlas</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Connected
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
                    <span className="text-secondary">Completed Orders</span>
                    <span className="font-bold text-on-surface">{stats?.completedOrders ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
                    <span className="text-secondary">Cancelled Orders</span>
                    <span className="font-bold text-error">{stats?.cancelledOrders ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
                    <span className="text-secondary">Platform Take Rate</span>
                    <span className="font-bold text-purple-700">{settings?.platformCommission || 18}% Net</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-container-high space-y-2">
                <button
                  onClick={() => setActiveTab("settings")}
                  className="w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>Adjust Platform Settings</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADMIN MANAGEMENT */}
        {activeTab === "admins" && (
          <div className="bg-surface-container-lowest rounded-3xl border border-surface-container-high/60 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-on-surface">Platform Operational Administrators</h3>
                <p className="text-xs text-secondary mt-0.5">
                  Only Super Admin can create, edit, disable, or delete operational Admins.
                </p>
              </div>
              <button
                onClick={() => setIsCreateAdminOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>+ Create Admin Account</span>
              </button>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                <thead>
                  <tr className="bg-surface-container-low text-secondary text-[11px] uppercase font-bold tracking-wider h-11 border-b border-surface-container-high">
                    <th className="py-2 px-6">Admin Name</th>
                    <th className="py-2 px-6">Email &amp; Phone</th>
                    <th className="py-2 px-6">Status</th>
                    <th className="py-2 px-6">Created Date</th>
                    <th className="py-2 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/60">
                  {adminsList.map((admin) => (
                    <tr key={admin._id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-on-surface flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-xs">
                            {admin.name ? admin.name[0] : "A"}
                          </span>
                          <span>{admin.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="font-mono text-on-surface">{admin.email}</div>
                        <div className="text-secondary text-[11px]">{admin.phone || "No phone listed"}</div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            admin.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-error-container text-on-error-container"
                          }`}
                        >
                          {admin.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-secondary">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditAdminOpen(admin)}
                            className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest font-bold text-on-surface transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleAdminStatus(admin._id, admin.isActive)}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                              admin.isActive
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            }`}
                          >
                            {admin.isActive ? "Disable" : "Reactivate"}
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                            className="p-1 rounded-lg text-secondary hover:text-error hover:bg-error-container/20 transition-colors cursor-pointer"
                            title="Delete Admin"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: USER MANAGEMENT */}
        {activeTab === "users" && (
          <div className="bg-surface-container-lowest rounded-3xl border border-surface-container-high/60 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-surface-container-high flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                {["all", "customer", "merchant", "delivery", "admin"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      userRoleFilter === r
                        ? "bg-purple-700 text-white shadow-xs"
                        : "bg-surface-container-low text-secondary hover:text-on-surface"
                    }`}
                  >
                    {r === "all" ? "All Users" : r}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search name, email, phone..."
                  className="w-full pl-9 pr-4 py-2 bg-surface-container-low rounded-xl text-xs text-on-surface border border-surface-container-high focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px] text-xs">
                <thead>
                  <tr className="bg-surface-container-low text-secondary text-[11px] uppercase font-bold tracking-wider h-11 border-b border-surface-container-high">
                    <th className="py-2 px-6">User</th>
                    <th className="py-2 px-6">Contact</th>
                    <th className="py-2 px-6">Role Tier</th>
                    <th className="py-2 px-6">Status</th>
                    <th className="py-2 px-6 text-right">Super Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/60">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3 px-6">
                        <div className="font-bold text-on-surface">{u.name}</div>
                        <div className="text-[11px] text-secondary">
                          Joined {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <div className="font-mono text-on-surface">{u.email}</div>
                        <div className="text-secondary text-[11px]">{u.phone || "No phone"}</div>
                      </td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-high font-bold text-[10px] uppercase">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            u.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-error-container text-on-error-container"
                          }`}
                        >
                          {u.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        {u.role !== "superadmin" && (
                          <button
                            onClick={() => handleToggleUserStatus(u._id, u.isActive)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                              u.isActive
                                ? "bg-error-container text-on-error-container hover:bg-error hover:text-on-error"
                                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            }`}
                          >
                            {u.isActive ? "Suspend" : "Reactivate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: MERCHANT MANAGEMENT */}
        {activeTab === "merchants" && (
          <div className="bg-surface-container-lowest rounded-3xl border border-surface-container-high/60 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-surface-container-high flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-on-surface">Merchant Kitchens Platform Pool</h3>
                <p className="text-xs text-secondary mt-0.5">
                  Super Admin direct review, approval, rejection, and suspension controls.
                </p>
              </div>
              <div className="relative w-full md:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={merchantSearchQuery}
                  onChange={(e) => setMerchantSearchQuery(e.target.value)}
                  placeholder="Search merchant or outlet..."
                  className="w-full pl-9 pr-4 py-2 bg-surface-container-low rounded-xl text-xs text-on-surface border border-surface-container-high focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[850px] text-xs">
                <thead>
                  <tr className="bg-surface-container-low text-secondary text-[11px] uppercase font-bold tracking-wider h-11 border-b border-surface-container-high">
                    <th className="py-2 px-6">Merchant Partner</th>
                    <th className="py-2 px-6">Restaurant Brand</th>
                    <th className="py-2 px-6">Verification</th>
                    <th className="py-2 px-6">Account Status</th>
                    <th className="py-2 px-6 text-right">Super Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/60">
                  {filteredMerchants.map((m) => (
                    <tr key={m._id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3 px-6">
                        <div className="font-bold text-on-surface">{m.name}</div>
                        <div className="text-[11px] text-secondary">{m.email}</div>
                      </td>
                      <td className="py-3 px-6">
                        <div className="font-bold text-on-surface">
                          {m.restaurant?.name || m.application?.restaurantName || "Outlet Brand"}
                        </div>
                        <div className="text-[11px] text-secondary">
                          {m.restaurant?.hub || "Bodakdev Hub"}
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            m.verificationStatus === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : m.verificationStatus === "rejected"
                              ? "bg-error-container text-on-error-container"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {m.verificationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            m.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-error-container text-on-error-container"
                          }`}
                        >
                          {m.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {m.application && m.verificationStatus === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleApproveMerchant(
                                    m.application._id,
                                    m.application.restaurantName
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  setRejectItem({
                                    id: m.application._id,
                                    name: m.application.restaurantName,
                                    type: "merchant",
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-error-container text-on-error-container font-bold text-[11px] cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleToggleUserStatus(m._id, m.isActive)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase cursor-pointer ${
                              m.isActive
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            }`}
                          >
                            {m.isActive ? "Suspend" : "Reactivate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: DELIVERY MANAGEMENT */}
        {activeTab === "delivery" && (
          <div className="bg-surface-container-lowest rounded-3xl border border-surface-container-high/60 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-surface-container-high flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-on-surface">Courier Fleet Supervision</h3>
                <p className="text-xs text-secondary mt-0.5">
                  Approve couriers, inspect vehicles, toggle suspension across all platform couriers.
                </p>
              </div>
              <div className="relative w-full md:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={deliverySearchQuery}
                  onChange={(e) => setDeliverySearchQuery(e.target.value)}
                  placeholder="Search courier, vehicle..."
                  className="w-full pl-9 pr-4 py-2 bg-surface-container-low rounded-xl text-xs text-on-surface border border-surface-container-high focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[850px] text-xs">
                <thead>
                  <tr className="bg-surface-container-low text-secondary text-[11px] uppercase font-bold tracking-wider h-11 border-b border-surface-container-high">
                    <th className="py-2 px-6">Courier</th>
                    <th className="py-2 px-6">Vehicle</th>
                    <th className="py-2 px-6">Duty Status</th>
                    <th className="py-2 px-6">Verification</th>
                    <th className="py-2 px-6 text-right">Super Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/60">
                  {filteredDelivery.map((d) => (
                    <tr key={d._id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3 px-6">
                        <div className="font-bold text-on-surface">{d.name}</div>
                        <div className="text-[11px] text-secondary">{d.phone || d.email}</div>
                      </td>
                      <td className="py-3 px-6">
                        <div className="font-semibold text-on-surface">{d.vehicleType}</div>
                        <div className="text-[11px] font-mono text-secondary">{d.vehicleNumber}</div>
                      </td>
                      <td className="py-3 px-6">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            d.isOnline
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-surface-container-high text-on-surface-variant"
                          }`}
                        >
                          {d.isOnline ? "On Duty" : "Offline"}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            d.verificationStatus === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : d.verificationStatus === "rejected"
                              ? "bg-error-container text-on-error-container"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {d.verificationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {d.application && d.verificationStatus === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleApproveDelivery(
                                    d.application._id,
                                    d.application.fullName
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  setRejectItem({
                                    id: d.application._id,
                                    name: d.application.fullName,
                                    type: "delivery",
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-error-container text-on-error-container font-bold text-[11px] cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleToggleUserStatus(d._id, d.isActive)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase cursor-pointer ${
                              d.isActive
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            }`}
                          >
                            {d.isActive ? "Suspend" : "Reactivate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: ORDERS */}
        {activeTab === "orders" && (
          <div className="bg-surface-container-lowest rounded-3xl border border-surface-container-high/60 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-surface-container-high flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-on-surface">Platform Orders Master Feed</h3>
                <p className="text-xs text-secondary mt-0.5">
                  Complete ledger of all customer tickets across every city hub.
                </p>
              </div>
              <div className="relative w-full md:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Search order #, customer, outlet..."
                  className="w-full pl-9 pr-4 py-2 bg-surface-container-low rounded-xl text-xs text-on-surface border border-surface-container-high focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px] text-xs">
                <thead>
                  <tr className="bg-surface-container-low text-secondary text-[11px] uppercase font-bold tracking-wider h-11 border-b border-surface-container-high">
                    <th className="py-2 px-6">Order ID &amp; Date</th>
                    <th className="py-2 px-6">Customer</th>
                    <th className="py-2 px-6">Restaurant</th>
                    <th className="py-2 px-6">Courier</th>
                    <th className="py-2 px-6">Amount</th>
                    <th className="py-2 px-6 text-right">Lifecycle Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/60">
                  {filteredOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3 px-6">
                        <span className="font-mono font-bold text-purple-700">
                          #{ord.orderNumber || ord._id.slice(-6)}
                        </span>
                        <div className="text-[11px] text-secondary">
                          {new Date(ord.date || ord.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <div className="font-bold text-on-surface">{ord.customer?.name}</div>
                        <div className="text-[11px] text-secondary">{ord.customer?.phone}</div>
                      </td>
                      <td className="py-3 px-6">
                        <div className="font-semibold text-on-surface">{ord.restaurant?.name || "Kitchen"}</div>
                        <div className="text-[11px] text-secondary">{ord.restaurant?.hub}</div>
                      </td>
                      <td className="py-3 px-6">
                        {ord.deliveryPartner ? (
                          <div>
                            <span className="font-semibold text-on-surface">{ord.deliveryPartner.name}</span>
                            <span className="text-[10px] text-secondary block">{ord.deliveryPartner.phone}</span>
                          </div>
                        ) : (
                          <span className="text-secondary italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-6">
                        <div className="font-bold text-on-surface">
                          ₹{Number(ord.amount || ord.totalAmount).toFixed(2)}
                        </div>
                        <span className="text-[10px] uppercase font-bold text-secondary">
                          {ord.paymentStatus} ({ord.paymentMethod})
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            ord.orderStatus === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.orderStatus === "CANCELLED"
                              ? "bg-error-container text-on-error-container"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {ord.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: PLATFORM SETTINGS (MONGODB PERSISTED) */}
        {activeTab === "settings" && (
          <div className="bg-surface-container-lowest rounded-3xl border border-surface-container-high/60 shadow-xs p-6 sm:p-8">
            <div className="flex items-center justify-between pb-6 border-b border-surface-container-high">
              <div>
                <h3 className="font-bold text-lg text-on-surface">Platform Business Rules &amp; Financial Settings</h3>
                <p className="text-xs text-secondary mt-1">
                  Settings are stored in MongoDB and take effect platform-wide.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                MongoDB Model Active
              </span>
            </div>

            <form onSubmit={handleSaveSettings} className="pt-6 space-y-6 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1 uppercase tracking-wider">
                    Base Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={settingsFormData.deliveryFee}
                    onChange={(e) =>
                      setSettingsFormData({ ...settingsFormData, deliveryFee: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm border border-surface-container-high focus:outline-none focus:border-purple-600 font-bold"
                  />
                  <span className="text-[11px] text-secondary mt-1 block">Default delivery surcharge</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1 uppercase tracking-wider">
                    GST / Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settingsFormData.taxRate}
                    onChange={(e) =>
                      setSettingsFormData({ ...settingsFormData, taxRate: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm border border-surface-container-high focus:outline-none focus:border-purple-600 font-bold"
                  />
                  <span className="text-[11px] text-secondary mt-1 block">Statutory food tax calculation</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1 uppercase tracking-wider">
                    Platform Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={settingsFormData.platformCommission}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        platformCommission: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm border border-surface-container-high focus:outline-none focus:border-purple-600 font-bold"
                  />
                  <span className="text-[11px] text-secondary mt-1 block">Standard merchant take rate</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1 uppercase tracking-wider">
                    Free Delivery Threshold (₹)
                  </label>
                  <input
                    type="number"
                    value={settingsFormData.freeDeliveryThreshold}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        freeDeliveryThreshold: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm border border-surface-container-high focus:outline-none focus:border-purple-600 font-bold"
                  />
                  <span className="text-[11px] text-secondary mt-1 block">Cart waiver value</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1 uppercase tracking-wider">
                    Minimum Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={settingsFormData.minOrderAmount}
                    onChange={(e) =>
                      setSettingsFormData({ ...settingsFormData, minOrderAmount: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm border border-surface-container-high focus:outline-none focus:border-purple-600 font-bold"
                  />
                  <span className="text-[11px] text-secondary mt-1 block">Cart checkout floor</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1 uppercase tracking-wider">
                    Surge Multiplier (x)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settingsFormData.surgeMultiplier}
                    onChange={(e) =>
                      setSettingsFormData({ ...settingsFormData, surgeMultiplier: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm border border-surface-container-high focus:outline-none focus:border-purple-600 font-bold"
                  />
                  <span className="text-[11px] text-secondary mt-1 block">Weather &amp; demand multiplier</span>
                </div>
              </div>

              {/* Service Availability Toggle */}
              <div className="p-4 rounded-2xl bg-surface-container-low flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-on-surface block">
                    City-Wide Platform Service Availability
                  </span>
                  <span className="text-xs text-secondary">
                    Toggle active ordering gateway for consumers
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsFormData.serviceAvailability}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        serviceAvailability: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-purple-700 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>

              <button
                type="submit"
                disabled={settingsSaving}
                className="px-6 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md flex items-center gap-2"
              >
                <span className={`material-symbols-outlined text-[18px] ${settingsSaving ? "animate-spin" : ""}`}>
                  save
                </span>
                <span>{settingsSaving ? "Saving to MongoDB..." : "Save Settings to MongoDB"}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 8: AUDIT LOGS */}
        {activeTab === "audit" && (
          <div className="bg-surface-container-lowest rounded-3xl border border-surface-container-high/60 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-surface-container-high flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-on-surface">Immutable Security Audit Logs</h3>
                <p className="text-xs text-secondary mt-0.5">
                  Records administrative promotions, approvals, suspensions, and platform adjustments.
                </p>
              </div>
              <div className="relative w-full md:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  placeholder="Search action, performer, target..."
                  className="w-full pl-9 pr-4 py-2 bg-surface-container-low rounded-xl text-xs text-on-surface border border-surface-container-high focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[850px] text-xs">
                <thead>
                  <tr className="bg-surface-container-low text-secondary text-[11px] uppercase font-bold tracking-wider h-11 border-b border-surface-container-high">
                    <th className="py-2 px-6">Timestamp</th>
                    <th className="py-2 px-6">Performed By</th>
                    <th className="py-2 px-6">Action</th>
                    <th className="py-2 px-6">Target</th>
                    <th className="py-2 px-6 text-right">IP &amp; Audit Trail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/60 font-mono">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3 px-6 text-secondary font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-6 font-sans">
                        <div className="font-bold text-on-surface">{log.performedByName}</div>
                        <span className="text-[10px] uppercase font-bold text-purple-700">
                          {log.performedByRole}
                        </span>
                      </td>
                      <td className="py-3 px-6 font-sans">
                        <span className="font-bold text-on-surface px-2 py-0.5 bg-surface-container-low rounded-lg">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-6 font-sans">
                        <span className="font-medium text-on-surface">
                          {log.target || log.targetUserName || "Platform"}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right text-secondary text-[11px]">
                        {log.ipAddress || "127.0.0.1"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: Create Admin */}
      {isCreateAdminOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-container-high flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <h3 className="font-bold text-base text-on-surface">Issue Operational Admin Account</h3>
              <button
                onClick={() => setIsCreateAdminOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-container text-secondary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-on-surface mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newAdminData.name}
                  onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })}
                  placeholder="e.g. Priyanshu Sharma"
                  className="w-full px-3 py-2 bg-surface-container-low rounded-xl border border-surface-container-high focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newAdminData.email}
                  onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                  placeholder="admin.name@bitego.com"
                  className="w-full px-3 py-2 bg-surface-container-low rounded-xl border border-surface-container-high focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newAdminData.phone}
                  onChange={(e) => setNewAdminData({ ...newAdminData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2 bg-surface-container-low rounded-xl border border-surface-container-high focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Secure Password</label>
                <input
                  type="password"
                  required
                  value={newAdminData.password}
                  onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                  placeholder="Password@123"
                  className="w-full px-3 py-2 bg-surface-container-low rounded-xl border border-surface-container-high focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateAdminOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer shadow-xs"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Admin */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-container-high flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <h3 className="font-bold text-base text-on-surface">Edit Admin Account</h3>
              <button
                onClick={() => setEditingAdmin(null)}
                className="p-1 rounded-lg hover:bg-surface-container text-secondary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleEditAdminSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-on-surface mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editAdminData.name}
                  onChange={(e) => setEditAdminData({ ...editAdminData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low rounded-xl border border-surface-container-high focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editAdminData.phone}
                  onChange={(e) => setEditAdminData({ ...editAdminData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low rounded-xl border border-surface-container-high focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Reset Password (leave empty to keep unchanged)</label>
                <input
                  type="password"
                  value={editAdminData.password}
                  onChange={(e) => setEditAdminData({ ...editAdminData, password: e.target.value })}
                  placeholder="New password..."
                  className="w-full px-3 py-2 bg-surface-container-low rounded-xl border border-surface-container-high focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Rejection with Reason */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-container-high flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <h3 className="font-bold text-base text-on-surface">Reject Application</h3>
              <button
                onClick={() => setRejectItem(null)}
                className="p-1 rounded-lg hover:bg-surface-container text-secondary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-secondary">
              Provide a clear compliance or document rejection reason for <span className="font-bold text-on-surface">{rejectItem.name}</span>:
            </p>

            <textarea
              rows="3"
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. FSSAI registration certificate is blurry or expired..."
              className="w-full px-3 py-2 bg-surface-container-low rounded-xl border border-surface-container-high text-xs focus:outline-none focus:border-purple-600"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectItem(null)}
                className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                className="px-4 py-2 rounded-xl bg-error hover:bg-error/90 text-on-error font-bold text-xs cursor-pointer shadow-xs"
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
