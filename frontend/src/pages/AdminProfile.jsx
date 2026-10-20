import React from "react";
import AdminLayout from "../components/admin/AdminLayout";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Building,
  KeyRound,
  Calendar,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const adminName = user?.name || "BiteGo Administrator";
  const userInitial = adminName ? adminName.charAt(0).toUpperCase() : "A";
  const roleLabel =
    user?.role === "superadmin"
      ? "Super Administrator (Root)"
      : "Platform Administrator";

  return (
    <AdminLayout>
      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl w-full mx-auto font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#151c27] tracking-tight">
              Administrator Profile
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Authenticated administrative credentials and console access permissions
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Banner */}
          <div className="h-28 bg-gradient-to-r from-[#151c27] via-[#1f293d] to-[#151c27] px-6 flex items-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#b12408] text-white flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-white">
                {userInitial}
              </div>
              <div className="text-white">
                <h2 className="text-lg font-black tracking-tight">{adminName}</h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="p-6 space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Address</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{user?.email || "admin@bitego.com"}</p>
                <p className="text-[11px] text-slate-400">Primary administrative account</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Contact Phone</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{user?.phone || "+91 98250 44321"}</p>
                <p className="text-[11px] text-slate-400">Emergency platform contact</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <Building className="w-3.5 h-3.5" />
                  <span>Assigned Operations Hub</span>
                </div>
                <p className="text-sm font-bold text-slate-900">Ahmedabad Central Operations Hub</p>
                <p className="text-[11px] text-slate-400">Bodakdev, Vastrapur &amp; Navrangpura</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Access Tier</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {user?.role === "superadmin" ? "Level 3 - Root Authority" : "Level 2 - Operations Admin"}
                </p>
                <p className="text-[11px] text-slate-400">Full operational management authorization</p>
              </div>
            </div>

            {/* Security note */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                Administrative Security Rule
              </span>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Administrator permissions are verified directly by backend JWT authorization middlewares on every request. Admin credentials cannot be modified through public registration.
              </p>
            </div>
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}
