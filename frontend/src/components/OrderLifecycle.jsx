import { Check, Bike, Circle, AlertCircle } from "lucide-react";

export default function OrderLifecycle({
  currentStatus = "OUT_FOR_DELIVERY",
  timeline = [],
  restaurantName = "The Dark Roast Pizzeria",
  courierName = "Rajesh Vaghela",
}) {
  const isCancelled = currentStatus === "CANCELLED";

  const getTimelineTime = (statusKey, defaultTime) => {
    if (!Array.isArray(timeline)) return defaultTime;
    const item = timeline.find(
      (t) => t?.status?.toUpperCase() === statusKey?.toUpperCase()
    );
    if (!item?.timestamp) return defaultTime;
    try {
      return new Date(item.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return defaultTime;
    }
  };

  const getStageStatus = (stageIndex) => {
    if (isCancelled) return "pending";

    // If delivered, all stages are completed
    if (currentStatus === "DELIVERED") {
      return "completed";
    }

    // Determine the active stage index based on current orderStatus
    let activeStageIndex = 1;
    switch (currentStatus) {
      case "PLACED":
        activeStageIndex = 1;
        break;
      case "CONFIRMED":
        activeStageIndex = 3;
        break;
      case "PREPARING":
        activeStageIndex = 4;
        break;
      case "READY_FOR_PICKUP":
      case "ready_for_pickup":
      case "READY":
      case "ready":
      case "READY_AT_COUNTER":
      case "Ready at Counter":
        activeStageIndex = 5;
        break;
      case "ASSIGNED":
      case "ACCEPTED":
        // Delivery agent accepted -> Stage 6 is completed, Stage 7 (Pickup from kitchen) is active
        activeStageIndex = 7;
        break;
      case "PICKED_UP":
      case "OUT_FOR_DELIVERY":
        // Food collected from kitchen -> Stage 7 is completed, Stage 8 (Out for delivery) is active
        activeStageIndex = 8;
        break;
      default:
        activeStageIndex = 1;
    }

    if (stageIndex < activeStageIndex) return "completed";
    if (stageIndex === activeStageIndex) return "active";
    return "pending";
  };

  const stages = [
    {
      id: 1,
      title: "Order Placed",
      time: getTimelineTime("PLACED", "Confirmed"),
      status: getStageStatus(1),
      description: "Order received and forwarded to kitchen",
    },
    {
      id: 2,
      title: "Payment Confirmed",
      time: getTimelineTime("PLACED", "Verified"),
      status: getStageStatus(2),
      description: "Verified via Instant Gateway",
    },
    {
      id: 3,
      title: "Restaurant Accepted",
      time: getTimelineTime("CONFIRMED", "Confirmed"),
      status: getStageStatus(3),
      description: `${restaurantName} confirmed kitchen order ticket`,
    },
    {
      id: 4,
      title: "Food Preparing",
      time: getTimelineTime("PREPARING", "In Kitchen"),
      status: getStageStatus(4),
      description: "Chef baking and seasoning dishes to perfection",
    },
    {
      id: 5,
      title: "Ready for Pickup",
      time: getTimelineTime("READY_FOR_PICKUP", "Packed Hot"),
      status: getStageStatus(5),
      description: "Packed hot in insulated BiteGo thermal box",
    },
    {
      id: 6,
      title: "Delivery Agent Assigned",
      time: getTimelineTime("ACCEPTED", getTimelineTime("ASSIGNED", "Dispatched")),
      status: getStageStatus(6),
      description: courierName
        ? `${courierName} assigned for express transit`
        : "Courier pilot assigned for express transit",
    },
    {
      id: 7,
      title: "Picked Up from Kitchen",
      time: getTimelineTime("PICKED_UP", "In Transit"),
      status: getStageStatus(7),
      description: "Courier picked parcel from restaurant dispatch counter",
    },
    {
      id: 8,
      title: "Out for Delivery",
      time: getTimelineTime("OUT_FOR_DELIVERY", "Live Transit"),
      status: getStageStatus(8),
      description: "Fast transit on SG Highway • Heading towards your dropoff",
    },
    {
      id: 9,
      title: "Delivered",
      time: getTimelineTime("DELIVERED", "Doorstep"),
      status: getStageStatus(9),
      description: "Safe & contactless handover confirmed with OTP",
    },
  ];

  const completedCount = stages.filter((s) => s.status === "completed").length;
  const totalCount = stages.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)]">
      {/* Header & Progress Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse" />
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Order Lifecycle
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time stage tracking from kitchen oven to your doorstep
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200/80">
          <div className="text-right">
            <p className="text-xs font-black text-slate-900 leading-tight">
              {completedCount} of {totalCount} Completed
            </p>
            <p className="text-[10px] text-emerald-600 font-bold">
              {progressPercentage}% Completed
            </p>
          </div>
          <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 9-Stage Timeline */}
      <div className="pt-6 relative">
        <div className="space-y-4">
          {stages.map((stage, idx) => {
            const isCompleted = stage.status === "completed";
            const isActive = stage.status === "active";
            const isPending = stage.status === "pending";
            const isLast = idx === stages.length - 1;

            return (
              <div key={stage.id} className="relative flex items-start gap-4 group">
                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={`absolute left-[17px] top-9 w-0.5 h-[calc(100%-14px)] -z-0 transition-colors ${
                      isCompleted ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                )}

                {/* Node Icon Indicator */}
                <div className="relative z-10 flex-shrink-0 mt-0.5">
                  {isCompleted && (
                    <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}

                  {isActive && (
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-600/30 ring-4 ring-orange-100 animate-pulse">
                        <Bike className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </div>
                  )}

                  {isPending && (
                    <div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-slate-200 text-slate-400 flex items-center justify-center">
                      <Circle className="w-3.5 h-3.5 stroke-[2]" />
                    </div>
                  )}
                </div>

                {/* Content Box */}
                <div
                  className={`flex-1 p-3.5 sm:p-4 rounded-2xl transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-orange-50/90 to-amber-50/60 border-2 border-orange-400/80 shadow-md shadow-orange-500/10"
                      : isCompleted
                      ? "bg-white hover:bg-slate-50/60 border border-slate-100"
                      : "bg-slate-50/40 border border-dashed border-slate-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm sm:text-base font-extrabold ${
                          isActive
                            ? "text-orange-950"
                            : isCompleted
                            ? "text-slate-900"
                            : "text-slate-400"
                        }`}
                      >
                        {stage.title}
                      </h4>

                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-black uppercase tracking-wider animate-bounce">
                          Active Now
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-xs font-bold ${
                        isActive
                          ? "text-orange-700"
                          : isCompleted
                          ? "text-slate-500"
                          : "text-slate-400"
                      }`}
                    >
                      {stage.time}
                    </span>
                  </div>

                  <p
                    className={`text-xs mt-1 font-medium leading-relaxed ${
                      isActive
                        ? "text-orange-900/90 font-semibold"
                        : isCompleted
                        ? "text-slate-500"
                        : "text-slate-400"
                    }`}
                  >
                    {stage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
