import mongoose from "mongoose";

const deliveryEarningSchema = new mongoose.Schema(
  {
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    baseFee: {
      type: Number,
      default: 45,
    },
    tipAmount: {
      type: Number,
      default: 0,
    },
    surgeBonus: {
      type: Number,
      default: 15,
    },
    distanceKm: {
      type: Number,
      default: 2.4,
    },
    totalEarning: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["credited", "withdrawn"],
      default: "credited",
    },
  },
  {
    timestamps: true,
  }
);

const DeliveryEarning = mongoose.model("DeliveryEarning", deliveryEarningSchema);
export default DeliveryEarning;
