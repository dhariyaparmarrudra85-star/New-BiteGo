import { useState } from "react";
import {
  Crosshair,
  Plus,
  Minus,
  UtensilsCrossed,
  Bike,
  Home,
  Compass,
} from "lucide-react";

export default function TrackingMap() {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isCentered, setIsCentered] = useState(true);
  const [showToast, setShowToast] = useState(false);

  const handleRecenter = () => {
    setIsCentered(true);
    setZoomLevel(1);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.15, 1.4));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.15, 0.85));
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-200/60 shadow-xl group">
      {/* Map Header Status Bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white text-xs font-bold shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-400">Live GPS Active</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-200">Sindhu Bhavan Road</span>
        </div>
      </div>

      {/* Map Floating Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleRecenter}
          title="Center on Rider"
          className="w-9 h-9 rounded-xl bg-white/95 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg border border-slate-200/80 transition-all hover:scale-105 active:scale-95"
        >
          <Crosshair className={`w-4 h-4 ${isCentered ? "text-orange-600" : "text-slate-700"}`} />
        </button>

        <div className="flex flex-col bg-white/95 rounded-xl shadow-lg border border-slate-200/80 overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom in"
            className="w-9 h-8 hover:bg-slate-100 text-slate-800 flex items-center justify-center border-b border-slate-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom out"
            className="w-9 h-8 hover:bg-slate-100 text-slate-800 flex items-center justify-center transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recenter Toast */}
      {showToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-orange-600 text-white text-xs font-bold shadow-xl animate-in fade-in zoom-in duration-200">
          Centered on Rajesh (EV Rider)
        </div>
      )}

      {/* Vector / SVG Map Canvas */}
      <div
        className="w-full h-[380px] sm:h-[440px] relative overflow-hidden transition-transform duration-300 select-none bg-[#0f172a]"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <svg
          viewBox="0 0 1000 600"
          className="w-full h-full object-cover"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern
              id="city-grid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="#1e293b"
                strokeWidth="1"
              />
            </pattern>

            {/* Linear gradient for active route */}
            <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="60%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Glowing filter for rider beacon */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background grid representing city blocks */}
          <rect width="1000" height="600" fill="#090d16" />
          <rect width="1000" height="600" fill="url(#city-grid)" opacity="0.7" />

          {/* Secondary streets */}
          <g stroke="#1e293b" strokeWidth="8" strokeLinecap="round" opacity="0.6">
            <line x1="80" y1="120" x2="920" y2="120" />
            <line x1="120" y1="260" x2="880" y2="260" />
            <line x1="60" y1="420" x2="940" y2="420" />
            <line x1="180" y1="50" x2="180" y2="550" />
            <line x1="420" y1="50" x2="420" y2="550" />
            <line x1="720" y1="50" x2="720" y2="550" />
            <line x1="860" y1="50" x2="860" y2="550" />
          </g>

          {/* Major Roads (Ahmedabad) */}
          {/* SG Highway (Curved major arterial) */}
          <path
            d="M 120 540 Q 380 340 750 90"
            fill="none"
            stroke="#334155"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M 120 540 Q 380 340 750 90"
            fill="none"
            stroke="#475569"
            strokeWidth="3"
            strokeDasharray="10 8"
          />

          {/* Sindhu Bhavan Road (Horizontal diagonal arterial) */}
          <path
            d="M 220 380 L 820 310"
            fill="none"
            stroke="#334155"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Bodakdev Inner Ring Connection */}
          <path
            d="M 320 180 L 620 480"
            fill="none"
            stroke="#334155"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Road Name Labels on Map */}
          <text
            x="390"
            y="265"
            fill="#64748b"
            fontSize="12"
            fontWeight="bold"
            letterSpacing="2"
            transform="rotate(-30 390 265)"
          >
            S.G. HIGHWAY
          </text>

          <text
            x="510"
            y="330"
            fill="#64748b"
            fontSize="12"
            fontWeight="bold"
            letterSpacing="2"
            transform="rotate(-6 510 330)"
          >
            SINDHU BHAVAN ROAD
          </text>

          <text
            x="240"
            y="200"
            fill="#475569"
            fontSize="10"
            fontWeight="bold"
            letterSpacing="1"
          >
            BODAKDEV CIRCLE
          </text>

          {/* Active Delivery Route Polyline */}
          {/* 1. Completed Path (Restaurant -> Current Rider Location) */}
          <path
            d="M 240 220 Q 320 250 430 300 L 520 340"
            fill="none"
            stroke="#f97316"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 2. Remaining Path (Rider -> Customer Destination) with dash animation */}
          <path
            d="M 520 340 L 680 325 Q 740 335 790 380"
            fill="none"
            stroke="url(#route-gradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="8 6"
          />

          {/* Radius pulse around rider */}
          <circle cx="520" cy="340" r="36" fill="#ea580c" opacity="0.15">
            <animate
              attributeName="r"
              values="20;50;20"
              dur="2.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.3;0.05;0.3"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Landmark 1: Restaurant Marker (The Dark Roast, Bodakdev) */}
          <g transform="translate(240, 220)">
            <circle cx="0" cy="0" r="16" fill="#1e293b" stroke="#f97316" strokeWidth="3" />
            <circle cx="0" cy="0" r="7" fill="#f97316" />
          </g>

          {/* Landmark 2: Rider Marker (Rajesh - EV) */}
          <g transform="translate(520, 340)" filter="url(#glow)">
            <circle cx="0" cy="0" r="20" fill="#ea580c" stroke="#ffffff" strokeWidth="3" />
          </g>

          {/* Landmark 3: Customer Marker (Galaxy Heights) */}
          <g transform="translate(790, 380)">
            <circle cx="0" cy="0" r="18" fill="#10b981" stroke="#ffffff" strokeWidth="3" />
          </g>
        </svg>

        {/* Floating HTML Markers positioned accurately over SVG coordinates */}
        {/* Restaurant Pin Card */}
        <div
          className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: "24%", top: "34%" }}
        >
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-slate-700 shadow-xl flex items-center gap-2 mb-2 whitespace-nowrap">
            <div className="w-5 h-5 rounded-lg bg-orange-600 flex items-center justify-center text-white">
              <UtensilsCrossed className="w-3 h-3" />
            </div>
            <div>
              <p className="text-[11px] font-black text-white leading-none">
                The Dark Roast
              </p>
              <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                Bodakdev • Picked up
              </p>
            </div>
          </div>
        </div>

        {/* Rider Pin Card (Live Animated) */}
        <div
          className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: "52%", top: "54%" }}
        >
          <div className="bg-orange-600 text-white px-3 py-1.5 rounded-2xl border-2 border-white shadow-2xl flex items-center gap-2 mb-2 whitespace-nowrap animate-bounce">
            <div className="w-6 h-6 rounded-xl bg-white text-orange-600 flex items-center justify-center">
              <Bike className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-black text-white leading-none">
                Rajesh (EV)
              </p>
              <p className="text-[10px] text-orange-100 font-bold mt-0.5">
                6 mins away • 35 km/h
              </p>
            </div>
          </div>
        </div>

        {/* Destination Customer Pin Card */}
        <div
          className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: "79%", top: "61%" }}
        >
          <div className="bg-emerald-700 text-white px-3 py-1.5 rounded-xl border border-emerald-500 shadow-xl flex items-center gap-2 mb-2 whitespace-nowrap">
            <div className="w-5 h-5 rounded-lg bg-white text-emerald-700 flex items-center justify-center">
              <Home className="w-3 h-3" />
            </div>
            <div>
              <p className="text-[11px] font-black text-white leading-none">
                Ananya Sharma
              </p>
              <p className="text-[9px] text-emerald-100 font-semibold mt-0.5">
                402 Galaxy Heights
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Bottom Legend Bar */}
      <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
            Restaurant
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            Active Rider
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Your Location
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Compass className="w-3.5 h-3.5 text-slate-400" />
          <span>Bodakdev Sector 4 • SG Highway Zone</span>
        </div>
      </div>
    </div>
  );
}
