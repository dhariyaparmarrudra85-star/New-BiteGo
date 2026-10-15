export default function MenuTable({
  items = [],
  onToggleStatus = () => {},
  onEditItem = () => {},
  onDuplicateItem = () => {},
  onArchiveItem = () => {},
}) {
  return (
    <div className="w-full bg-white rounded-xl shadow-xs border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f0f3ff] text-slate-600 text-[11px] font-bold uppercase tracking-wider h-12 border-b border-slate-200/60">
              <th className="px-6 py-2">Dish &amp; Description</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Base Price</th>
              <th className="px-3 py-2">Customizations</th>
              <th className="px-3 py-2">Performance</th>
              <th className="px-6 py-2 text-center">Live Availability</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[#151c27] text-xs divide-y divide-slate-100">
            {items.map((item) => {
              const isInStock = item.inStock;

              return (
                <tr
                  key={item.id}
                  className={`transition-colors group ${
                    isInStock
                      ? "hover:bg-[#f0f3ff]"
                      : "bg-[#f0f3ff]/40 hover:bg-[#f0f3ff]"
                  }`}
                >
                  {/* Dish & Description */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-xs border border-slate-100 ${
                          !isInStock ? "opacity-60" : ""
                        }`}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-1 left-1 bg-white/95 px-1 py-0.5 rounded text-[9px] font-bold text-[#151c27] shadow-xs">
                          {item.code}
                        </span>
                      </div>

                      <div className="flex flex-col min-w-0 max-w-sm">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Veg / Non-Veg Tag */}
                          {item.isVeg ? (
                            <span
                              className="w-3.5 h-3.5 rounded-xs bg-[#6ffbbe] flex items-center justify-center p-0.5 shrink-0"
                              title="Pure Veg"
                            >
                              <span className="w-2 h-2 rounded-full bg-[#006947]" />
                            </span>
                          ) : (
                            <span
                              className="w-3.5 h-3.5 rounded-xs bg-[#ffdad6] flex items-center justify-center p-0.5 shrink-0"
                              title="Non-Veg"
                            >
                              <span className="w-2 h-2 rounded-full bg-[#ba1a1a]" />
                            </span>
                          )}

                          <span
                            className={`text-sm font-bold truncate ${
                              !isInStock ? "text-slate-600 line-through" : "text-[#151c27]"
                            }`}
                          >
                            {item.name}
                          </span>

                          {/* Badge tag */}
                          {item.badge && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                item.badge === "Best Seller"
                                  ? "bg-[#ffdad3] text-[#8e1500]"
                                  : item.badge === "High Margin"
                                  ? "bg-[#dce2f7] text-[#404758]"
                                  : item.badge === "Chef Special"
                                  ? "bg-[#6ffbbe] text-[#005236]"
                                  : item.badge === "Out of Stock"
                                  ? "bg-[#ffdad6] text-[#93000a]"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>

                        {/* Description or warning */}
                        {item.warning ? (
                          <p className="text-[#ba1a1a] text-xs font-semibold truncate mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">
                              warning
                            </span>
                            <span>{item.warning}</span>
                          </p>
                        ) : (
                          <p className="text-slate-500 text-xs truncate mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <span className="bg-[#e7eefe] px-2.5 py-1 rounded-lg text-xs font-semibold text-[#151c27]">
                      {item.category}
                    </span>
                  </td>

                  {/* Base Price */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#151c27]">
                        ₹{item.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Incl. 5% GST
                      </span>
                    </div>
                  </td>

                  {/* Customizations */}
                  <td className="px-3 py-3.5">
                    <span className="bg-[#e2e8f8] px-2 py-1 rounded text-xs font-medium text-[#151c27]">
                      {item.customizations}
                    </span>
                  </td>

                  {/* Performance */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#006947] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          star
                        </span>{" "}
                        {item.rating} ({item.ratingCount})
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {item.ordersMetric}
                      </span>
                    </div>
                  </td>

                  {/* Live Availability Toggle */}
                  <td className="px-6 py-3.5 text-center whitespace-nowrap">
                    <div className="inline-flex flex-col items-center gap-1">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          checked={isInStock}
                          onChange={() => onToggleStatus(item.id)}
                          className="sr-only peer"
                          type="checkbox"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006947]" />
                      </label>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider ${
                          isInStock ? "text-[#006947]" : "text-[#ba1a1a]"
                        }`}
                      >
                        {isInStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEditItem(item)}
                        className="p-2 text-slate-500 hover:text-[#b12408] hover:bg-[#e7eefe] rounded-lg transition-colors cursor-pointer"
                        title="Edit Item"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          edit
                        </span>
                      </button>
                      <button
                        onClick={() => onDuplicateItem(item)}
                        className="p-2 text-slate-500 hover:text-[#151c27] hover:bg-[#e7eefe] rounded-lg transition-colors cursor-pointer"
                        title="Duplicate Dish"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          content_copy
                        </span>
                      </button>
                      <button
                        onClick={() => onArchiveItem(item)}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Archive Dish"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          archive
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      <div className="p-4 bg-[#f0f3ff] flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-600 text-xs border-t border-slate-200/60">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-[#151c27]">1 - {items.length}</strong> of{" "}
            <strong className="text-[#151c27]">38</strong> culinary items
          </span>
          <span className="bg-[#e7eefe] px-2 py-0.5 rounded text-[11px] font-mono text-[#151c27]">
            Synced with BiteGo KDS 10s ago
          </span>
        </div>
        <div className="flex items-center gap-1 font-semibold">
          <button
            type="button"
            className="px-3 py-1.5 bg-white text-[#151c27] rounded-lg shadow-xs text-xs disabled:opacity-50 cursor-pointer"
            disabled
          >
            Previous
          </button>
          <button
            type="button"
            className="px-3 py-1.5 bg-[#b12408] text-white rounded-lg text-xs font-bold"
          >
            1
          </button>
          <button
            type="button"
            className="px-3 py-1.5 bg-white text-[#151c27] rounded-lg shadow-xs text-xs hover:bg-[#e7eefe] cursor-pointer"
          >
            2
          </button>
          <button
            type="button"
            className="px-3 py-1.5 bg-white text-[#151c27] rounded-lg shadow-xs text-xs hover:bg-[#e7eefe] cursor-pointer"
          >
            3
          </button>
          <button
            type="button"
            className="px-3 py-1.5 bg-white text-[#151c27] rounded-lg shadow-xs text-xs hover:bg-[#e7eefe] cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
