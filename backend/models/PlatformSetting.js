import mongoose from "mongoose";

const platformSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "default_settings",
      unique: true,
      trim: true,
    },
    deliveryFee: {
      type: Number,
      default: 35.0,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 5.0, // 5% GST
      min: 0,
    },
    platformCommission: {
      type: Number,
      default: 18.0, // 18% take rate
      min: 0,
      max: 100,
    },
    serviceAvailability: {
      type: Boolean,
      default: true,
    },
    minOrderAmount: {
      type: Number,
      default: 99.0,
      min: 0,
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 499.0,
      min: 0,
    },
    surgeMultiplier: {
      type: Number,
      default: 1.0,
      min: 1.0,
    },
    cityHub: {
      type: String,
      default: "Ahmedabad Core",
    },
    supportContact: {
      type: String,
      default: "support@bitego.com",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedByName: {
      type: String,
      default: "Super Admin",
    },
  },
  {
    timestamps: true,
  }
);

// Helper static method to get or initialize default settings
platformSettingSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ key: "default_settings" });
  if (!settings) {
    settings = await this.create({
      key: "default_settings",
      deliveryFee: 35.0,
      taxRate: 5.0,
      platformCommission: 18.0,
      serviceAvailability: true,
      minOrderAmount: 99.0,
      freeDeliveryThreshold: 499.0,
      surgeMultiplier: 1.0,
      cityHub: "Ahmedabad Core",
      supportContact: "support@bitego.com",
    });
  }
  return settings;
};

const PlatformSetting = mongoose.model("PlatformSetting", platformSettingSchema);

export default PlatformSetting;
