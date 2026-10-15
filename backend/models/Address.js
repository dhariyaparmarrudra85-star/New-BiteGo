import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: [true, "Recipient name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    houseFlat: {
      type: String,
      required: [true, "House / Flat / Block is required"],
      trim: true,
    },
    area: {
      type: String,
      required: [true, "Area / Street / Sector is required"],
      trim: true,
    },
    landmark: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      default: "Ahmedabad",
      trim: true,
    },
    state: {
      type: String,
      default: "Gujarat",
      trim: true,
    },
    pincode: {
      type: String,
      default: "380054",
      trim: true,
    },
    type: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Address = mongoose.model("Address", addressSchema);
export default Address;
