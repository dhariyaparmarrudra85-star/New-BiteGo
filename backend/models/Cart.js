import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  cartItemId: { type: String, required: true },
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  basePrice: { type: Number, default: 0 },
  quantity: { type: Number, required: true, default: 1 },
  image: { type: String, default: "" },
  isVeg: { type: Boolean, default: true },
  customizations: [
    {
      group: { type: String },
      name: { type: String },
      price: { type: Number, default: 0 },
    },
  ],
  customizationText: { type: String, default: "" },
  restaurant: { type: String, default: "" },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },
    restaurantName: {
      type: String,
      default: "",
    },
    items: [cartItemSchema],
    appliedCoupon: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
