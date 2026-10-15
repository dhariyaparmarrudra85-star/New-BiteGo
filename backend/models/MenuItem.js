import mongoose from "mongoose";

const customizationOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
});

const customizationGroupSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Size", "Crust", "Add-ons"
  type: { type: String, enum: ["radio", "checkbox"], default: "radio" }, // single or multi select
  required: { type: Boolean, default: false },
  options: [customizationOptionSchema],
});

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true, // e.g. "Woodfired Pizzas", "Artisanal Breads", "Pasta", "Beverages"
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    image: {
      type: String,
      default: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    reviewsCount: {
      type: Number,
      default: 140,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    customizationGroups: [customizationGroupSchema],
  },
  {
    timestamps: true,
  }
);

const MenuItem = mongoose.model("MenuItem", menuItemSchema);
export default MenuItem;
