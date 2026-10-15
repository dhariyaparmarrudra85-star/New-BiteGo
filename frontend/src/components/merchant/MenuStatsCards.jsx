export default function MenuStatsCards({
  liveCount = 36,
  totalCount = 38,
  outOfStockCount = 2,
  discountsCount = 8,
  customizerCount = 19,
}) {
  const stats = [
    {
      title: "Live & Serving",
      value: liveCount,
      subtext: `/ ${totalCount} dishes`,
      icon: "check_circle",
      iconBg: "bg-[#6ffbbe]",
      iconColor: "text-[#005236]",
      valueColor: "text-[#006947]",
    },
    {
      title: "Marked Out Of Stock",
      value: outOfStockCount,
      subtext: "requiring restock",
      icon: "production_quantity_limits",
      iconBg: "bg-[#ffdad6]",
      iconColor: "text-[#93000a]",
      valueColor: "text-[#ba1a1a]",
    },
    {
      title: "Discounts Active",
      value: discountsCount,
      subtext: "flash deals live",
      icon: "percent",
      iconBg: "bg-[#ffdad3]",
      iconColor: "text-[#8e1500]",
      valueColor: "text-[#b12408]",
    },
    {
      title: "Customizer Groups",
      value: customizerCount,
      subtext: "variations linked",
      icon: "tune",
      iconBg: "bg-[#d9dff5]",
      iconColor: "text-[#5c6274]",
      valueColor: "text-[#151c27]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s, idx) => (
        <div
          key={idx}
          className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-slate-100 flex items-center justify-between"
        >
          <div className="flex flex-col">
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              {s.title}
            </span>
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 ${s.valueColor}`}>
              {s.value}{" "}
              <span className="text-xs font-normal text-slate-500">
                {s.subtext}
              </span>
            </span>
          </div>
          <div
            className={`w-12 h-12 rounded-xl ${s.iconBg} ${s.iconColor} flex items-center justify-center shrink-0 shadow-xs`}
          >
            <span className="material-symbols-outlined text-[24px]">
              {s.icon}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
