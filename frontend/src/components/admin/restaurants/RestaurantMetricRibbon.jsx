import React from "react";

export default function RestaurantMetricRibbon() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
      {/* Card 1: Total Listed */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-surface-container-high/40 flex flex-col justify-between">
        <div className="flex items-center justify-between text-on-surface-variant mb-space-xs">
          <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
            Total Listed
          </span>
          <span className="material-symbols-outlined text-[20px] text-primary">
            store
          </span>
        </div>
        <div className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
          842 Outlets
        </div>
        <div className="flex items-center gap-1 text-tertiary font-label-sm text-label-sm font-semibold mt-1">
          <span className="material-symbols-outlined text-[16px]">trending_up</span>
          <span>+14 this week</span>
        </div>
      </div>

      {/* Card 2: Pending Review */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-surface-container-high/40 flex flex-col justify-between">
        <div className="flex items-center justify-between text-on-surface-variant mb-space-xs">
          <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
            Pending Review
          </span>
          <span className="material-symbols-outlined text-[20px] text-error">
            assignment_late
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
            3
          </span>
          <span className="font-label-md text-label-md text-on-surface-variant">
            Applications
          </span>
        </div>
        <div className="text-on-surface-variant font-label-sm text-label-sm truncate mt-1">
          Avg turnaround: <span className="text-on-surface font-semibold">4.2 hours</span>
        </div>
      </div>

      {/* Card 3: Active Today */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-surface-container-high/40 flex flex-col justify-between">
        <div className="flex items-center justify-between text-on-surface-variant mb-space-xs">
          <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
            Active Today
          </span>
          <span className="material-symbols-outlined text-[20px] text-tertiary">
            check_circle
          </span>
        </div>
        <div className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
          812 Online
        </div>
        <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm mt-1">
          <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
          <span>96.4% fleet connectivity</span>
        </div>
      </div>

      {/* Card 4: Monthly Yield */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-surface-container-high/40 flex flex-col justify-between">
        <div className="flex items-center justify-between text-on-surface-variant mb-space-xs">
          <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
            Monthly Yield
          </span>
          <span className="material-symbols-outlined text-[20px] text-primary">
            payments
          </span>
        </div>
        <div className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
          ₹14.8M
        </div>
        <div className="text-on-surface-variant font-label-sm text-label-sm mt-1">
          Avg Commission: <span className="text-on-surface font-semibold">18.5%</span>
        </div>
      </div>

      {/* Card 5: FSSAI Compliance */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-surface-container-high/40 flex flex-col justify-between">
        <div className="flex items-center justify-between text-on-surface-variant mb-space-xs">
          <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
            FSSAI Compliance
          </span>
          <span className="material-symbols-outlined text-[20px] text-tertiary">
            verified
          </span>
        </div>
        <div className="font-headline-lg text-headline-lg text-tertiary font-bold tracking-tight">
          98.8%
        </div>
        <div className="text-on-surface-variant font-label-sm text-label-sm truncate mt-1">
          10 audits due this week
        </div>
      </div>
    </section>
  );
}
