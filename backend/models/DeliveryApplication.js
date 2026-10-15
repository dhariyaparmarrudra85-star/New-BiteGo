import mongoose from "mongoose";

const deliveryApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
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
    dob: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    emergencyContactName: {
      type: String,
      default: "",
    },
    emergencyContactPhone: {
      type: String,
      default: "",
    },
    vehicleType: {
      type: String,
      enum: ["Bike", "Scooter", "Bicycle"],
      required: [true, "Vehicle type is required"],
    },
    vehicleNumber: {
      type: String,
      trim: true,
      default: "",
    },
    drivingLicenseNumber: {
      type: String,
      trim: true,
      default: "",
    },
    vehicleRCNumber: {
      type: String,
      trim: true,
      default: "",
    },
    governmentId: {
      type: String,
      trim: true,
      default: "",
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

const DeliveryApplication = mongoose.model(
  "DeliveryApplication",
  deliveryApplicationSchema
);

export default DeliveryApplication;
