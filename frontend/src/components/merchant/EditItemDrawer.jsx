import { useState } from "react";

export default function EditItemDrawer({
  isOpen = false,
  onClose = () => {},
  editingItem = null,
  onSave = () => {},
}) {
  const [formData, setFormData] = useState(() => ({
    name: editingItem?.name || "",
    category: editingItem?.category || "Neapolitan Pizzas",
    isVeg: editingItem?.isVeg ?? true,
    price: editingItem?.price || 480,
    packingFee: 15,
    prepTime: 14,
    spiceLevel: "Spicy 1/3 (Mild Warm)",
    description: editingItem?.description || "Thin crust, fresh thyme, mozzarella, black truffle oil glaze",
    autoRestore: true,
    image: editingItem?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuB1Q16TmWnm4dncCyDuBz6JDTLTW0MvUJzI_VRuqhqaBELE_IVmb5KQ88WSt4Tr3rEnNEYjzhCUuO2GLL1eI-9WkAI8BPyCc6hpz-NKxcfPMUvMU04X6Vg9xlKL8RlStQZrPixrDPQEeOrBbDnkVG5lu9ELvJMKO6JvkN_OO8glf_KtDLjzA-q0mcP1mFELUHdxV1zPuFYF9GBvPvj4LIQrqaXGn237NXSenhW2Wkjx",
  }));

  const [prevItem, setPrevItem] = useState(editingItem);
  if (editingItem !== prevItem) {
    setPrevItem(editingItem);
    setFormData({
      name: editingItem?.name || "",
      category: editingItem?.category || "Neapolitan Pizzas",
      isVeg: editingItem?.isVeg ?? true,
      price: editingItem?.price || (editingItem ? 0 : 350),
      packingFee: 15,
      prepTime: 14,
      spiceLevel: "Spicy 1/3 (Mild Warm)",
      description: editingItem?.description || "",
      autoRestore: true,
      image: editingItem?.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80",
    });
  }

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="w-full xl:w-[420px] bg-white rounded-xl shadow-lg border border-slate-200/80 flex flex-col p-6 transition-all duration-300 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#b12408] text-[24px]">
            stylus_note
          </span>
          <h2 className="text-lg font-bold text-[#151c27]">
            {editingItem ? `Edit: ${formData.name}` : "Add Food Item"}
          </h2>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-1 text-slate-400 hover:text-[#151c27] rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#151c27] uppercase tracking-wider font-bold">
            Food Item Name
          </label>
          <input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="h-11 px-3 bg-[#f0f3ff] rounded-lg text-sm text-[#151c27] focus:outline-none border border-slate-200/80"
            type="text"
          />
        </div>

        {/* Category & Diet Tag */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#151c27] uppercase tracking-wider font-bold">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="h-11 px-2.5 bg-[#f0f3ff] rounded-lg text-xs text-[#151c27] focus:outline-none border border-slate-200/80 cursor-pointer font-semibold"
            >
              <option>Neapolitan Pizzas</option>
              <option>Starters &amp; Sides</option>
              <option>Artisanal Pastas</option>
              <option>Beverages</option>
              <option>Desserts</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#151c27] uppercase tracking-wider font-bold">
              Dietary Tag
            </label>
            <div className="flex items-center gap-3 h-11 bg-[#f0f3ff] px-3 rounded-lg border border-slate-200/80">
              <label className="flex items-center gap-1.5 font-bold cursor-pointer text-[#151c27]">
                <input
                  type="radio"
                  name="diet"
                  checked={formData.isVeg}
                  onChange={() => setFormData({ ...formData, isVeg: true })}
                  className="accent-[#006947]"
                />
                Veg
              </label>
              <label className="flex items-center gap-1.5 font-bold cursor-pointer text-[#151c27]">
                <input
                  type="radio"
                  name="diet"
                  checked={!formData.isVeg}
                  onChange={() => setFormData({ ...formData, isVeg: false })}
                  className="accent-[#b12408]"
                />
                Non-Veg
              </label>
            </div>
          </div>
        </div>

        {/* Price & Packaging */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#151c27] uppercase tracking-wider font-bold">
              Base Price (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                ₹
              </span>
              <input
                required
                type="number"
                step="5"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                className="w-full h-11 pl-7 pr-3 bg-[#f0f3ff] rounded-lg text-xs font-bold text-[#151c27] focus:outline-none border border-slate-200/80"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#151c27] uppercase tracking-wider font-bold">
              Packing Fee (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                value={formData.packingFee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    packingFee: Number(e.target.value),
                  })
                }
                className="w-full h-11 pl-7 pr-3 bg-[#f0f3ff] rounded-lg text-xs font-bold text-[#151c27] focus:outline-none border border-slate-200/80"
              />
            </div>
          </div>
        </div>

        {/* Prep Time & Spice Level */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#151c27] uppercase tracking-wider font-bold">
              Est. Prep Time
            </label>
            <div className="flex items-center bg-[#f0f3ff] h-11 px-3 rounded-lg text-[#151c27] gap-1 border border-slate-200/80">
              <span className="material-symbols-outlined text-[16px] text-slate-400">
                timer
              </span>
              <input
                type="number"
                value={formData.prepTime}
                onChange={(e) =>
                  setFormData({ ...formData, prepTime: Number(e.target.value) })
                }
                className="w-12 bg-transparent text-center font-bold focus:outline-none"
              />
              <span>mins</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#151c27] uppercase tracking-wider font-bold">
              Spice Level
            </label>
            <select
              value={formData.spiceLevel}
              onChange={(e) =>
                setFormData({ ...formData, spiceLevel: e.target.value })
              }
              className="h-11 px-2.5 bg-[#f0f3ff] rounded-lg text-xs text-[#151c27] focus:outline-none border border-slate-200/80 font-semibold cursor-pointer"
            >
              <option>Mild / No Chili</option>
              <option>Spicy 1/3 (Mild Warm)</option>
              <option>Spicy 2/3 (Fire Kick)</option>
              <option>Spicy 3/3 (Ghost Chili)</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#151c27] uppercase tracking-wider font-bold">
            Item Description (Customer View)
          </label>
          <textarea
            rows="2"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="p-2.5 bg-[#f0f3ff] rounded-lg text-xs text-[#151c27] focus:outline-none resize-none border border-slate-200/80"
          />
        </div>

        {/* Dish Media Preview */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#151c27] uppercase tracking-wider font-bold">
            Dish Media
          </label>
          <div className="flex items-center gap-3 bg-[#f0f3ff] p-2 rounded-xl border border-slate-200/80">
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 shadow-xs">
              <img
                src={
                  formData.image ||
                  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80"
                }
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-xs font-bold text-[#151c27] truncate">
                truffle_pizza_v2.webp
              </span>
              <span className="text-[11px] text-slate-400">
                1.4 MB • 1200x800px
              </span>
              <div className="flex items-center gap-2 mt-1 font-bold">
                <button
                  type="button"
                  onClick={() => alert("Upload media dialog")}
                  className="text-[#b12408] hover:underline cursor-pointer"
                >
                  Change
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image: "" })}
                  className="text-rose-600 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Auto Restore Tomorrow Toggle */}
        <div className="p-3 bg-[#f0f3ff] rounded-xl flex items-center justify-between border border-slate-200/80">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#151c27]">
              Auto-Restore Tomorrow
            </span>
            <span className="text-[11px] text-slate-500">
              Switch on at next opening (11:00 AM)
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.autoRestore}
              onChange={(e) =>
                setFormData({ ...formData, autoRestore: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#006947]" />
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 bg-[#f0f3ff] hover:bg-slate-200 text-[#151c27] font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 h-11 bg-[#b12408] hover:bg-[#b12408]/90 text-white font-bold rounded-xl shadow-md shadow-[#b12408]/20 transition-opacity cursor-pointer active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
