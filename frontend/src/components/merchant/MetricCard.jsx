import { TrendingUp, TrendingDown } from "lucide-react";

export default function MetricCard({
  title = "Metric",
  value = "0",
  change = "+0%",
  isPositive = true,
  subtitle = "vs yesterday",
  icon: Icon,
  colorScheme = "orange",
}) {
  const colorMap = {
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-600",
      border: "border-orange-100",
      pill: "bg-orange-100 text-orange-800",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
      pill: "bg-emerald-100 text-emerald-800",
    },
    sky: {
      bg: "bg-sky-50",
      text: "text-sky-600",
      border: "border-sky-100",
      pill: "bg-sky-100 text-sky-800",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-100",
      pill: "bg-amber-100 text-amber-800",
    },
  };

  const scheme = colorMap[colorScheme] || colorMap.orange;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-all flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            {value}
          </h3>
        </div>

        {Icon && (
          <div
            className={`w-12 h-12 rounded-2xl ${scheme.bg} ${scheme.text} flex items-center justify-center flex-shrink-0 shadow-xs border ${scheme.border}`}
          >
            <Icon className="w-6 h-6 stroke-[2]" />
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold">
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[11px] font-black ${
              isPositive
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3 stroke-[2.5]" />
            ) : (
              <TrendingDown className="w-3 h-3 stroke-[2.5]" />
            )}
            {change}
          </span>
          <span className="text-slate-400 font-medium">{subtitle}</span>
        </div>
      </div>
    </div>
  );
}
