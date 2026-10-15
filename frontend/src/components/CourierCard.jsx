import React, { useState } from "react";
import {
  Phone,
  MessageSquare,
  Star,
  ShieldCheck,
  Zap,
  Leaf,
  Check,
  UserCheck,
} from "lucide-react";

export default function CourierCard({ order = null, courier = null }) {
  const [showCallAlert, setShowCallAlert] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  const activePartner = courier || order?.deliveryPartner;
  const isAssigned = Boolean(activePartner && (activePartner._id || activePartner.name));
  const courierName = activePartner?.name || "BiteGo Courier Pilot";
  const courierPhone = activePartner?.phone || "+91 98980 55667";
  const courierVehicle = activePartner?.vehicleType || activePartner?.vehicle || "Ather 450X EV Express";
  const courierRating = activePartner?.rating || 4.9;

  const handleCall = () => {
    setShowCallAlert(true);
    setTimeout(() => setShowCallAlert(false), 3500);
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (noteText.trim()) {
      setNoteSaved(true);
      setTimeout(() => {
        setNoteSaved(false);
        setNoteOpen(false);
      }, 1800);
    }
  };

  if (!isAssigned) {
    return (
      <div className="w-full bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Delivery Partner
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span>Assigning Courier</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Matching Nearby Fleet Partner</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Courier will be assigned shortly once a pilot accepts the dispatch.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] space-y-5">
      {/* Top Badge: Assigned Courier & EV Express */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">
          Assigned Courier
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
          <Leaf className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
          <span>EV Express</span>
        </span>
      </div>

      {/* Courier Profile Info */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-orange-100 to-amber-100 border-2 border-orange-200 shadow-md">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
              alt={`${courierName} - BiteGo Courier`}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[10px]">
            ✓
          </span>
        </div>

        {/* Courier Meta */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-black text-slate-900 leading-tight">
              {courierName}
            </h4>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{courierRating}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            1,420+ safe deliveries • {courierVehicle}
          </p>

          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-600" />
            <span>Zero Emission Delivery</span>
          </p>
        </div>
      </div>

      {/* Health & Safety Badge */}
      <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <p className="text-xs text-slate-700 font-semibold leading-tight">
          Vaccinated &amp; Temperature Checked (98.2°F)
        </p>
      </div>

      {/* Call Alert Toast */}
      {showCallAlert && (
        <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200 text-orange-900 text-xs font-bold text-center animate-in fade-in duration-200">
          📞 Calling {courierName} at {courierPhone} (Masked Partner Line)
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={handleCall}
          className="py-3 px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Phone className="w-4 h-4" />
          <span>Call {courierName.split(" ")[0]}</span>
        </button>

        <button
          type="button"
          onClick={() => setNoteOpen(!noteOpen)}
          className="py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:border-slate-300 active:scale-[0.98] cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-slate-500" />
          <span>Delivery Note</span>
        </button>
      </div>

      {/* Delivery Note Dropdown Drawer */}
      {noteOpen && (
        <form
          onSubmit={handleSaveNote}
          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 animate-in fade-in duration-200"
        >
          <label htmlFor="delivery-note-input" className="block text-xs font-bold text-slate-700">
            Note for Rider Rajesh:
          </label>
          <input
            id="delivery-note-input"
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="e.g. Ring the bell twice, leave on shoe rack..."
            className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-200 outline-none focus:border-orange-500"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setNoteOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"
            >
              {noteSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Saved!
                </>
              ) : (
                "Send Note"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
