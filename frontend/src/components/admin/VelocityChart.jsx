import React, { useState } from "react";

export default function VelocityChart({ onActionToast }) {
  const [activeRange, setActiveRange] = useState("Today");

  const ranges = ["Today", "7D", "30D", "YTD"];

  const handleRangeChange = (range) => {
    setActiveRange(range);
    if (onActionToast) {
      onActionToast(`Switched velocity timeframe to ${range}`);
    }
  };

  return (
    <div className="lg:col-span-7 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/40 flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs mb-space-md">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
              Hourly Platform Velocity &amp; Surge Demand
            </h2>
            <p className="font-body-sm text-body-sm text-secondary mt-0.5">
              Live run-rate dispatch curve vs last Saturday benchmark
            </p>
          </div>

          {/* Timeframe Capsule */}
          <div className="inline-flex bg-surface-container p-1 rounded-xl self-start sm:self-auto">
            {ranges.map((range) => {
              const isActive = activeRange === range;
              return (
                <button
                  key={range}
                  type="button"
                  onClick={() => handleRangeChange(range)}
                  className={`px-space-sm py-1 font-label-sm text-label-sm rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? "bg-surface-container-lowest text-on-surface shadow-xs font-bold"
                      : "text-on-surface-variant hover:text-on-surface font-semibold"
                  }`}
                >
                  {range}
                </button>
              );
            })}
          </div>
        </div>

        {/* Metric highlights inside graph */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-sm mb-space-md">
          <div className="p-space-sm bg-surface-container-low rounded-xl">
            <span className="font-label-sm text-label-sm text-secondary uppercase font-bold">
              Current Speed
            </span>
            <p className="font-headline-sm text-headline-sm text-on-surface font-bold">
              392 orders/hr
            </p>
          </div>
          <div className="p-space-sm bg-surface-container-low rounded-xl">
            <span className="font-label-sm text-label-sm text-secondary uppercase font-bold">
              Lunch Peak
            </span>
            <p className="font-headline-sm text-headline-sm text-on-surface font-bold">
              468 orders/hr
            </p>
          </div>
          <div className="p-space-sm bg-surface-container-low rounded-xl col-span-2 sm:col-span-1">
            <span className="font-label-sm text-label-sm text-secondary uppercase font-bold">
              Dinner Expected
            </span>
            <p className="font-headline-sm text-headline-sm text-primary font-bold">
              580 orders/hr
            </p>
          </div>
        </div>

        {/* Dynamic Chart Area (Inline Vector Chart with Markers) */}
        <div className="relative w-full h-64 bg-surface-container-low rounded-xl p-space-md flex flex-col justify-end overflow-hidden border border-surface-container-high/30">
          {/* Subtle Grid Lines */}
          <div className="absolute inset-x-4 top-8 border-b border-surface-container-high opacity-50"></div>
          <div className="absolute inset-x-4 top-24 border-b border-surface-container-high opacity-50"></div>
          <div className="absolute inset-x-4 top-40 border-b border-surface-container-high opacity-50"></div>

          {/* Chart Visual SVG */}
          <svg
            className="w-full h-40 overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 500 120"
          >
            <defs>
              <linearGradient id="velocityFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#b12408" stopOpacity="0.25"></stop>
                <stop offset="100%" stopColor="#b12408" stopOpacity="0.0"></stop>
              </linearGradient>
            </defs>
            {/* Benchmark Line (Last Saturday: Grey dashed) */}
            <path
              d="M 0,105 Q 60,95 120,70 T 240,40 T 360,65 T 500,20"
              fill="none"
              opacity="0.6"
              stroke="#8f706a"
              strokeDasharray="4 4"
              strokeWidth="2"
            />
            {/* Today's Area Fill */}
            <path
              d="M 0,110 Q 55,90 120,65 T 250,25 T 375,55 T 450,15 L 450,120 L 0,120 Z"
              fill="url(#velocityFill)"
            />
            {/* Today's Solid Active Line */}
            <path
              d="M 0,110 Q 55,90 120,65 T 250,25 T 375,55 T 450,15"
              fill="none"
              stroke="#b12408"
              strokeLinecap="round"
              strokeWidth="3"
            />
            {/* Live Pulse Dot at present hour (450, 15) */}
            <circle cx="450" cy="15" fill="#b12408" r="5" />
            <circle
              className="animate-ping"
              cx="450"
              cy="15"
              fill="#b12408"
              opacity="0.4"
              r="9"
            />
          </svg>

          {/* Annotations inside chart canvas */}
          <div className="absolute top-10 left-1/3 -translate-x-6 bg-surface-container-lowest/90 backdrop-blur-md px-2 py-1 rounded-md shadow-xs pointer-events-none border border-surface-container-high/40">
            <span className="font-label-sm text-label-sm text-on-surface font-bold">
              Lunch Rush (13:30)
            </span>
          </div>

          <div className="absolute top-3 right-10 bg-primary text-on-primary px-2.5 py-1 rounded-md shadow-xs pointer-events-none">
            <span className="font-label-sm text-label-sm font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">thunderstorm</span>
              Monsoon Surge 19:00
            </span>
          </div>

          {/* X-Axis Labels */}
          <div className="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm mt-2 pt-2 border-t border-surface-container-high">
            <span>08:00</span>
            <span>11:00</span>
            <span>14:00 (Lunch)</span>
            <span>17:00</span>
            <span className="text-primary font-bold">20:00 (Live)</span>
            <span className="opacity-40">23:00</span>
          </div>
        </div>
      </div>

      {/* Chart Legend & Metadata */}
      <div className="flex items-center justify-between gap-space-md mt-space-md pt-space-sm border-t border-surface-container-high flex-wrap">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-primary"></span>
            <span className="font-body-sm text-body-sm text-on-surface font-semibold">
              Today (Live Ahmedabad)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-outline"></span>
            <span className="font-body-sm text-body-sm text-secondary">
              Last Saturday Baseline
            </span>
          </div>
        </div>
        <span className="font-label-sm text-label-sm text-tertiary font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">trending_up</span>
          Fleet velocity outperforming target by 14%
        </span>
      </div>
    </div>
  );
}
