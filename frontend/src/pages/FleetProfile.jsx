import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FleetSidebar from "../components/fleet/FleetSidebar";
import FleetHeader from "../components/fleet/FleetHeader";
import api, { API_BASE_URL } from "../services/api";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Bike,
  ShieldCheck,
  CheckCircle2,
  Lock,
  LogOut,
  Save,
  FileText,
  AlertCircle,
  Power,
} from "lucide-react";

export default function FleetProfile() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnDuty, setIsOnDuty] = useState(user?.isOnline ?? true);

  // Profile Form State (Editable fields supported by backend)
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [city, setCity] = useState(user?.city || "Ahmedabad");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");

  // Delivery Application Info (Vehicle & License details)
  const [applicationData, setApplicationData] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setCity(user.city || "Ahmedabad");
      setIsOnDuty(user.isOnline ?? true);
    }
  }, [user]);

  // Fetch delivery application details (vehicle, license, etc.)
  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res = await api.get("/delivery/application");
        const data = res?.data || res;
        if (data?.success && data.application) {
          setApplicationData(data.application);
        }
      } catch (err) {
        // Application record may not exist for all test accounts
        console.warn("Application fetch note:", err?.message || err);
      } finally {
        setLoadingApp(false);
      }
    };

    fetchApplication();
  }, []);

  // Handle Profile Update (name, phone, city)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    setProfileError("");

    try {
      const res = await api.put("/users/profile", {
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
      });
      const data = res?.data || res;
      if (data?.success) {
        setProfileMsg("Profile updated successfully!");
        if (refreshUser) {
          await refreshUser();
        }
        setTimeout(() => setProfileMsg(""), 3500);
      } else {
        setProfileError(data?.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Update profile error:", err);
      setProfileError(
        err.response?.data?.message || "Error updating profile details."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.put("/users/change-password", {
        currentPassword,
        newPassword,
      });
      const data = res?.data || res;
      if (data?.success) {
        setPasswordMsg("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordMsg(""), 3500);
      } else {
        setPasswordError(data?.message || "Failed to change password.");
      }
    } catch (err) {
      console.error("Change password error:", err);
      setPasswordError(
        err.response?.data?.message || "Invalid current password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "D";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 selection:bg-orange-500 selection:text-white">
      {/* 1. SIDEBAR */}
      <FleetSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isOnDuty={isOnDuty}
      />

      {/* 2. HEADER */}
      <FleetHeader
        onOpenSidebar={() => setSidebarOpen(true)}
        isOnDuty={isOnDuty}
      />

      {/* 3. MAIN CONTENT */}
      <div className="lg:pl-64 pt-16 flex-1 flex flex-col">
        <main className="p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-6">
          {/* Page Title & Context */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#151c27] tracking-tight">
                Delivery Agent Profile
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manage your fleet credentials, contact details, and account security
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer border border-rose-200 self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

          {/* AGENT SUMMARY CARD */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Profile Photo or Initials Avatar */}
              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-200 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#151c27] text-white flex items-center justify-center font-black text-2xl shadow-sm border-2 border-slate-700">
                  {userInitial}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    {user?.name || "Dev Delivery Agent"}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {user?.verificationStatus === "approved"
                      ? "Approved Partner"
                      : "Pending Verification"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user?.email || "No email"}</span>
                  </span>
                  {user?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{user.phone}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user?.city || "Ahmedabad"} Hub</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Account Status Pills */}
            <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
                Portal Status
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    isOnDuty
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnDuty ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                    }`}
                  />
                  <span>Duty: {isOnDuty ? "ONLINE" : "OFFLINE"}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-[#b12408] border border-orange-200 text-xs font-bold">
                  <Bike className="w-3.5 h-3.5" />
                  <span>Fleet Agent</span>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT / CENTER (2 cols): EDIT PROFILE */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Details Form */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-[#151c27] flex items-center gap-2">
                    <User className="w-4 h-4 text-[#b12408]" />
                    <span>Personal & Contact Information</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your agent contact name, operational phone number, and hub city
                  </p>
                </div>

                {profileMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{profileMsg}</span>
                  </div>
                )}

                {profileError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="fleet-name"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Full Name
                    </label>
                    <input
                      id="fleet-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#b12408] focus:outline-none text-sm font-semibold text-slate-800"
                      placeholder="Your Full Name"
                    />
                  </div>

                  {/* Email (Read-Only) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="fleet-email"
                        className="block text-xs font-bold text-slate-700"
                      >
                        Email Address
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Read-only (Security Managed)
                      </span>
                    </div>
                    <input
                      id="fleet-email"
                      type="email"
                      disabled
                      value={user?.email || ""}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  {/* Phone & City (2 columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="fleet-phone"
                        className="block text-xs font-bold text-slate-700 mb-1"
                      >
                        Phone Number
                      </label>
                      <input
                        id="fleet-phone"
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#b12408] focus:outline-none text-sm font-semibold text-slate-800"
                        placeholder="+91 98000 00000"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="fleet-city"
                        className="block text-xs font-bold text-slate-700 mb-1"
                      >
                        Operational City
                      </label>
                      <input
                        id="fleet-city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#b12408] focus:outline-none text-sm font-semibold text-slate-800"
                        placeholder="Ahmedabad"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-6 py-2.5 rounded-xl bg-[#b12408] hover:bg-[#931f07] text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingProfile ? "Saving..." : "Save Profile Changes"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* CHANGE PASSWORD */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-[#151c27] flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#b12408]" />
                    <span>Security & Password</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your password to keep your delivery agent portal account secure
                  </p>
                </div>

                {passwordMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{passwordMsg}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label
                      htmlFor="fleet-current-password"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Current Password
                    </label>
                    <input
                      id="fleet-current-password"
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#b12408] focus:outline-none text-sm font-semibold text-slate-800"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="fleet-new-password"
                        className="block text-xs font-bold text-slate-700 mb-1"
                      >
                        New Password
                      </label>
                      <input
                        id="fleet-new-password"
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#b12408] focus:outline-none text-sm font-semibold text-slate-800"
                        placeholder="Min 6 characters"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="fleet-confirm-password"
                        className="block text-xs font-bold text-slate-700 mb-1"
                      >
                        Confirm New Password
                      </label>
                      <input
                        id="fleet-confirm-password"
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#b12408] focus:outline-none text-sm font-semibold text-slate-800"
                        placeholder="Repeat new password"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{savingPassword ? "Updating..." : "Update Password"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* RIGHT SIDEBAR (1 col): FLEET CREDENTIALS & ONBOARDING DETAILS */}
            <div className="space-y-6">
              {/* Delivery Partner Credentials */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-[#151c27] flex items-center gap-2">
                    <Bike className="w-4 h-4 text-[#b12408]" />
                    <span>Fleet Credentials</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vehicle and license details recorded on BiteGo Fleet registry
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Role</span>
                    <span className="font-bold text-slate-800 capitalize">
                      {user?.role || "delivery"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Account Status</span>
                    <span className="font-bold text-emerald-600">
                      {user?.isActive ? "Active" : "Suspended"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Verification</span>
                    <span className="font-bold text-emerald-600 capitalize">
                      {user?.verificationStatus || "approved"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Vehicle Type</span>
                    <span className="font-bold text-slate-800">
                      {applicationData?.vehicleType || "Bike"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Vehicle Plate</span>
                    <span className="font-bold text-slate-800">
                      {applicationData?.vehicleNumber || "GJ-01-DEV-9999"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Driving License</span>
                    <span className="font-bold text-slate-800 truncate max-w-[140px]">
                      {applicationData?.drivingLicenseNumber || "GJ0120200012345"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-500 font-medium">Hub Base</span>
                    <span className="font-bold text-slate-800">
                      {user?.city || "Ahmedabad"} Core Hub
                    </span>
                  </div>
                </div>
              </div>

              {/* Fleet Support & Standards */}
              <div className="bg-orange-50/60 rounded-2xl p-5 border border-orange-200/70 space-y-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#b12408]" />
                  <h4 className="text-xs font-bold text-[#b12408] uppercase tracking-wider">
                    Fleet Guidelines
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Delivery partners are required to keep contact numbers up to date and verify customer PINs during order handovers. For vehicle updates, contact Fleet Dispatch.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
