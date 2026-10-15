import React from "react";

export default function FleetKpiCards({ stats = {} }) {
  const todayTotal = stats.todayEarnings !== undefined ? stats.todayEarnings : 1420;
  const base = stats.todayBreakdown?.base !== undefined ? stats.todayBreakdown.base : 980;
  const surge = stats.todayBreakdown?.surge !== undefined ? stats.todayBreakdown.surge : 320;
  const tip = stats.todayBreakdown?.tip !== undefined ? stats.todayBreakdown.tip : 120;
  const completedDrops = stats.completedTrips !== undefined ? stats.completedTrips : 8;
  const weeklyTotal = stats.weeklyEarnings !== undefined ? stats.weeklyEarnings : 5840;
  const grandTotal = stats.totalEarnings !== undefined ? stats.totalEarnings : 18920;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 font-sans">
      {/* 1. Today's Earnings */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
            Today's Total
          </span>
          <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[12px]">trending_up</span>
            Live
          </span>
        </div>

        <div className="mt-2">
          <div className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            ₹{todayTotal.toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            ₹{base} base • ₹{surge} surge • ₹{tip} tip
          </p>
        </div>

        <div className="mt-3 pt-2 bg-surface-container-low -mx-4 -mb-4 px-4 py-2 flex items-center justify-between border-t border-slate-100/60">
          <span className="text-xs text-on-surface-variant">Weekly Total</span>
          <span className="text-xs font-bold text-primary">₹{weeklyTotal.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* 2. Completed Trips */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
            Completed Trips
          </span>
          <span className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">sports_motorsports</span>
          </span>
        </div>

        <div className="mt-2">
          <div className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            {completedDrops} <span className="text-lg font-medium text-on-surface-variant">Drops</span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            All-time: ₹{grandTotal.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="mt-3 pt-2 bg-surface-container-low -mx-4 -mb-4 px-4 py-2 flex items-center justify-between border-t border-slate-100/60">
          <span className="text-xs text-on-surface-variant">Status</span>
          <span className="text-xs font-semibold text-tertiary">Active Duty</span>
        </div>
      </div>

      {/* 3. Acceptance Rate */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
            Acceptance
          </span>
          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
            Platinum
          </span>
        </div>

        <div className="mt-2">
          <div className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            96.2%
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            25 of 26 accepted today
          </p>
        </div>

        <div className="mt-3 pt-2 bg-surface-container-low -mx-4 -mb-4 px-4 py-2 flex items-center justify-between border-t border-slate-100/60">
          <span className="text-xs text-on-surface-variant">Cancel Rate</span>
          <span className="text-xs font-semibold text-tertiary">0.0% (Zero)</span>
        </div>
      </div>

      {/* 4. Courier Rating */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
            Partner Rating
          </span>
          <span className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[16px]">stars</span>
          </span>
        </div>

        <div className="mt-2">
          <div className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight flex items-center gap-1.5">
            4.9 <span className="text-amber-500 text-xl font-bold">★</span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            1,420 Customer Ratings
          </p>
        </div>

        <div className="mt-3 pt-2 bg-surface-container-low -mx-4 -mb-4 px-4 py-2 flex items-center justify-between border-t border-slate-100/60">
          <span className="text-xs text-on-surface-variant">Safety Badges</span>
          <span className="text-xs font-semibold text-on-surface">5-Star Packer</span>
        </div>
      </div>

      {/* 5. Incentive Progress */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
            Rain Tier 2
          </span>
          <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[11px] font-bold">
            ₹250 Next
          </span>
        </div>

        <div className="mt-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-extrabold text-on-surface">
              3 Drops Left
            </span>
            <span className="text-xs font-bold text-primary">72%</span>
          </div>
          <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: "72%" }}
            />
          </div>
        </div>

        <div className="mt-3 pt-2 bg-surface-container-low -mx-4 -mb-4 px-4 py-2 flex items-center justify-between border-t border-slate-100/60">
          <span className="text-xs text-on-surface-variant">Deadline</span>
          <span className="text-xs font-semibold text-on-surface">
            11:30 PM (Tonight)
          </span>
        </div>
      </div>
    </div>
  );
}
