import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      default: "BiteGo Customer",
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      index: true,
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Don't return password by default
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    phoneNumber: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    authProviders: {
      type: [String],
      enum: ["local", "phone", "google", "apple"],
      default: ["local"],
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    appleId: {
      type: String,
      sparse: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["customer", "merchant", "delivery", "admin", "superadmin"],
      default: "customer",
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Delivery partner specific operational status
    isOnline: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    address: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },
    city: {
      type: String,
      default: "Ahmedabad",
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if provided or modified
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
