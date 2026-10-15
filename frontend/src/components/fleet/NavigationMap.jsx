import React, { useState } from "react";

export default function NavigationMap({
  onShowToast = () => {},
}) {
  const [audioMuted, setAudioMuted] = useState(false);

  const handleRecenter = () => {
    onShowToast("GPS HUD recentered on SG Flyover exit (34 km/h)");
  };

  const handleToggleAudio = () => {
    const next = !audioMuted;
    setAudioMuted(next);
    onShowToast(
      next
        ? "Voice Guidance Muted"
        : "Voice Guidance Enabled: Gujarati & English"
    );
  };

  return (
    <div className="flex flex-col gap-4 font-sans">
      {/* Interactive Navigation Map Canvas */}
      <div className="relative w-full h-[620px] rounded-2xl overflow-hidden bg-inverse-surface shadow-md select-none flex flex-col justify-between p-4 border border-slate-800">
        {/* Synthesized Detailed Vector Road Grid Ahmedabad (SG Highway / Bodakdev) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 700 620"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b12408" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#d53d21" stopOpacity="1" />
            </linearGradient>
            <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <pattern
              id="gridSub"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                opacity="0.35"
                stroke="#3b4455"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>

          {/* Land & Base Surface */}
          <rect width="100%" height="100%" fill="#1a202c" />
          <rect width="100%" height="100%" fill="url(#gridSub)" />

          {/* Green Zones / Urban Parks Bodakdev */}
          <path
            d="M 40,80 Q 90,60 140,110 T 110,210 T 30,170 Z"
            fill="#133326"
            opacity="0.6"
          />
          <path
            d="M 520,380 Q 590,340 660,400 T 630,520 T 500,470 Z"
            fill="#133326"
            opacity="0.6"
          />

          {/* Major Arteries Ahmedabad SG Highway Grid */}
          {/* SG Highway Central Axis */}
          <line x1="80" y1="0" x2="380" y2="620" stroke="#374151" strokeWidth="26" />
          <line x1="80" y1="0" x2="380" y2="620" stroke="#4b5563" strokeWidth="16" />
          <line
            x1="80"
            y1="0"
            x2="380"
            y2="620"
            stroke="#9ca3af"
            strokeDasharray="8,10"
            strokeWidth="1.5"
          />

          {/* Sindhu Bhavan Marg Cross-connector */}
          <line x1="0" y1="360" x2="700" y2="280" stroke="#374151" strokeWidth="22" />
          <line x1="0" y1="360" x2="700" y2="280" stroke="#4b5563" strokeWidth="14" />
          <line
            x1="0"
            y1="360"
            x2="700"
            y2="280"
            stroke="#9ca3af"
            strokeDasharray="6,8"
            strokeWidth="1.5"
          />

          {/* Bodakdev Inner Avenues */}
          <line x1="120" y1="120" x2="680" y2="120" stroke="#2d3748" strokeWidth="10" />
          <line x1="280" y1="0" x2="280" y2="620" stroke="#2d3748" strokeWidth="8" />
          <line x1="480" y1="40" x2="480" y2="620" stroke="#2d3748" strokeWidth="10" />
          <line x1="0" y1="490" x2="700" y2="490" stroke="#2d3748" strokeWidth="8" />

          {/* Passed Path (Restaurant Bodakdev to Flyover) */}
          <path
            d="M 180,95 L 180,240 L 235,320"
            fill="none"
            opacity="0.75"
            stroke="#4edea3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="6"
          />

          {/* Active Live Route Trail (Orange #d53d21) */}
          <path
            d="M 235,320 L 260,355 L 430,320 L 480,312 L 540,240"
            fill="none"
            filter="url(#neonBlur)"
            stroke="#d53d21"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="12"
          />
          <path
            d="M 235,320 L 260,355 L 430,320 L 480,312 L 540,240"
            fill="none"
            stroke="#fffbff"
            strokeDasharray="10,12"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />

          {/* Waypoint 1: The Dark Roast Pizzeria (Origin) */}
          <circle cx="180" cy="95" r="14" fill="#00855b" />
          <circle cx="180" cy="95" r="7" fill="#ffffff" />

          {/* Waypoint 2: Live Ather 450X EV Rider Pulse */}
          <circle cx="235" cy="320" r="32" fill="#d53d21" opacity="0.25">
            <animate
              attributeName="r"
              dur="2s"
              repeatCount="indefinite"
              values="24;38;24"
            />
            <animate
              attributeName="opacity"
              dur="2s"
              repeatCount="indefinite"
              values="0.4;0.05;0.4"
            />
          </circle>
          <circle cx="235" cy="320" r="18" fill="#d53d21" />
          <circle cx="235" cy="320" r="14" fill="#ffffff" />
          <circle cx="235" cy="320" r="6" fill="#b12408" />

          {/* Waypoint 3: Customer Galaxy Heights (Destination) */}
          <circle cx="540" cy="240" r="18" fill="#b12408" />
          <circle cx="540" cy="240" r="7" fill="#ffffff" />
        </svg>

        {/* TOP HUD Overlay: Dynamic Turn-by-Turn Card */}
        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-3 bg-inverse-surface/95 backdrop-blur-md p-4 rounded-xl shadow-lg text-inverse-on-surface border border-slate-700/60">
          <div className="flex items-center gap-3">
            {/* Big Direction Indicator */}
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[32px] sm:text-[36px]">
                turn_right
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold text-inverse-on-surface">
                  In 250m
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface text-[11px] font-bold">
                  Lane 2 of 4
                </span>
              </div>
              <span className="text-sm sm:text-base text-inverse-on-surface/90 font-medium">
                Turn Right onto <strong className="text-primary-fixed font-bold">Sindhu Bhavan Marg</strong>
              </span>
              <span className="text-xs text-inverse-on-surface/60">
                Then continuous straight for 650m toward Galaxy Heights
              </span>
            </div>
          </div>

          {/* Live Speedometer HUD */}
          <div className="flex items-center gap-3 bg-inverse-surface/80 px-4 py-2 rounded-xl border border-slate-700/40 shrink-0 self-end md:self-auto">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-tertiary-fixed leading-none">
                34
              </span>
              <span className="text-[10px] text-inverse-on-surface/70 uppercase font-bold tracking-wider">
                km/h
              </span>
            </div>
            <div className="flex flex-col justify-center border-l border-slate-700/60 pl-2.5">
              <span className="text-xs text-tertiary-fixed font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">speed</span>
                Ather 450X
              </span>
              <span className="text-[11px] text-inverse-on-surface/60 font-medium">
                Limit: 40 km/h
              </span>
            </div>
          </div>
        </div>

        {/* Over-Map Floating Waypoint Annotations */}
        {/* Origin Badge */}
        <div className="relative z-10 hidden sm:flex items-center gap-2 bg-surface-container-lowest/95 backdrop-blur-md text-on-surface px-3 py-1.5 rounded-xl shadow-md w-fit absolute top-28 left-40 border border-slate-200/60">
          <span className="w-2.5 h-2.5 rounded-full bg-tertiary shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-tight">The Dark Roast Pizzeria</span>
            <span className="text-[11px] text-tertiary font-medium">Order picked up • 7:32 PM</span>
          </div>
        </div>

        {/* Rider Live Position Pin Overlay */}
        <div className="relative z-10 flex items-center gap-2 bg-primary text-on-primary px-3 py-1.5 rounded-xl shadow-lg w-fit absolute top-[365px] left-12 sm:left-16 border border-white/20">
          <span className="material-symbols-outlined text-[16px] animate-spin">
            electric_moped
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-tight">You (Rajesh) • Flyover Exit</span>
            <span className="text-[11px] text-on-primary/80 font-medium">Heading West 285°</span>
          </div>
        </div>

        {/* Destination Pin Overlay */}
        <div className="relative z-10 flex items-center gap-2 bg-surface-container-lowest/95 backdrop-blur-md text-on-surface px-3 py-1.5 rounded-xl shadow-md w-fit absolute top-48 right-12 sm:right-16 border border-slate-200/60">
          <span className="material-symbols-outlined text-primary text-[18px]">
            home_pin
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-tight text-on-surface">Galaxy Heights (Drop-off)</span>
            <span className="text-[11px] text-on-surface-variant font-medium">Flat 402, Tower B</span>
          </div>
        </div>

        {/* BOTTOM HUD: Map Controls, Audio Toggle, Traffic Banner */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-2">
          {/* Traffic Status */}
          <div className="flex items-center gap-2 bg-inverse-surface/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-inverse-on-surface border border-slate-700/50">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed animate-ping" />
            <span className="text-xs font-semibold">Normal Traffic</span>
            <span className="text-inverse-on-surface/50 text-xs">•</span>
            <span className="text-xs text-inverse-on-surface/80">SG Flyover clean clearance</span>
          </div>

          {/* Controls cluster */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="recenterBtn"
              onClick={handleRecenter}
              className="h-10 px-3.5 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer border border-slate-200/80"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">
                my_location
              </span>
              <span>Recenter</span>
            </button>

            <button
              type="button"
              id="muteAudioBtn"
              onClick={handleToggleAudio}
              className="h-10 w-10 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer border border-slate-200/80"
              aria-label={audioMuted ? "Unmute voice guidance" : "Mute voice guidance"}
            >
              <span className="material-symbols-outlined text-[20px]">
                {audioMuted ? "volume_off" : "volume_up"}
              </span>
            </button>

            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-3.5 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container text-xs font-bold flex items-center gap-1.5 shadow-md transition-all border border-slate-200/80"
            >
              <span className="material-symbols-outlined text-[18px]">
                open_in_new
              </span>
              <span>Google Maps</span>
            </a>
          </div>
        </div>
      </div>

      {/* Live EV Fleet Battery & Trip Telemetry Strip (4 cards) */}
      <div className="w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: EV Battery */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">
              battery_charging_90
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
              EV Battery
            </span>
            <span className="text-lg font-bold text-on-surface leading-tight">
              78%
            </span>
            <span className="text-xs text-tertiary font-semibold">
              68 km safe range
            </span>
          </div>
        </div>

        {/* Card 2: Trip Elapsed */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">
              timer
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
              Trip Elapsed
            </span>
            <span className="text-lg font-bold text-on-surface leading-tight">
              11m 40s
            </span>
            <span className="text-xs text-on-surface-variant font-medium">
              Ahead of SLA by +3m
            </span>
          </div>
        </div>

        {/* Card 3: Remaining */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px] text-primary">
              distance
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
              Remaining
            </span>
            <span className="text-lg font-bold text-on-surface leading-tight">
              1.2 km
            </span>
            <span className="text-xs text-on-surface-variant font-medium">
              Total route 3.8 km
            </span>
          </div>
        </div>

        {/* Card 4: Safety Shield */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px] text-tertiary">
              security
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
              Safety Shield
            </span>
            <span className="text-lg font-bold text-tertiary leading-tight">
              Active
            </span>
            <span className="text-xs text-on-surface-variant font-medium">
              Helmet verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
