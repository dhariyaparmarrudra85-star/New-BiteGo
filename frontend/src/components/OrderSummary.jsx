import { useState } from "react";
import {
  Receipt,
  Download,
  HelpCircle,
  MessageSquareText,
  CheckCircle,
  Tag,
  RotateCcw,
  Ban,
} from "lucide-react";

export default function OrderSummary({
  order = null,
  tipAmount = "0",
  onCancelOrder = null,
  onReorder = null,
}) {
  const [downloading, setDownloading] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [dropNote, setDropNote] = useState(order?.deliveryInstructions || "Leave at security desk");

  const defaultItems = [
    {
      id: 1,
      quantity: 1,
      name: "Truffle Mushroom Pizza",
      description: "Thin crust, fresh thyme, mozzarella",
      price: 480.0,
      isVeg: true,
    },
    {
      id: 2,
      quantity: 2,
      name: "Cheesy Garlic Breadsticks",
      description: "Served with warm marinara dip",
      price: 240.0,
      isVeg: true,
    },
    {
      id: 3,
      quantity: 1,
      name: "Mango Mint Cooler",
      description: "350ml chilled bottle",
      price: 130.0,
      isVeg: true,
    },
  ];

  const items = order?.items && order.items.length > 0 ? order.items : defaultItems;

  const itemSubtotal = order ? (order.subtotal || 0) : 850.0;
  const taxesAndPackaging = order ? (order.tax || 0) + (order.platformFee || 0) : 42.5;
  const couponDiscount = order ? (order.discount || 0) : 100.0;
  const couponCode = order?.coupon?.code || "BITEGOLD";
  const tipNumeric = order ? (order.tip || 0) : (Number(tipAmount) || 0);
  const deliveryFee = order ? (order.deliveryFee || 0) : 0;
  const grandTotal = order ? (order.totalAmount || 0) : (itemSubtotal + taxesAndPackaging - couponDiscount + tipNumeric);

  const paymentMethodLabel = order?.paymentMethod === "cod" ? "Cash on Delivery" : order?.paymentMethod === "card" ? "Credit / Debit Card" : "UPI (Google Pay / PhonePe)";
  const isPaid = order ? order.paymentStatus === "completed" : true;
  const orderNumber = order?.orderNumber || "BG-89421";

  const canCancel = order && (order.orderStatus === "PLACED" || order.orderStatus === "CONFIRMED");
  const isDelivered = order && order.orderStatus === "DELIVERED";

  const handleDownloadInvoice = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      const invoiceData = `
========================================
       BITEGO TAX INVOICE
========================================
Order ID: #${orderNumber}
Date: ${order?.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString()}
Restaurant: ${order?.restaurant?.name || "The Dark Roast Pizzeria"}
Customer: ${order?.deliveryAddress?.fullName || "Ananya Sharma"}
Address: ${order?.deliveryAddress?.houseFlat || ""}, ${order?.deliveryAddress?.area || "Ahmedabad"}

ITEMS:
${items.map(i => `${i.quantity}x ${i.name} - ₹${i.price * i.quantity}`).join("\n")}

Subtotal: ₹${itemSubtotal.toFixed(2)}
Delivery Fee: ₹${deliveryFee.toFixed(2)}
Taxes & Fees: ₹${taxesAndPackaging.toFixed(2)}
Discount: -₹${couponDiscount.toFixed(2)}
Tip: ₹${tipNumeric.toFixed(2)}
TOTAL PAID: ₹${grandTotal.toFixed(2)}
Payment: ${paymentMethodLabel} (${isPaid ? "PAID" : "PENDING"})
========================================
Thank you for choosing BiteGo!
      `.trim();

      const blob = new Blob([invoiceData], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BiteGo_Invoice_${orderNumber}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }, 800);
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] space-y-6">
      {/* Title & Items Count */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Order Summary
          </h3>
        </div>
        <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
          {items.reduce((s, i) => s + (i.quantity || 1), 0)} Items
        </span>
      </div>

      {/* Food Items List */}
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div
            key={item.id || item._id || idx}
            className="flex items-start justify-between gap-3 text-sm pb-3 border-b border-slate-50 last:border-b-0 last:pb-0"
          >
            <div className="flex items-start gap-2.5">
              {/* Veg Indicator */}
              <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                item.isVeg !== false ? "border-emerald-600" : "border-rose-600"
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  item.isVeg !== false ? "bg-emerald-600" : "bg-rose-600"
                }`} />
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 leading-snug">
                  {item.quantity}x {item.name}
                </h4>
                {item.customizationText ? (
                  <p className="text-[11px] text-orange-600 font-semibold">
                    {item.customizationText}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 font-medium">
                    {item.description || "Freshly cooked to order"}
                  </p>
                )}
              </div>
            </div>

            <span className="font-black text-slate-900 whitespace-nowrap">
              ₹{(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Bill Calculation */}
      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2.5 text-xs">
        <div className="flex justify-between text-slate-600 font-medium">
          <span>Item Subtotal</span>
          <span className="font-bold text-slate-900">
            ₹{itemSubtotal.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between text-slate-600 font-medium">
          <span className="flex items-center gap-1">
            <span>Delivery Fee</span>
            {deliveryFee === 0 && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">
                Gold
              </span>
            )}
          </span>
          <span className="font-bold text-emerald-600">
            {deliveryFee === 0 ? "FREE" : `₹${deliveryFee.toFixed(2)}`}
          </span>
        </div>

        <div className="flex justify-between text-slate-600 font-medium">
          <span>Taxes &amp; Restaurant Packaging</span>
          <span className="font-bold text-slate-900">
            ₹{taxesAndPackaging.toFixed(2)}
          </span>
        </div>

        {couponDiscount > 0 && (
          <div className="flex justify-between text-emerald-700 font-semibold">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Coupon ({couponCode})</span>
            </span>
            <span>-₹{couponDiscount.toFixed(2)}</span>
          </div>
        )}

        {tipNumeric > 0 && (
          <div className="flex justify-between text-orange-700 font-semibold">
            <span>Rider Appreciation Tip</span>
            <span>+₹{tipNumeric.toFixed(2)}</span>
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-sm font-black text-slate-900">
          <span>Grand Total</span>
          <span className="text-lg text-orange-600">
            ₹{grandTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Payment Verification */}
      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-600 text-white" />
            <span>{paymentMethodLabel}</span>
          </p>
          <p className="text-[11px] text-emerald-800 font-mono pl-5.5">
            Ref: {order?.paymentStatus === "completed" ? "PAID / GATEWAY_SUCCESS" : "COD / COLLECT_ON_DELIVERY"}
          </p>
        </div>

        <span className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
          isPaid ? "bg-emerald-600 text-white" : "bg-amber-500 text-slate-950"
        }`}>
          {isPaid ? "Verified" : "Pending"}
        </span>
      </div>

      {/* Lifecycle Actions: Cancel or Reorder */}
      {canCancel && onCancelOrder && (
        <button
          type="button"
          onClick={onCancelOrder}
          className="w-full py-2.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Ban className="w-4 h-4 text-rose-600" />
          <span>Cancel Order (Before Kitchen Prepares)</span>
        </button>
      )}

      {isDelivered && onReorder && (
        <button
          type="button"
          onClick={onReorder}
          className="w-full py-3 px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-600/30 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reorder This Feast</span>
        </button>
      )}

      {/* Download Invoice Button */}
      <button
        type="button"
        onClick={handleDownloadInvoice}
        disabled={downloading}
        className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:border-slate-300 active:scale-[0.98] shadow-xs cursor-pointer"
      >
        <Download className="w-4 h-4 text-orange-600" />
        <span>
          {downloading ? "Preparing Tax Invoice..." : "Download Tax Invoice (Receipt)"}
        </span>
      </button>

      {/* Help & Drop Instruction Links */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="flex items-center gap-1.5 hover:text-orange-600 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Need Help with this Order?</span>
        </button>

        <button
          type="button"
          onClick={() => setDropOpen(true)}
          className="flex items-center gap-1.5 hover:text-orange-600 transition-colors cursor-pointer"
        >
          <MessageSquareText className="w-3.5 h-3.5" />
          <span>Change drop instructions</span>
        </button>
      </div>

      {/* Help Modal */}
      {helpOpen && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 animate-in fade-in">
          <p className="font-bold text-slate-800">BiteGo Priority Support:</p>
          <p className="text-slate-600">
            Direct Line: +91 79 4000 8942 (Ahmedabad Support Desk)
          </p>
          <p className="text-slate-600">
            Live chat agent available 24/7 for order #{orderNumber}.
          </p>
          <button
            type="button"
            onClick={() => setHelpOpen(false)}
            className="text-orange-600 font-bold underline pt-1 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Drop Instructions Modal */}
      {dropOpen && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 animate-in fade-in">
          <p className="font-bold text-slate-800">Update Drop Instructions:</p>
          <input
            type="text"
            value={dropNote}
            onChange={(e) => setDropNote(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setDropOpen(false)}
              className="text-slate-500 px-2 py-1 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                alert(`✅ Instruction updated: "${dropNote}"`);
                setDropOpen(false);
              }}
              className="bg-orange-600 text-white font-bold px-3 py-1 rounded-lg cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
