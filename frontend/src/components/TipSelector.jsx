import { useState } from "react";
import { Heart, Sparkles } from "lucide-react";

export default function TipSelector({
  selectedTip = "30",
  onSelectTip = () => {},
}) {
  const [customTip, setCustomTip] = useState("");
  const [isCustomInputOpen, setIsCustomInputOpen] = useState(false);

  const tipOptions = [
    { id: "20", label: "₹20", value: "20" },
    { id: "30", label: "₹30", value: "30" },
    { id: "50", label: "₹50", value: "50" },
    { id: "other", label: "Other", value: "other" },
  ];

  const handleOptionClick = (opt) => {
    if (opt.value === "other") {
      setIsCustomInputOpen(true);
      onSelectTip("other");
    } else {
      setIsCustomInputOpen(false);
      onSelectTip(opt.value);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customTip && !isNaN(Number(customTip))) {
      onSelectTip(customTip);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-orange-600 fill-orange-600" />
          <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
            Tip Your Delivery Hero
          </h4>
        </div>
        <span className="text-[11px] font-bold text-slate-400">
          100% goes to Rajesh
        </span>
      </div>

      <p className="text-xs text-slate-500 font-medium">
        Show appreciation for fast EV delivery across Ahmedabad traffic.
      </p>

      {/* Tip Buttons Grid */}
      <div className="grid grid-cols-4 gap-2.5">
        {tipOptions.map((opt) => {
          const isSelected = selectedTip === opt.value;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleOptionClick(opt)}
              className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                isSelected
                  ? "bg-gradient-to-tr from-orange-600 to-amber-600 text-white border-orange-600 shadow-lg shadow-orange-600/25 scale-[1.03]"
                  : "bg-slate-50 hover:bg-orange-50/60 text-slate-700 hover:text-orange-600 border-slate-200/80 hover:border-orange-200"
              }`}
            >
              <span>{opt.label}</span>
              {isSelected && (
                <span className="text-[9px] font-bold text-orange-100 uppercase tracking-wider">
                  Added
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Tip Input (if "Other" clicked) */}
      {isCustomInputOpen && (
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 pt-1 animate-in fade-in duration-200">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
              ₹
            </span>
            <input
              type="number"
              min="1"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              placeholder="Enter amount"
              className="w-full text-xs pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-orange-500 font-bold"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors"
          >
            Apply
          </button>
        </form>
      )}

      {selectedTip && selectedTip !== "0" && (
        <div className="pt-1 flex items-center justify-between text-xs text-emerald-700 font-bold bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>₹{selectedTip} rider tip will be credited directly</span>
          </span>
          <button
            type="button"
            onClick={() => {
              onSelectTip("0");
              setIsCustomInputOpen(false);
            }}
            className="text-[11px] text-slate-400 hover:text-rose-600 font-medium underline"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
