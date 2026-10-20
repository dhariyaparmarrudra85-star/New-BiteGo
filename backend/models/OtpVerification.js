import mongoose from "mongoose";

const otpVerificationSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: [true, "OTP hash is required"],
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: auto-deletes expired records
    },
    attempts: {
      type: Number,
      default: 0,
      max: [5, "Too many verification attempts"],
    },
    resendAvailableAt: {
      type: Date,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    ip: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Composite index for fast lookups
otpVerificationSchema.index({ phoneNumber: 1, verified: 1, expiresAt: 1 });

const OtpVerification = mongoose.model("OtpVerification", otpVerificationSchema);

export default OtpVerification;
