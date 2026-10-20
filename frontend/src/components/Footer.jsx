import React from "react";
import { MapPin } from "lucide-react";
import BiteGoLogo from "./BiteGoLogo";

export default function Footer() {
  return (
    <footer className="w-full bg-[#151c27] text-slate-400 border-t border-slate-800 pt-12 pb-8">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-800">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <BiteGoLogo size={30} />
              <span className="text-xl font-bold tracking-tight text-white">
                Bite<span className="text-[#b12408]">Go</span>
              </span>
            </div>

            <p className="text-sm text-slate-300">
              Food Delivery & Logistics
            </p>

            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Serving the finest culinary experiences across Ahmedabad. From heritage Gujarati feasts to midnight wood-fired pizzas, delivered hot and fresh in under 24 minutes.
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <MapPin className="w-3.5 h-3.5 text-[#b12408]" />
              <span>Bodakdev, Navrangpura, SG Highway & Prahlad Nagar</span>
            </div>
          </div>

          {/* Navigation & Legal Links */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6">
            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Quick Links
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-[#b12408] transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#restaurants-section" className="hover:text-[#b12408] transition-colors">
                    Popular Restaurants
                  </a>
                </li>
                <li>
                  <a href="#offers" className="hover:text-[#b12408] transition-colors">
                    Special Offers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#b12408] transition-colors">
                    BiteGo Gold Pass
                  </a>
                </li>
              </ul>
            </div>

            {/* Company & Support */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Company
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#support" className="hover:text-[#b12408] transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#partner" className="hover:text-[#b12408] transition-colors">
                    Partner with us
                  </a>
                </li>
                <li>
                  <a href="#privacy" className="hover:text-[#b12408] transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#terms" className="hover:text-[#b12408] transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            {/* Delivery Hours */}
            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Operating Hours
              </h4>
              <p className="text-sm text-slate-400">
                Open 24/7 in Ahmedabad
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-[#006947] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006947]" />
                <span>Kitchens Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© 2025 BiteGo Technologies Inc. All rights reserved.</p>
          <p>Crafted for Ahmedabad Food Lovers</p>
        </div>
      </div>
    </footer>
  );
}
