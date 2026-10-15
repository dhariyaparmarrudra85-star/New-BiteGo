import { useState } from "react";
import { Share2, Check, Navigation } from "lucide-react";

export default function RouteStats() {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="w-full bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-orange-600 flex-shrink-0" />
          <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
            Transit Route: Via SG Highway &amp; Sindhu Bhavan Marg
          </h4>
        </div>
        <p className="text-xs text-slate-500 font-medium flex items-center gap-2 pl-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Smooth traffic</span>
          <span className="text-slate-300">•</span>
          <span>Rider observing speed restrictions (&lt;45 km/h)</span>
        </p>
      </div>

      <div className="flex-shrink-0 self-start sm:self-auto">
        <button
          type="button"
          onClick={handleShare}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
            copied
              ? "bg-emerald-600 text-white"
              : "bg-white hover:bg-orange-50 text-slate-800 hover:text-orange-600 border border-slate-200 hover:border-orange-200"
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-white stroke-[2.5]" />
              <span>Trip Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Share Live Trip</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
