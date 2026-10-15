import React from "react";

export default function OrderChecklist({ items: initialItems }) {
  const defaultItems = [
    {
      qty: "1x",
      name: "Truffle Mushroom Pizza (11\")",
      note: "Hot bag • Steam vent checked",
    },
    {
      qty: "2x",
      name: "Cheesy Garlic Breadsticks",
      note: "Warm compartment",
    },
    {
      qty: "1x",
      name: "Mango Mint Cooler (Chilled)",
      note: "Thermal cold pouch separator",
    },
  ];

  const items = (initialItems && initialItems.length > 0)
    ? initialItems.map(it => ({
        qty: `${it.quantity || 1}x`,
        name: it.name || it.food?.name || "Kitchen Item",
        note: `₹${((it.price || 0) * (it.quantity || 1)).toFixed(2)} • Inspected`,
      }))
    : defaultItems;

  return (
    <div className="w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-tertiary">
            inventory_2
          </span>
          <span className="text-base font-bold text-on-surface">
            Order Checklist ({items.length}/{items.length} Items)
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">verified</span>
          Bag Sealed
        </span>
      </div>

      {/* Item Checklist */}
      <div className="space-y-2 mt-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-surface-container-low flex items-center justify-between border border-slate-100/70"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-surface-container-highest text-on-surface font-bold flex items-center justify-center text-xs shrink-0">
                {item.qty}
              </span>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-semibold text-on-surface">
                  {item.name}
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium">
                  {item.note}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0">
              check_circle
            </span>
          </div>
        ))}
      </div>

      {/* Safety Hologram Seal Notice */}
      <div className="mt-3 p-2.5 rounded-xl bg-surface-container-low flex items-center justify-between border border-slate-100/70 text-xs">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-tertiary">
            qr_code_scanner
          </span>
          <span className="text-on-surface font-medium">
            BiteGo Tamper Seal #BG-SEAL-8942
          </span>
        </div>
        <span className="text-[11px] text-tertiary font-bold">
          Verified at Restaurant
        </span>
      </div>
    </div>
  );
}
