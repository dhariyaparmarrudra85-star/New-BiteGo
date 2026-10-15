import React from "react";

export default function KPIGrid({ stats, loading }) {
  const data = stats || {
    customers: 0,
    merchants: 0,
    deliveryPartners: 0,
    pendingMerchantApplications: 0,
    pendingDeliveryApplications: 0,
    orders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    revenue: 0,
  };

  const cards = [
    {
      id: "revenue",
      title: "Realized Net Revenue",
      value: `₹${Number(data.revenue || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      badge: "Real MongoDB",
      badgeColor: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
      icon: "payments",
      iconColor: "text-primary",
      meta: "Delivered & paid orders aggregated",
      borderAccent: "border-primary/20",
    },
    {
      id: "orders",
      title: "Total Platform Orders",
      value: Number(data.orders || 0).toLocaleString(),
      badge: `${Number(data.completedOrders || 0)} Completed`,
      badgeColor: "bg-emerald-100 text-emerald-800",
      icon: "receipt_long",
      iconColor: "text-tertiary",
      meta: `${Number(data.cancelledOrders || 0)} cancelled orders recorded`,
      borderAccent: "border-tertiary/20",
    },
    {
      id: "completed",
      title: "Completed Orders",
      value: Number(data.completedOrders || 0).toLocaleString(),
      badge: "Fulfilled",
      badgeColor: "bg-emerald-100 text-emerald-800",
      icon: "check_circle",
      iconColor: "text-emerald-600",
      meta: "DELIVERED lifecycle state reached",
      borderAccent: "border-emerald-500/20",
    },
    {
      id: "cancelled",
      title: "Cancelled Orders",
      value: Number(data.cancelledOrders || 0).toLocaleString(),
      badge: "Drop-off",
      badgeColor: "bg-error-container text-on-error-container",
      icon: "cancel",
      iconColor: "text-error",
      meta: "Terminal cancelled order state",
      borderAccent: "border-error/20",
    },
    {
      id: "customers",
      title: "Customers Base",
      value: Number(data.customers || 0).toLocaleString(),
      badge: "Active Patrons",
      badgeColor: "bg-blue-100 text-blue-800",
      icon: "person",
      iconColor: "text-blue-600",
      meta: "Registered consumer accounts",
      borderAccent: "border-blue-500/20",
    },
    {
      id: "merchants",
      title: "Merchants",
      value: Number(data.merchants || 0).toLocaleString(),
      badge: "Kitchen Partners",
      badgeColor: "bg-amber-100 text-amber-800",
      icon: "storefront",
      iconColor: "text-amber-600",
      meta: "Registered merchant accounts",
      borderAccent: "border-amber-500/20",
    },
    {
      id: "delivery",
      title: "Delivery Partners",
      value: Number(data.deliveryPartners || 0).toLocaleString(),
      badge: "Courier Fleet",
      badgeColor: "bg-purple-100 text-purple-800",
      icon: "two_wheeler",
      iconColor: "text-purple-600",
      meta: "Registered delivery fleet accounts",
      borderAccent: "border-purple-500/20",
    },
    {
      id: "pending_merchants",
      title: "Pending Merchant Apps",
      value: Number(data.pendingMerchantApplications || 0).toLocaleString(),
      badge: data.pendingMerchantApplications > 0 ? "Needs Review" : "Queue Clean",
      badgeColor:
        data.pendingMerchantApplications > 0
          ? "bg-amber-500 text-white font-bold"
          : "bg-surface-container-high text-on-surface-variant",
      icon: "pending_actions",
      iconColor: "text-amber-500",
      meta: "Awaiting legal/FSSAI verification",
      borderAccent:
        data.pendingMerchantApplications > 0 ? "border-amber-500/40" : "border-surface-container-high/40",
    },
    {
      id: "pending_delivery",
      title: "Pending Delivery Apps",
      value: Number(data.pendingDeliveryApplications || 0).toLocaleString(),
      badge: data.pendingDeliveryApplications > 0 ? "Awaiting Review" : "Queue Clean",
      badgeColor:
        data.pendingDeliveryApplications > 0
          ? "bg-purple-600 text-white font-bold"
          : "bg-surface-container-high text-on-surface-variant",
      icon: "assignment_late",
      iconColor: "text-purple-600",
      meta: "DL & RC documents verification queue",
      borderAccent:
        data.pendingDeliveryApplications > 0 ? "border-purple-500/40" : "border-surface-container-high/40",
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-space-md">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`bg-surface-container-lowest p-space-md rounded-2xl shadow-sm border ${card.borderAccent} flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden`}
        >
          {loading && (
            <div className="absolute inset-0 bg-surface/50 backdrop-blur-xs flex items-center justify-center z-10">
              <span className="material-symbols-outlined animate-spin text-primary text-[24px]">
                progress_activity
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-label-sm text-label-sm uppercase font-bold tracking-wider">
                {card.title}
              </span>
              <span className={`material-symbols-outlined text-[22px] ${card.iconColor}`}>
                {card.icon}
              </span>
            </div>

            <div className="flex items-baseline gap-space-xs mt-1">
              <span className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                {card.value}
              </span>
              <span
                className={`font-label-sm text-label-sm font-bold px-2 py-0.5 rounded-full ${card.badgeColor}`}
              >
                {card.badge}
              </span>
            </div>

            <p className="mt-2 text-on-surface-variant font-body-sm text-body-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 inline-block" />
              <span>{card.meta}</span>
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-surface-container-high/30 flex items-center justify-between text-xs text-on-surface-variant/80 font-medium">
            <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-tertiary">
              <span className="material-symbols-outlined text-[14px]">database</span>
              Real MongoDB Sync
            </span>
            <span className="text-[11px] font-mono text-secondary">LIVE</span>
          </div>
        </div>
      ))}
    </section>
  );
}
