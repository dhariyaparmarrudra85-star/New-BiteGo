import { useState } from "react";
import OrderCard from "./OrderCard";
import { Flame, CheckCircle2, Bike, Filter, AlertTriangle } from "lucide-react";

export default function KitchenPipeline({
  orders = [],
  onAdvanceOrder = () => {},
  onDeclineOrder = () => {},
  searchQuery = "",
}) {
  const [activePipelineFilter, setActivePipelineFilter] = useState("all");

  const filteredOrders = orders.filter((o) => {
    // Pipeline stage filter
    if (activePipelineFilter !== "all" && o.status !== activePipelineFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchCustomer = o.customerName.toLowerCase().includes(q);
      const matchItem = o.items.some((item) =>
        item.name.toLowerCase().includes(q)
      );
      return matchNum || matchCustomer || matchItem;
    }
    return true;
  });

  const incomingOrders = orders.filter((o) => o.status === "incoming");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const outOrders = orders.filter((o) => o.status === "out");

  const pipelineStages = [
    {
      id: "all",
      label: "All Active",
      count: orders.length,
      icon: Filter,
    },
    {
      id: "incoming",
      label: "Needs Acceptance",
      count: incomingOrders.length,
      icon: AlertTriangle,
      badgeColor: "bg-orange-600 text-white",
    },
    {
      id: "preparing",
      label: "In Oven / Prep",
      count: preparingOrders.length,
      icon: Flame,
      badgeColor: "bg-amber-500 text-white",
    },
    {
      id: "ready",
      label: "Ready for Pickup",
      count: readyOrders.length,
      icon: CheckCircle2,
      badgeColor: "bg-emerald-600 text-white",
    },
    {
      id: "out",
      label: "Out with Rider",
      count: outOrders.length,
      icon: Bike,
      badgeColor: "bg-sky-600 text-white",
    },
  ];

  return (
    <section className="space-y-6">
      {/* Pipeline Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-600 fill-orange-600" />
            <span>Kitchen Display System (KDS)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage live ticket queue, oven timers &amp; rider handovers in real time
          </p>
        </div>

        {/* Stage Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-slate-100 rounded-2xl">
          {pipelineStages.map((stage) => {
            const isActive = activePipelineFilter === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActivePipelineFilter(stage.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>{stage.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                      ? stage.badgeColor || "bg-orange-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {stage.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-extrabold text-slate-800">
            No orders in this stage
          </h4>
          <p className="text-xs text-slate-500">
            All caught up! Orders will appear here as customers place requests.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusAdvance={onAdvanceOrder}
              onDecline={onDeclineOrder}
            />
          ))}
        </div>
      )}
    </section>
  );
}
