import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MenuItem",
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  image: {
    type: String,
    default: "",
  },
  isVeg: {
    type: Boolean,
    default: true,
  },
  customizations: [
    {
      group: { type: String },
      name: { type: String },
      price: { type: Number, default: 0 },
    },
  ],
  itemTotal: {
    type: Number,
    required: true,
  },
});

const statusTimelineSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
    default: "",
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    items: [orderItemSchema],
    deliveryAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      houseFlat: { type: String, required: true },
      area: { type: String, required: true },
      landmark: { type: String, default: "" },
      city: { type: String, default: "Ahmedabad" },
      state: { type: String, default: "Gujarat" },
      pincode: { type: String, default: "380054" },
    },
    deliveryInstructions: {
      type: String,
      default: "Leave at door",
    },
    subtotal: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    tipAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    coupon: {
      code: { type: String, default: null },
      discountAmount: { type: Number, default: 0 },
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "UPI", "Card", "Online", "Wallet"],
      default: "UPI",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED", "pending", "paid", "failed"],
      default: "PENDING",
    },
    paymentDetails: {
      transactionId: { type: String, default: null },
      gateway: { type: String, default: null },
      paidAt: { type: Date, default: null },
      refundedAt: { type: Date, default: null },
      refundAmount: { type: Number, default: 0 },
      failureReason: { type: String, default: null },
    },
    orderStatus: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "PREPARING",
        "READY_FOR_PICKUP",
        "ASSIGNED",
        "ACCEPTED",
        "PICKED_UP",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PLACED",
    },
    orderOtp: {
      type: String,
      default: () => crypto.randomInt(1000, 10000).toString(), // Cryptographically secure 4-digit OTP e.g. 8942
    },
    orderOtpHash: {
      type: String,
      default: null,
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    declinedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    statusTimeline: [statusTimelineSchema],
    estimatedDeliveryTime: {
      type: String,
      default: "25-35 mins",
    },
    customerNote: {
      type: String,
      default: "",
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    review: {
      rating: { type: Number, min: 1, max: 5 },
      restaurantRating: { type: Number, min: 1, max: 5 },
      reviewText: { type: String, default: "" },
      courierRating: { type: Number, min: 1, max: 5 },
      createdAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Auto-push initial timeline item if new & securely hash OTP
orderSchema.pre("save", async function () {
  if (this.isNew && (!this.statusTimeline || this.statusTimeline.length === 0)) {
    this.statusTimeline = [
      {
        status: "PLACED",
        timestamp: new Date(),
        note: "Order received and forwarded to kitchen",
      },
    ];
  }

  // Securely hash OTP if new or modified
  if (this.orderOtp && (!this.orderOtpHash || this.isModified("orderOtp"))) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.orderOtpHash = await bcrypt.hash(this.orderOtp.toString(), salt);
    } catch (err) {
      console.error("Error hashing orderOtp:", err);
    }
  }
});

// Compare entered OTP securely against hash (with plaintext fallback for legacy data)
orderSchema.methods.compareOtp = async function (enteredOtp) {
  if (!enteredOtp) return false;
  const clean = enteredOtp.toString().trim();
  if (this.orderOtpHash) {
    const isMatch = await bcrypt.compare(clean, this.orderOtpHash);
    if (isMatch) return true;
  }
  if (this.orderOtp) {
    return this.orderOtp.toString().trim() === clean;
  }
  return false;
};

const Order = mongoose.model("Order", orderSchema);
export default Order;
