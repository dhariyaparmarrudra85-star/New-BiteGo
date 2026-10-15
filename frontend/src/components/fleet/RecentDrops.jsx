import React from "react";

export default function RecentDrops({
  onViewAllClick = () => {},
  drops: initialDrops,
}) {
  const defaultDrops = [
    {
      id: "BG-89408",
      location: "Vastrapur Residency",
      tripTime: "18m trip time",
      amount: "₹115.00",
    },
    {
      id: "BG-89402",
      location: "Judges Bungalow Rd",
      tripTime: "22m trip time",
      amount: "₹130.00",
    },
    {
      id: "BG-89395",
      location: "Iscon Platinum Suites",
      tripTime: "15m trip time",
      amount: "₹95.00",
    },
  ];

  const drops = (initialDrops && initialDrops.length > 0) ? initialDrops : defaultDrops;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col gap-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100/80">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
            history
          </span>
          <span className="text-sm font-bold text-on-surface">
            Recent Drops (Last 3)
          </span>
        </div>
        <button
          type="button"
          onClick={onViewAllClick}
          className="text-xs text-primary font-bold hover:underline cursor-pointer"
        >
          View All 8
        </button>
      </div>

      {/* Drops List */}
      <div className="flex flex-col gap-2">
        {drops.map((drop) => (
          <div
            key={drop.id}
            className="p-2.5 rounded-xl bg-surface-container-low flex items-center justify-between gap-2 border border-slate-100/70"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[14px]">
                  done_all
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-on-surface truncate block">
                  {drop.location}
                </span>
                <span className="text-[11px] text-on-surface-variant truncate block font-medium">
                  #{drop.id} • {drop.tripTime}
                </span>
              </div>
            </div>
            <span className="font-bold text-xs text-on-surface shrink-0">
              {drop.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
