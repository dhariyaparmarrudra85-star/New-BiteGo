import React from "react";

export default function ClusterDensity({ onActionToast }) {
  const clusters = [
    {
      id: "bodakdev",
      name: "Bodakdev & Sindhu Bhavan",
      colorDot: "bg-primary",
      badge: "1.4x Surge",
      badgeClass: "bg-primary-fixed text-on-primary-fixed-variant",
      orders: "1,840 orders (38% vol)",
      riders: "420 riders • 98% busy",
      barClass: "bg-primary",
      percentage: "38%",
    },
    {
      id: "vastrapur",
      name: "Vastrapur & IIM Campus",
      colorDot: "bg-tertiary",
      badge: "1.2x Surge",
      badgeClass: "bg-surface-container-high text-on-surface",
      orders: "1,220 orders (25% vol)",
      riders: "310 riders • 91% busy",
      barClass: "bg-tertiary",
      percentage: "25%",
    },
    {
      id: "navrangpura",
      name: "Navrangpura & CG Road",
      colorDot: "bg-secondary",
      badge: "Normal Tariff",
      badgeClass: "bg-surface-container-high text-secondary",
      orders: "1,110 orders (23% vol)",
      riders: "290 riders • 85% busy",
      barClass: "bg-secondary",
      percentage: "23%",
    },
    {
      id: "prahladnagar",
      name: "Prahlad Nagar & SG Highway",
      colorDot: "bg-secondary-fixed-dim",
      badge: "Normal Tariff",
      badgeClass: "bg-surface-container-high text-secondary",
      orders: "722 orders (14% vol)",
      riders: "210 riders • 74% busy",
      barClass: "bg-secondary-container",
      percentage: "14%",
    },
  ];

  return (
    <div className="lg:col-span-5 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/40 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-space-md">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
              Cluster Order Density
            </h2>
            <p className="font-body-sm text-body-sm text-secondary mt-0.5">
              Ahmedabad micro-zones &amp; fleet saturation
            </p>
          </div>
          <span className="material-symbols-outlined text-secondary text-[24px]">
            hub
          </span>
        </div>

        {/* Cluster list */}
        <div className="space-y-space-sm">
          {clusters.map((cluster) => (
            <div
              key={cluster.id}
              className="p-space-sm bg-surface-container-low rounded-xl border border-surface-container-high/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${cluster.colorDot}`}></span>
                  <span className="font-label-lg text-label-lg font-bold text-on-surface">
                    {cluster.name}
                  </span>
                </div>
                <span
                  className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold ${cluster.badgeClass}`}
                >
                  {cluster.badge}
                </span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant font-body-sm text-body-sm mt-1">
                <span>{cluster.orders}</span>
                <span className="font-semibold text-on-surface">{cluster.riders}</span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className={`${cluster.barClass} h-2 rounded-full transition-all duration-500`}
                  style={{ width: cluster.percentage }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Geo Summary Badge */}
      <div className="bg-surface-container-high/60 p-space-sm rounded-xl mt-space-md flex items-center justify-between border border-surface-container-high/50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">
            radar
          </span>
          <span className="font-label-sm text-label-sm text-on-surface font-semibold">
            Bodakdev rain grid active: 14 EV swap points open
          </span>
        </div>
        <button
          onClick={() =>
            onActionToast &&
            onActionToast("Switching to Ahmedabad live cluster fleet map")
          }
          className="font-label-sm text-label-sm text-primary font-bold hover:underline cursor-pointer"
          type="button"
        >
          Fleet Map →
        </button>
      </div>
    </div>
  );
}
