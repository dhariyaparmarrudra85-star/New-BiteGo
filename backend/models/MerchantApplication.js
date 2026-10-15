import mongoose from "mongoose";

const merchantApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurantName: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Restaurant address is required"],
    },
    hub: {
      type: String,
      default: "Bodakdev Hub",
    },
    category: {
      type: String,
      required: [true, "Food category/cuisine is required"],
    },
    description: {
      type: String,
      default: "",
    },
    photo: {
      type: String,
      default: "",
    },
    fssaiNumber: {
      type: String,
      required: [true, "FSSAI License number is required"],
      trim: true,
    },
    gstin: {
      type: String,
      trim: true,
      default: "",
    },
    bankMandate: {
      type: String,
      default: "Verified",
    },
    requestedCommission: {
      type: Number,
      default: 18.0,
    },
    documents: [
      {
        name: String,
        url: String,
        documentType: String,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const MerchantApplication = mongoose.model(
  "MerchantApplication",
  merchantApplicationSchema
);

export default MerchantApplication;
