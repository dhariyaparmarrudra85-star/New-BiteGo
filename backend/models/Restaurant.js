import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    },
    logo: {
      type: String,
      default: "",
    },
    banner: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
    },
    numRatings: {
      type: Number,
      default: 120,
    },
    deliveryTime: {
      type: String,
      default: "25-30 mins",
    },
    deliveryNumeric: {
      type: Number,
      default: 25,
    },
    priceForTwo: {
      type: String,
      default: "₹600 for two",
    },
    costNumeric: {
      type: Number,
      default: 600,
    },
    cuisine: {
      type: [String],
      default: ["Italian", "Pizza", "Fast Food"],
    },
    type: {
      type: String,
      enum: ["Pure Veg", "Multi-Cuisine", "Non-Veg"],
      default: "Multi-Cuisine",
    },
    isPureVeg: {
      type: Boolean,
      default: false,
    },
    address: {
      type: String,
      default: "Bodakdev, Ahmedabad",
    },
    hub: {
      type: String,
      default: "Bodakdev Hub",
    },
    city: {
      type: String,
      default: "Ahmedabad",
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    offer: {
      type: String,
      default: "Flat ₹100 OFF with BITEGO50",
    },
    merchantUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
export default Restaurant;
