import dotenv from "dotenv";
dotenv.config();
import connectDB from "./db.js";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";

async function seed() {
  await connectDB();

  // 1. Agashiye - House of MG
  const agashiye = await Restaurant.findOne({ name: /Agashiye/i });
  if (agashiye) {
    const count = await MenuItem.countDocuments({ restaurant: agashiye._id });
    if (count === 0) {
      await MenuItem.create([
        {
          restaurant: agashiye._id,
          name: "Heritage Grand Gujarati Thali",
          category: "Thali Combos",
          description: "Unlimited heritage spread: 4 seasonal sabzis, Gujarati Dal, Kadhi, Rotli, Bhakhri, Puri, Farsan, Chhaas, and 2 fresh Mithais.",
          price: 850,
          isVeg: true,
          isTrending: true,
          inStock: true,
          isAvailable: true,
          rating: 4.9,
          reviewsCount: 780,
          image: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80",
          customizationGroups: [
            {
              name: "Bread Selection",
              type: "radio",
              required: true,
              options: [
                { name: "Phulka Rotli & Puri", price: 0 },
                { name: "Bajra No Rotlo w/ White Butter", price: 50 },
              ],
            },
            {
              name: "Farsan Add-on",
              type: "checkbox",
              required: false,
              options: [
                { name: "Extra Kesar Puran Poli", price: 75 },
                { name: "Surti Undhiyu Bowl", price: 120 },
              ],
            },
          ],
        },
        {
          restaurant: agashiye._id,
          name: "Khandvi & Patra Platter",
          category: "Farsan & Starters",
          description: "Silky rolled gram flour khandvi tempered with mustard seeds, sesame, and colocasia leaf patra rolls.",
          price: 240,
          isVeg: true,
          inStock: true,
          isAvailable: true,
          rating: 4.8,
          reviewsCount: 310,
          image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
        },
        {
          restaurant: agashiye._id,
          name: "Masala Chhaas Carafe",
          category: "Beverages",
          description: "Traditional roasted cumin and fresh coriander buttermilk, slow churned.",
          price: 90,
          isVeg: true,
          inStock: true,
          isAvailable: true,
          rating: 4.7,
          reviewsCount: 150,
          image: "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=600&q=80",
        },
      ]);
      console.log("Seeded Agashiye");
    }
  }

  // 2. Gwalia Sweets & Street Food
  const gwalia = await Restaurant.findOne({ name: /Gwalia/i });
  if (gwalia) {
    const count = await MenuItem.countDocuments({ restaurant: gwalia._id });
    if (count === 0) {
      await MenuItem.create([
        {
          restaurant: gwalia._id,
          name: "Fafda Jalebi Sunday Combo",
          category: "Breakfast & Farsan",
          description: "Crispy crunchy papad-style fafda (250g) served with hot pure ghee kesar jalebi (200g), raw papaya sambharo and fried green chillies.",
          price: 260,
          isVeg: true,
          isTrending: true,
          inStock: true,
          isAvailable: true,
          rating: 4.9,
          reviewsCount: 1100,
          image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80",
          customizationGroups: [
            {
              name: "Portion Size",
              type: "radio",
              required: true,
              options: [
                { name: "Regular Combo (Serves 2)", price: 0 },
                { name: "Family Pack (Serves 4)", price: 240 },
              ],
            },
          ],
        },
        {
          restaurant: gwalia._id,
          name: "Dahi Sev Puri Supreme",
          category: "Chaat & Street Bites",
          description: "Crispy puris filled with spiced potatoes, sprouts, chilled sweet curd, and signature tangy tamarind chutney.",
          price: 130,
          isVeg: true,
          inStock: true,
          isAvailable: true,
          rating: 4.8,
          reviewsCount: 420,
          image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80",
        },
        {
          restaurant: gwalia._id,
          name: "Desi Ghee Motichoor Ladoo Box",
          category: "Mithai & Sweets",
          description: "Soft melting gram flour pearl pearls slow-cooked in pure cow ghee and pistachios (500g).",
          price: 380,
          isVeg: true,
          inStock: true,
          isAvailable: true,
          rating: 4.9,
          reviewsCount: 650,
          image: "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=600&q=80",
        },
      ]);
      console.log("Seeded Gwalia");
    }
  }

  // 3. Mocha Bodakdev
  const mocha = await Restaurant.findOne({ name: /Mocha/i });
  if (mocha) {
    const count = await MenuItem.countDocuments({ restaurant: mocha._id });
    if (count === 0) {
      await MenuItem.create([
        {
          restaurant: mocha._id,
          name: "Truffle & Smoked Cheese Burger",
          category: "Gourmet Burgers",
          description: "Crispy plant protein patty, aged cheddar melt, caramelized shallots, arugula and black truffle aioli in brioche bun.",
          price: 390,
          isVeg: true,
          isTrending: true,
          inStock: true,
          isAvailable: true,
          rating: 4.7,
          reviewsCount: 480,
          image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
          customizationGroups: [
            {
              name: "Fries & Sides",
              type: "radio",
              required: true,
              options: [
                { name: "Salted French Fries", price: 0 },
                { name: "Peri Peri Crinkle Fries", price: 40 },
                { name: "Truffle Parmesan Wedges", price: 80 },
              ],
            },
          ],
        },
        {
          restaurant: mocha._id,
          name: "Lotus Biscoff Thickshake",
          category: "Thickshakes & Coolers",
          description: "Crushed Belgian speculoos cookies blended with Madagascan vanilla ice cream and caramel drizzle.",
          price: 260,
          isVeg: true,
          inStock: true,
          isAvailable: true,
          rating: 4.9,
          reviewsCount: 350,
          image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
        },
      ]);
      console.log("Seeded Mocha");
    }
  }

  // 4. Sasumaa Gujarati Thali
  const sasumaa = await Restaurant.findOne({ name: /Sasumaa/i });
  if (sasumaa) {
    const count = await MenuItem.countDocuments({ restaurant: sasumaa._id });
    if (count === 0) {
      await MenuItem.create([
        {
          restaurant: sasumaa._id,
          name: "Kathiyawadi Unlimited Thali Box",
          category: "Kathiyawadi Thali",
          description: "Sev Tameta Nu Shaak, Ringan No Olo, Kadhi Khichdi, 2 Bajra Rotla with pure desi ghee and Gud.",
          price: 360,
          isVeg: true,
          isTrending: true,
          inStock: true,
          isAvailable: true,
          rating: 4.9,
          reviewsCount: 890,
          image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
        },
      ]);
      console.log("Seeded Sasumaa");
    }
  }

  process.exit();
}

seed().catch(console.error);
