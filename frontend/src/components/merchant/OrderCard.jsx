import { useState } from "react";
import {
  Clock,
  Printer,
  Bike,
  ChevronRight,
  MessageSquare,
} from "lucide-react";

export default function OrderCard({
  order,
  onStatusAdvance = () => {},
  onDecline = () => {},
}) {
  const [printSuccess, setPrintSuccess] = useState(false);

  const {
    id,
    orderNumber,
    customerName,
    placedTime,
    items,
    total,
    status,
    prepTimeLeft,
    riderName,
    riderVehicle,
    cookingNotes,
    otp,
  } = order;

  const handlePrintKOT = () => {
    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 2000);
  };

  const statusConfigs = {
    incoming: {
      badge: "Needs Acceptance",
      badgeClass: "bg-orange-100 text-orange-900 border-orange-200",
      cta: "Accept & Start Prep",
      ctaClass: "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20",
    },
    preparing: {
      badge: "In Oven / Preparing",
      badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
      cta: "Ready at Counter",
      ctaClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
    },
    ready: {
      badge: "Ready at Counter",
      badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-200",
      cta: "Handover to Rider",
      ctaClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
    },
    out: {
      badge: "Out for Delivery",
      badgeClass: "bg-sky-100 text-sky-900 border-sky-200",
      cta: "Completed",
      ctaClass: "bg-slate-200 text-slate-500 cursor-not-allowed",
    },
  };

  const config = statusConfigs[status] || statusConfigs.incoming;

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
      {/* Card Header: Order #, Status, Timer */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-900">
                #{orderNumber}
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${config.badgeClass}`}
              >
                {config.badge}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-600 mt-0.5">
              {customerName}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold flex-shrink-0">
            <Clock className="w-3.5 h-3.5 text-orange-600" />
            <span>{prepTimeLeft || placedTime}</span>
          </div>
        </div>

        {/* Cooking Notes Alert if present */}
        {cookingNotes && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 font-medium flex items-start gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>Note: {cookingNotes}</span>
          </div>
        )}

        {/* Item List */}
        <div className="space-y-2 py-2 border-y border-slate-100 text-xs">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-800 font-black flex items-center justify-center text-[11px]">
                  {item.qty}x
                </span>
                <div>
                  <span className="font-extrabold text-slate-900">
                    {item.name}
                  </span>
                  {item.addOns && (
                    <p className="text-[10px] text-slate-400 font-medium">
                      + {item.addOns}
                    </p>
                  )}
                </div>
              </div>
              <span className="font-bold text-slate-700">₹{item.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rider & Pricing Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          {riderName ? (
            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
              <Bike className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {riderName} ({riderVehicle})
              </span>
              {otp && (
                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-900">
                  OTP: {otp}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">
              Assigning rider...
            </span>
          )}

          <div className="text-right">
            <span className="text-sm font-black text-slate-900">
              ₹{total}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block -mt-0.5">
              UPI Paid
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {/* Print KOT Button */}
          <button
            type="button"
            onClick={handlePrintKOT}
            title="Print Kitchen Order Ticket (KOT)"
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              printSuccess
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Advance Pipeline Stage Button */}
          {status !== "out" ? (
            <button
              type="button"
              onClick={() => onStatusAdvance(id)}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer ${config.ctaClass}`}
            >
              <span>{config.cta}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs text-center">
              En Route with Rider
            </div>
          )}

          {/* Decline for Incoming */}
          {status === "incoming" && (
            <button
              type="button"
              onClick={() => onDecline(id)}
              className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
            >
              Reject
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
