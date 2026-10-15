import React from "react";
import { Crown, Sparkles, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";

export default function GoldPass() {
  return (
    <section className="w-full py-12 md:py-16 bg-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/90 text-white p-8 sm:p-12 lg:p-14 overflow-hidden shadow-2xl shadow-slate-950/30 border border-amber-500/20">
          {/* Subtle gold decorative glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Heading, description, CTA */}
            <div className="lg:col-span-7 space-y-6">
              {/* Gold Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-black tracking-wider uppercase shadow-xs">
                <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>BITEGO GOLD PASS</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </div>

              {/* Heading */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Zero Delivery Fees on Every Order Above{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200">
                  ₹199
                </span>
              </h2>

              {/* Description */}
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
                Join 40,000+ Ahmedabad foodies enjoying unlimited free delivery,
                exclusive 30% off partner dine-in discounts, and VIP rush-hour priority.
              </p>

              {/* Action Button & Disclaimer */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => alert("🎉 Welcome to BiteGo Gold 30-Day Free Trial!")}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:via-orange-400 hover:to-amber-400 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <span>Start 30-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>

                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  Then ₹49/month • Cancel anytime
                </p>
              </div>
            </div>

            {/* Right Column: Savings & Membership Card */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
                {/* Savings Header */}
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-400/20">
                    <TrendingUp className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold text-amber-300 tracking-wider">
                      Verified Member Benefit
                    </span>
                    <h3 className="text-xl font-black text-white">
                      Avg Savings: ₹450/mo
                    </h3>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>Member Satisfaction</span>
                    <span className="text-amber-400">94%</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full w-[94%]" />
                  </div>
                  <p className="text-xs text-slate-400 font-medium pt-1">
                    Over 94% members renew monthly
                  </p>
                </div>

                {/* Perks Checklist */}
                <div className="pt-3 border-t border-white/10 space-y-2 text-xs font-semibold text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Free delivery on 500+ top Ahmedabad restaurants</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>No surge fee during monsoon &amp; rush hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
