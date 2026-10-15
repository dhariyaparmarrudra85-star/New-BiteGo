import { useState } from "react";
import {
  BarChart3,
  Award,
  AlertTriangle,
  Flame,
} from "lucide-react";

export default function AnalyticsSection() {
  const [timeRange, setTimeRange] = useState("today");

  const hourlyData = [
    { hour: "11 AM", orders: 6, revenue: 1620, height: "25%" },
    { hour: "12 PM", orders: 18, revenue: 4860, height: "65%" },
    { hour: "1 PM", orders: 24, revenue: 6480, height: "85%" },
    { hour: "2 PM", orders: 16, revenue: 4320, height: "55%" },
    { hour: "3 PM", orders: 8, revenue: 2160, height: "30%" },
    { hour: "4 PM", orders: 5, revenue: 1350, height: "20%" },
    { hour: "5 PM", orders: 9, revenue: 2430, height: "35%" },
    { hour: "6 PM", orders: 14, revenue: 3780, height: "50%" },
    { hour: "7 PM", orders: 28, revenue: 7560, height: "100%", isPeak: true },
    { hour: "8 PM", orders: 26, revenue: 7020, height: "92%", isPeak: true },
    { hour: "9 PM", orders: 20, revenue: 5400, height: "70%" },
    { hour: "10 PM", orders: 11, revenue: 2970, height: "40%" },
  ];

  const [topDishes, setTopDishes] = useState([
    {
      id: 1,
      name: "Truffle Mushroom Pizza",
      category: "Pizza",
      unitsSold: 48,
      price: 480,
      revenue: 23040,
      inStock: true,
    },
    {
      id: 2,
      name: "Cheesy Garlic Breadsticks",
      category: "Sides",
      unitsSold: 62,
      price: 120,
      revenue: 14880,
      inStock: true,
    },
    {
      id: 3,
      name: "Woodfired Margherita",
      category: "Pizza",
      unitsSold: 35,
      price: 320,
      revenue: 11200,
      inStock: true,
    },
    {
      id: 4,
      name: "Mango Mint Cooler",
      category: "Beverages",
      unitsSold: 42,
      price: 130,
      revenue: 5460,
      inStock: true,
    },
    {
      id: 5,
      name: "Penne Alfredo Bianco",
      category: "Pasta",
      unitsSold: 24,
      price: 360,
      revenue: 8640,
      inStock: false,
    },
  ]);

  const toggleStock = (id) => {
    setTopDishes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, inStock: !d.inStock } : d))
    );
  };

  return (
    <section className="space-y-8">
      {/* Analytics Header & Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-600" />
            <span>Revenue &amp; Kitchen Performance</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Hourly rush distribution, top culinary creators &amp; inventory health
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
          {["today", "week", "month"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${
                timeRange === r
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {r === "today" ? "Today (Live)" : r === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Grid: Hourly Chart & Top Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Hourly Rush Distribution Visual Chart */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-orange-600">
                Peak Hour Radar
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Today’s Order Volume Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dinner rush accounted for 64% of total daily volume
              </p>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-slate-900">
                ₹38,450
              </span>
              <span className="text-xs font-bold text-emerald-600 block">
                +14.2% Growth
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-6">
            <div className="h-52 flex items-end justify-between gap-1.5 sm:gap-2 px-2 border-b border-slate-200">
              {hourlyData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip on Hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg">
                    {d.orders} Orders • ₹{d.revenue}
                  </div>

                  {/* Bar */}
                  <div className="w-full flex justify-center h-full items-end">
                    <div
                      className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 group-hover:scale-y-105 ${
                        d.isPeak
                          ? "bg-gradient-to-t from-orange-600 to-amber-500 shadow-md shadow-orange-500/30"
                          : "bg-slate-200 hover:bg-orange-300"
                      }`}
                      style={{ height: d.height }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between text-[10px] text-slate-400 font-bold pt-2 px-2">
              <span>11 AM</span>
              <span>1 PM (Lunch)</span>
              <span>4 PM</span>
              <span className="text-orange-600 font-black">7-8 PM (Peak Dinner)</span>
              <span>10 PM</span>
            </div>
          </div>

          {/* Chart Insight Footer */}
          <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/80 flex items-center justify-between text-xs text-orange-950 font-bold">
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-600 fill-orange-600" />
              <span>Highest hourly throughput: 28 tickets between 7:00 PM – 8:00 PM</span>
            </span>
            <span className="text-orange-700 font-black">Avg 17m Prep</span>
          </div>
        </div>

        {/* Right: Top Selling Dishes with Quick Stock Toggle */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-black text-slate-900">
                Top Menu Performers
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400">
              Units Sold
            </span>
          </div>

          <div className="space-y-3">
            {topDishes.map((dish, idx) => (
              <div
                key={dish.id}
                className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-orange-200 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-white shadow-xs text-slate-900 font-black flex items-center justify-center flex-shrink-0 text-xs">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-slate-900 truncate">
                      {dish.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      ₹{dish.price} • ₹{dish.revenue.toLocaleString()} earned
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="text-xs font-black text-slate-900">
                    {dish.unitsSold} sold
                  </span>

                  {/* In Stock / Sold Out Toggle Button */}
                  <button
                    type="button"
                    onClick={() => toggleStock(dish.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black transition-colors cursor-pointer ${
                      dish.inStock
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                    }`}
                  >
                    {dish.inStock ? "In Stock" : "Sold Out"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Low Inventory Alert Card */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-black text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Inventory Notification</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
              Fresh Buffalo Mozzarella is running low (&lt;2 kg left). Estimated to exhaust by 9:30 PM shift.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
