import React from "react";

export default function RestaurantFilterToolbar({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}) {
  const filterTabs = [
    {
      id: "all",
      label: "All Outlets",
      count: "842",
      countBadge: "bg-surface-container-high text-on-surface",
    },
    {
      id: "pending",
      label: "Pending Verification",
      count: "3",
      countBadge: "bg-error-container text-on-error-container font-bold",
    },
    {
      id: "active",
      label: "Active & Serving",
      count: "812",
      countBadge: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
    },
    {
      id: "paused",
      label: "Temporarily Paused",
      count: "18",
      countBadge: "bg-surface-container-highest text-on-surface-variant",
    },
    {
      id: "suspended",
      label: "Suspended",
      count: "9",
      countBadge: "bg-error-container text-on-error-container",
    },
  ];

  return (
    <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-xs border border-surface-container-high/40 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-space-sm">
      {/* Segmented Status Filters */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-container-low rounded-xl border border-surface-container-high/30">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? "bg-surface-container-lowest text-on-surface shadow-xs font-bold"
                  : "text-on-surface-variant hover:text-on-surface font-semibold"
              }`}
              type="button"
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${tab.countBadge}`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick Search input within list */}
      <div className="relative min-w-[320px]">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
          filter_alt
        </span>
        <input
          className="w-full h-10 pl-9 pr-4 rounded-lg bg-surface-container-low text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest border border-transparent focus:border-primary/30 transition-all"
          placeholder="Filter by outlet name, FSSAI ID, phone, GSTIN..."
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
