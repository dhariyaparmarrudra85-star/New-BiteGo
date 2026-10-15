import React, { useState, useMemo } from "react";
import { X, Plus, Minus, Star, Sparkles, Check } from "lucide-react";

export default function DishCustomizationModal({
  isOpen = false,
  onClose = () => {},
  dish = null,
  onConfirm = () => {},
}) {
  const customizationGroups = dish?.customizationGroups || [
    {
      name: "Size",
      type: "radio",
      required: true,
      options: [
        { name: "Regular (8 inch)", price: 0 },
        { name: "Medium (10 inch)", price: 120 },
        { name: "Large (12 inch)", price: 240 },
      ],
    },
    {
      name: "Crust Selection",
      type: "radio",
      required: false,
      options: [
        { name: "Traditional Hand Tossed", price: 0 },
        { name: "Cheese Burst", price: 80 },
        { name: "Thin & Crispy Wheat", price: 40 },
      ],
    },
    {
      name: "Extra Toppings & Add-ons",
      type: "checkbox",
      required: false,
      options: [
        { name: "Extra Fresh Mozzarella", price: 60 },
        { name: "Gourmet Black Olives", price: 40 },
        { name: "Pickled Jalapenos", price: 30 },
      ],
    },
  ];

  // Initialize selections with default required radio options
  const [selectedRadio, setSelectedRadio] = useState(() => {
    const initial = {};
    customizationGroups.forEach((group) => {
      if (group.type === "radio" && group.options.length > 0) {
        initial[group.name] = group.options[0];
      }
    });
    return initial;
  });

  const [selectedCheckboxes, setSelectedCheckboxes] = useState({});
  const [quantity, setQuantity] = useState(1);

  // Toggle radio option
  const handleRadioChange = (groupName, option) => {
    setSelectedRadio((prev) => ({
      ...prev,
      [groupName]: option,
    }));
  };

  // Toggle checkbox option
  const handleCheckboxToggle = (groupName, option) => {
    const key = `${groupName}_${option.name}`;
    setSelectedCheckboxes((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = { group: groupName, ...option };
      }
      return next;
    });
  };

  const calculatedUnitPrice = useMemo(() => {
    let price = Number(dish?.price) || 0;
    // Add radio selections
    Object.values(selectedRadio).forEach((opt) => {
      if (opt && opt.price) price += Number(opt.price);
    });
    // Add checkbox selections
    Object.values(selectedCheckboxes).forEach((opt) => {
      if (opt && opt.price) price += Number(opt.price);
    });
    return price;
  }, [dish?.price, selectedRadio, selectedCheckboxes]);

  if (!isOpen || !dish) return null;

  const finalTotal = calculatedUnitPrice * quantity;

  const handleAdd = () => {
    const customizations = [
      ...Object.entries(selectedRadio).map(([group, opt]) => ({
        group,
        name: opt.name,
        price: opt.price,
      })),
      ...Object.values(selectedCheckboxes).map((opt) => ({
        group: opt.group,
        name: opt.name,
        price: opt.price,
      })),
    ];

    onConfirm(dish, customizations, quantity);
    onClose();
  };

  const isVeg = dish.isVeg !== undefined ? dish.isVeg : dish.type === "Veg";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-100 flex flex-col max-h-[90vh]">
          {/* Header Image & Close */}
          <div className="relative h-48 sm:h-56 w-full bg-slate-100 shrink-0">
            <img
              src={dish.image}
              alt={dish.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center transition-all shadow-md cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title & Dietary Overlay */}
            <div className="absolute bottom-4 left-5 right-5 text-white">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-4 h-4 rounded-sm bg-white flex items-center justify-center border ${
                    isVeg ? "border-emerald-600" : "border-rose-600"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isVeg ? "bg-emerald-600" : "bg-rose-600"
                    }`}
                  />
                </div>
                {dish.rating && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-xs font-black">
                    <Star className="w-3 h-3 fill-slate-950" />
                    {dish.rating}
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {dish.name}
              </h3>
              <p className="text-xs text-slate-200 line-clamp-1 mt-0.5">
                {dish.description || `Specialty by ${dish.restaurant || "BiteGo Master Kitchen"}`}
              </p>
            </div>
          </div>

          {/* Customization Options (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-800 no-scrollbar">
            {customizationGroups.map((group) => {
              const isRadio = group.type === "radio";

              return (
                <div key={group.name} className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                      {group.name}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {isRadio ? (group.required ? "Required • 1 Option" : "Choose 1") : "Optional • Multi-select"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.options.map((opt) => {
                      const isSelected = isRadio
                        ? selectedRadio[group.name]?.name === opt.name
                        : Boolean(selectedCheckboxes[`${group.name}_${opt.name}`]);

                      return (
                        <div
                          key={opt.name}
                          onClick={() =>
                            isRadio
                              ? handleRadioChange(group.name, opt)
                              : handleCheckboxToggle(group.name, opt)
                          }
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-orange-50/80 border-orange-500 shadow-xs"
                              : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/70"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                                isSelected
                                  ? "bg-orange-600 border-orange-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className="text-sm font-bold text-slate-900">
                              {opt.name}
                            </span>
                          </div>

                          <span className="text-xs font-black text-slate-700">
                            {opt.price === 0 ? "Included" : `+₹${opt.price}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Bar: Quantity & Add CTA */}
          <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
            {/* Quantity Picker */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-2xl px-2 py-1.5 shadow-xs">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-xl bg-white text-slate-700 hover:text-orange-600 hover:bg-orange-50 flex items-center justify-center transition-colors shadow-xs"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-black text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-7 h-7 rounded-xl bg-white text-slate-700 hover:text-orange-600 hover:bg-orange-50 flex items-center justify-center transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add to Feast Button */}
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-orange-600/30 flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span>Add to Feast</span>
              <span className="bg-black/20 px-3 py-1 rounded-xl text-xs sm:text-sm font-black">
                ₹{finalTotal.toFixed(2)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
