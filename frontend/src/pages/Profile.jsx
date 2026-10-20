import React, { useState, useEffect } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { API_BASE_URL } from "../services/api";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Star,
  ShoppingBag,
  LogOut,
  Save,
  Clock,
  Sparkles,
  Lock,
} from "lucide-react";

export default function Profile() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const cart = useCart();

  // Role-specific profile navigation guard: Customer Profile must open only for customers
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-3 border-orange-200 border-t-[#b12408] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role === "delivery") {
    return <Navigate to="/fleet/profile" replace />;
  }
  if (user.role === "merchant") {
    return <Navigate to="/merchant" replace />;
  }
  if (user.role === "admin" || user.role === "superadmin") {
    return <Navigate to="/admin" replace />;
  }

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    houseFlat: "",
    area: "",
    landmark: "",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380054",
    type: "home",
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  // Sync user state when loaded
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  // Fetch addresses
  const fetchAddresses = async () => {
    const token = localStorage.getItem("bitego_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.addresses)) {
        setAddresses(data.addresses);
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");

    const token = localStorage.getItem("bitego_token");
    try {
      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileMessage("Profile updated successfully!");
        setTimeout(() => setProfileMessage(""), 3000);
      } else {
        setProfileMessage(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setProfileMessage("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage("");

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage("New password must be at least 6 characters.");
      return;
    }

    setSavingPassword(true);
    const token = localStorage.getItem("bitego_token");
    try {
      const res = await fetch(`${API_BASE_URL}/users/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordMessage("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordMessage(""), 3500);
      } else {
        setPasswordMessage(data.message || "Failed to update password.");
      }
    } catch (err) {
      console.error("Change password error:", err);
      setPasswordMessage("Network error updating password.");
    } finally {
      setSavingPassword(false);
    }
  };

  // Add Address
  const handleAddAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    const token = localStorage.getItem("bitego_token");
    try {
      const res = await fetch(`${API_BASE_URL}/users/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAddress),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddressModal(false);
        fetchAddresses();
        setNewAddress({
          fullName: user?.name || "",
          phone: user?.phone || "",
          houseFlat: "",
          area: "",
          landmark: "",
          city: "Ahmedabad",
          state: "Gujarat",
          pincode: "380054",
          type: "home",
        });
      } else {
        alert(data.message || "Failed to save address.");
      }
    } catch (err) {
      console.error("Add address error:", err);
      alert("Error saving address.");
    } finally {
      setSavingAddress(false);
    }
  };

  // Set default address
  const handleSetDefaultAddress = async (id) => {
    const token = localStorage.getItem("bitego_token");
    try {
      await fetch(`${API_BASE_URL}/users/addresses/${id}/default`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAddresses();
    } catch (err) {
      console.error("Error setting default address:", err);
    }
  };

  // Delete address
  const handleDeleteAddress = async (id) => {
    const token = localStorage.getItem("bitego_token");
    if (!window.confirm("Remove this saved address?")) return;
    try {
      await fetch(`${API_BASE_URL}/users/addresses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAddresses();
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "BG";

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* 1. NAVBAR */}
      <Navbar
        activePage="Profile"
        cartCount={cart.totalItemCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full pt-28 pb-16 md:pt-32 md:pb-24">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 border-4 border-white">
                {userInitials}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {user?.name || "Customer Member"}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700">
                    <Sparkles className="w-3 h-3 text-orange-600" />
                    BiteGo Gold Member
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user?.email || "customer@bitego.com"}</span>
                  <span className="text-slate-300">•</span>
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user?.phone || "+91 98765 43210"}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-stretch sm:self-auto">
              <Link
                to="/orders"
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>My Orders</span>
              </Link>

              <button
                type="button"
                onClick={logout}
                className="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* TWO COLUMN GRID */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* LEFT: EDIT PROFILE & PASSWORD */}
            <div className="md:col-span-5 space-y-6">
              {/* Account Details */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                  <User className="w-5 h-5 text-orange-600" />
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Account Details
                  </h2>
                </div>

                {profileMessage && (
                  <div className={`p-3 rounded-2xl text-xs font-bold ${
                    profileMessage.includes("success")
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}>
                    {profileMessage}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label htmlFor="profile-name" className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Address (Read-only)
                    </label>
                    <input
                      id="profile-email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-phone" className="block text-xs font-bold text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      id="profile-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full py-3 px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md shadow-orange-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingProfile ? "Saving Changes..." : "Save Profile"}</span>
                  </button>
                </form>
              </div>

              {/* Change Password Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                  <Lock className="w-5 h-5 text-orange-600" />
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Change Password
                  </h2>
                </div>

                {passwordMessage && (
                  <div
                    className={`p-3 rounded-2xl text-xs font-bold ${
                      passwordMessage.includes("success")
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {passwordMessage}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label
                      htmlFor="current-password"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Current Password
                    </label>
                    <input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-password"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      New Password (Min 6 chars)
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Confirm New Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4 text-orange-400" />
                    <span>{savingPassword ? "Updating..." : "Update Password"}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* RIGHT: SAVED ADDRESSES */}
            <div className="md:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Saved Addresses
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New</span>
                </button>
              </div>

              {loadingAddresses ? (
                <div className="text-center py-10">
                  <p className="text-xs text-slate-400 font-medium">Loading saved addresses...</p>
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No saved addresses yet</p>
                  <p className="text-[11px] text-slate-400">Add an address for seamless 1-tap checkout</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        addr.isDefault
                          ? "bg-orange-50/40 border-orange-200"
                          : "bg-slate-50/70 border-slate-100"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900 uppercase">
                            {addr.type || "Home"}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-orange-600 text-white">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                          {addr.houseFlat}, {addr.area}
                          {addr.landmark ? `, Near ${addr.landmark}` : ""}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Contact: {addr.fullName} ({addr.phone})
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!addr.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr._id)}
                            className="text-[11px] font-bold text-orange-600 hover:underline cursor-pointer"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr._id)}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ADD ADDRESS MODAL */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Add New Delivery Address</h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="address-fullname" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Contact Name
                  </label>
                  <input
                    id="address-fullname"
                    type="text"
                    required
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label htmlFor="address-phone" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="address-phone"
                    type="tel"
                    required
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address-houseflat" className="block text-[11px] font-bold text-slate-600 mb-1">
                  House / Flat / Tower / Floor
                </label>
                <input
                  id="address-houseflat"
                  type="text"
                  required
                  placeholder="e.g. 402 Galaxy Heights"
                  value={newAddress.houseFlat}
                  onChange={(e) => setNewAddress({ ...newAddress, houseFlat: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="address-area" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Area / Street
                  </label>
                  <input
                    id="address-area"
                    type="text"
                    required
                    placeholder="e.g. Sindhu Bhavan Road"
                    value={newAddress.area}
                    onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label htmlFor="address-landmark" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    id="address-landmark"
                    type="text"
                    placeholder="e.g. Near Taj Skyline"
                    value={newAddress.landmark}
                    onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="address-city" className="block text-[11px] font-bold text-slate-600 mb-1">
                    City
                  </label>
                  <input
                    id="address-city"
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label htmlFor="address-state" className="block text-[11px] font-bold text-slate-600 mb-1">
                    State
                  </label>
                  <input
                    id="address-state"
                    type="text"
                    required
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label htmlFor="address-pincode" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Pincode
                  </label>
                  <input
                    id="address-pincode"
                    type="text"
                    required
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tag Address As
                </label>
                <div className="flex gap-2">
                  {["home", "work", "other"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewAddress({ ...newAddress, type: t })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                        newAddress.type === t
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-md shadow-orange-600/30 cursor-pointer"
                >
                  {savingAddress ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
