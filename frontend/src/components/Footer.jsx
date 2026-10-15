import React from "react";
import { Heart, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-slate-950 text-slate-400 border-t border-slate-900 pt-16 pb-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-900">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-600/30">
                <span className="text-xl">🔥</span>
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Bite<span className="text-orange-500">Go</span>
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-300">
              Food Delivery &amp; Logistics
            </p>

            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Serving the finest culinary experiences across Ahmedabad. From heritage Gujarati feasts to midnight wood-fired pizzas, delivered hot and fresh in under 24 minutes.
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span>Bodakdev, Navrangpura, SG Highway &amp; Prahlad Nagar</span>
            </div>
          </div>

          {/* Navigation & Legal Links */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-4">
                Quick Links
              </h4>
              <ul className="space-y-2.5 text-xs font-medium">
                <li>
                  <a href="#" className="hover:text-orange-400 transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#restaurants-section" className="hover:text-orange-400 transition-colors">
                    Popular Restaurants
                  </a>
                </li>
                <li>
                  <a href="#offers" className="hover:text-orange-400 transition-colors">
                    Special Offers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-400 transition-colors">
                    BiteGo Gold Pass
                  </a>
                </li>
              </ul>
            </div>

            {/* Company & Support */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-4">
                Company
              </h4>
              <ul className="space-y-2.5 text-xs font-medium">
                <li>
                  <a href="#support" className="hover:text-orange-400 transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#partner" className="hover:text-orange-400 transition-colors">
                    Partner with us
                  </a>
                </li>
                <li>
                  <a href="#privacy" className="hover:text-orange-400 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#terms" className="hover:text-orange-400 transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            {/* Delivery Hours */}
            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-4">
                Operating Hours
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Open 24/7 in Ahmedabad
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Kitchen Network</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2025 BiteGo Technologies Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Crafted with <Heart className="w-3.5 h-3.5 text-orange-500 fill-orange-500" /> for Ahmedabad Food Lovers
          </p>
        </div>
      </div>
    </footer>
  );
}
