import React from "react";
import { Store, Home, MapPin, CheckCircle2 } from "lucide-react";

export default function LocationDetails({ order = null }) {
  const restaurantName = order?.restaurant?.name || "The Dark Roast Pizzeria";
  const restaurantArea = (order?.restaurant?.address && typeof order.restaurant.address === "object" ? order.restaurant.address.area : order?.restaurant?.address) || "Bodakdev, Ahmedabad";
  const orderNumber = order?.orderNumber || "89421";

  const customerName = order?.deliveryAddress?.fullName || "Ananya Sharma";
  const deliveryAddress = order?.deliveryAddress ? 
    `${order.deliveryAddress.houseFlat || ""}, ${order.deliveryAddress.area || ""}, ${order.deliveryAddress.city || "Ahmedabad"}` :
    "402 Galaxy Heights, Sindhu Bhavan Road, Bodakdev";
  const instructions = order?.deliveryInstructions || "Leave package with security desk";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
      {/* Pickup Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 shadow-xs">
          <Store className="w-6 h-6 stroke-[2]" />
        </div>
        <div className="space-y-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Pickup From</span>
          </span>
          <h4 className="text-base font-extrabold text-slate-900 leading-tight">
            {restaurantName}
          </h4>
          <p className="text-xs text-slate-500 font-medium">
            {restaurantArea} • Kitchen Order #{orderNumber}
          </p>
          <div className="pt-1.5 flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Verified Partner Kitchen</span>
          </div>
        </div>
      </div>

      {/* Delivery Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-xs">
          <Home className="w-6 h-6 stroke-[2]" />
        </div>
        <div className="space-y-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-600" />
            <span>Delivering To</span>
          </span>
          <h4 className="text-base font-extrabold text-slate-900 leading-tight">
            {customerName}
          </h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {deliveryAddress}
          </p>
          <div className="pt-1.5 flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <span>Instructions: {instructions}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
