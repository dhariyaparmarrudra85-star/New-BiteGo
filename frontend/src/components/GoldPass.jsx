import React from "react";
import { Crown, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";

export default function GoldPass() {
  return (
    <section className="w-full py-10 md:py-14 bg-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-[#151c27] text-white p-6 sm:p-10 lg:p-12 border border-slate-700">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-5">
              {/* Gold Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-semibold uppercase tracking-wider">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>BiteGo Gold Pass</span>
              </div>

              {/* Heading */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                Zero Delivery Fees on Every Order Above{" "}
                <span className="text-amber-400">₹199</span>
              </h2>

              {/* Description */}
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                Join 40,000+ Ahmedabad foodies enjoying unlimited free delivery,
                exclusive 30% off partner dine-in discounts, and VIP rush-hour priority.
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => alert("Welcome to BiteGo Gold 30-Day Free Trial!")}
                  className="px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#151c27] font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Start 30-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-sm text-slate-400">
                  Then ₹49/month · Cancel anytime
                </p>
              </div>
            </div>

            {/* Right Column: Benefits Card */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-sm bg-white/10 border border-white/15 rounded-xl p-5 sm:p-6 space-y-4">
                {/* Savings */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-semibold text-amber-300 tracking-wider">
                      Verified Benefit
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      Avg Savings: ₹450/mo
                    </h3>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-300">
                    <span>Member Satisfaction</span>
                    <span className="text-amber-400">94%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full w-[94%]" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Over 94% members renew monthly
                  </p>
                </div>

                {/* Perks */}
                <div className="pt-3 border-t border-white/10 space-y-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Free delivery on 500+ Ahmedabad restaurants</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>No surge fee during rush hours</span>
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
