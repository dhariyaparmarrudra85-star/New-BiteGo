import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import Coupon from "../models/Coupon.js";
import Address from "../models/Address.js";
import User from "../models/User.js";

export const seedCustomerData = async () => {
  try {
    // 1. Seed Coupons
    const bitegoCoupon = await Coupon.findOne({ code: "BITEGO50" });
    if (!bitegoCoupon) {
      await Coupon.create([
        {
          code: "BITEGO50",
          description: "Flat ₹100 OFF on delicious orders over ₹200",
          discountType: "fixed",
          discountAmount: 100,
          minOrderAmount: 200,
          maxDiscount: 100,
          isActive: true,
        },
        {
          code: "GOLD100",
          description: "Exclusive ₹100 OFF for BiteGo Gold Members",
          discountType: "fixed",
          discountAmount: 100,
          minOrderAmount: 250,
          maxDiscount: 100,
          isActive: true,
        },
        {
          code: "FEAST20",
          description: "20% OFF on all culinary creations up to ₹150",
          discountType: "percentage",
          discountAmount: 20,
          minOrderAmount: 300,
          maxDiscount: 150,
          isActive: true,
        },
      ]);
      console.log("[Seed] BITEGO50 and promo coupons initialized successfully.");
    }

    // 2. Seed Restaurants
    let darkRoast = await Restaurant.findOne({
      $or: [{ slug: "the-dark-roast-pizzeria" }, { name: "The Dark Roast Pizzeria" }],
    });

    if (!darkRoast) {
      // Find or assign merchant user
      const merchantUser = await User.findOne({ role: "merchant" });

      const restaurants = await Restaurant.create([
        {
          name: "The Dark Roast Pizzeria",
          slug: "the-dark-roast-pizzeria",
          description: "Woodfired Neapolitan Pizza, Pastas, Gelatos & Artisan Beverages",
          rating: 4.8,
          numRatings: 340,
          deliveryTime: "25 mins",
          deliveryNumeric: 25,
          priceForTwo: "₹650 for two",
          costNumeric: 650,
          offer: "Flat ₹100 OFF with BITEGO50",
          type: "Multi-Cuisine",
          isPureVeg: false,
          address: "Sindhu Bhavan Express Branch, Bodakdev",
          hub: "Bodakdev Hub",
          city: "Ahmedabad",
          isOpen: true,
          image: "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=700&q=80",
          merchantUser: merchantUser?._id,
        },
        {
          name: "Agashiye - House of MG",
          slug: "agashiye-house-of-mg",
          description: "Authentic Heritage Gujarati Thali, Farsan, Desserts",
          rating: 4.8,
          numRatings: 520,
          deliveryTime: "32 mins",
          deliveryNumeric: 32,
          priceForTwo: "₹1,200 for two",
          costNumeric: 1200,
          offer: "Flat ₹125 OFF",
          type: "Pure Veg",
          isPureVeg: true,
          address: "Opposite Sidi Saiyyed Mosque, Lal Darwaja",
          hub: "Lal Darwaja Hub",
          city: "Ahmedabad",
          isOpen: true,
          image: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=700&q=80",
        },
        {
          name: "Gwalia Sweets & Street Food",
          slug: "gwalia-sweets-street-food",
          description: "Kachori, Fafda, Jalebi, Chaat, Motichoor Ladoo & Mithai",
          rating: 4.7,
          numRatings: 280,
          deliveryTime: "18 mins",
          deliveryNumeric: 18,
          priceForTwo: "₹300 for two",
          costNumeric: 300,
          offer: "20% OFF UP TO ₹100",
          type: "Pure Veg",
          isPureVeg: true,
          address: "Panchwati Circle, CG Road",
          hub: "Navrangpura Hub",
          city: "Ahmedabad",
          isOpen: true,
          image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=700&q=80",
        },
        {
          name: "Behrouz Royal Biryani",
          slug: "behrouz-royal-biryani",
          description: "Dum Gosht, Zaikedaar Paneer Biryani, Kebabs & Shahi Tukda",
          rating: 4.5,
          numRatings: 610,
          deliveryTime: "35 mins",
          deliveryNumeric: 35,
          priceForTwo: "₹750 for two",
          costNumeric: 750,
          offer: "Free Dessert on ₹499",
          type: "Multi-Cuisine",
          isPureVeg: false,
          address: "Vastrapur Lake Rd, Vastrapur",
          hub: "Vastrapur Hub",
          city: "Ahmedabad",
          isOpen: true,
          image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=700&q=80",
        },
        {
          name: "Mocha Bodakdev",
          slug: "mocha-bodakdev",
          description: "Gourmet Burgers, Shakes, Paninis & Cheesecakes",
          rating: 4.4,
          numRatings: 190,
          deliveryTime: "28 mins",
          deliveryNumeric: 28,
          priceForTwo: "₹800 for two",
          costNumeric: 800,
          offer: "15% Flat OFF",
          type: "Multi-Cuisine",
          isPureVeg: false,
          address: "Devashish Business Park, Bodakdev",
          hub: "Bodakdev Hub",
          city: "Ahmedabad",
          isOpen: true,
          image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=80",
        },
        {
          name: "Sasumaa Gujarati Thali",
          slug: "sasumaa-gujarati-thali",
          description: "Authentic Kathiyawadi & Gujarati Spreads, Unlimited Combo",
          rating: 4.9,
          numRatings: 440,
          deliveryTime: "30 mins",
          deliveryNumeric: 30,
          priceForTwo: "₹550 for two",
          costNumeric: 550,
          offer: "BiteGo Super Deal",
          type: "Pure Veg",
          isPureVeg: true,
          address: "Ellis Bridge Flagship, Ahmedabad",
          hub: "Ellis Bridge Hub",
          city: "Ahmedabad",
          isOpen: true,
          image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=700&q=80",
        },
      ]);
      console.log("[Seed] Restaurants initialized.");
      darkRoast = restaurants[0];
    }

    // 3. Seed Menu Items for The Dark Roast Pizzeria if not present
    if (darkRoast) {
      const darkRoastMenuCount = await MenuItem.countDocuments({
        restaurant: darkRoast._id,
      });

      if (darkRoastMenuCount === 0) {
        await MenuItem.create([
          {
            restaurant: darkRoast._id,
            name: "Truffle Mushroom Pizza",
          category: "Woodfired Pizzas",
          description: "San Marzano sauce, fresh mozzarella, wild portobello mushrooms, black truffle oil and aromatic fresh thyme.",
          price: 480,
          isVeg: true,
          isTrending: true,
          inStock: true,
          isAvailable: true,
          rating: 4.9,
          reviewsCount: 1200,
          image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
          customizationGroups: [
            {
              name: "Size",
              type: "radio",
              required: true,
              options: [
                { name: "Regular (8 inch)", price: 0 },
                { name: "Medium (10 inch)", price: 120 },
                { name: "Large (12 inch)", price: 240 },
              ],
            },
            {
              name: "Crust Selection",
              type: "radio",
              required: false,
              options: [
                { name: "Traditional Hand Tossed", price: 0 },
                { name: "Cheese Burst", price: 80 },
                { name: "Thin & Crispy Wheat", price: 40 },
              ],
            },
            {
              name: "Extra Toppings & Add-ons",
              type: "checkbox",
              required: false,
              options: [
                { name: "Extra Fresh Mozzarella", price: 60 },
                { name: "Gourmet Black Olives", price: 40 },
                { name: "Pickled Jalapenos", price: 30 },
                { name: "Extra Truffle Drizzle", price: 75 },
              ],
            },
          ],
        },
        {
          restaurant: darkRoast._id,
          name: "Garlic Breadsticks w/ Cheese",
          category: "Artisanal Breads",
          description: "Freshly pulled dough baked with garlic herb butter, bubbling mozzarella, served with warm San Marzano marinara dip.",
          price: 120,
          isVeg: true,
          isTrending: true,
          inStock: true,
          isAvailable: true,
          rating: 4.8,
          reviewsCount: 850,
          image: "https://images.unsplash.com/photo-1573821663912-569905455b1a?auto=format&fit=crop&w=600&q=80",
          customizationGroups: [
            {
              name: "Dips & Sauces",
              type: "radio",
              required: false,
              options: [
                { name: "Spicy Marinara Dip", price: 0 },
                { name: "Creamy Cheese Dip", price: 30 },
                { name: "Garlic Mayo", price: 25 },
              ],
            },
          ],
        },
        {
          restaurant: darkRoast._id,
          name: "Mango Mint Cooler",
          category: "Beverages",
          description: "Chilled pure Alphonso mango extract crushed with garden-fresh mint leaves, lemon zest and sparkling mineral water.",
          price: 130,
          isVeg: true,
          isTrending: true,
          inStock: true,
          isAvailable: true,
          rating: 4.7,
          reviewsCount: 430,
          image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
          customizationGroups: [
            {
              name: "Sweetness Level",
              type: "radio",
              required: false,
              options: [
                { name: "Regular Sweetness", price: 0 },
                { name: "Low Sugar", price: 0 },
                { name: "Zero Added Sugar", price: 0 },
              ],
            },
          ],
        },
        {
          restaurant: darkRoast._id,
          name: "Classic Margherita D.O.P.",
          category: "Woodfired Pizzas",
          description: "Simple Italian perfection: Italian crushed tomatoes, bocconcini mozzarella, sweet basil and cold-pressed extra virgin olive oil.",
          price: 390,
          isVeg: true,
          isTrending: false,
          inStock: true,
          isAvailable: true,
          rating: 4.8,
          reviewsCount: 650,
          image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80",
          customizationGroups: [
            {
              name: "Size",
              type: "radio",
              required: true,
              options: [
                { name: "Regular (8 inch)", price: 0 },
                { name: "Medium (10 inch)", price: 110 },
                { name: "Large (12 inch)", price: 220 },
              ],
            },
            {
              name: "Cheese Add-ons",
              type: "checkbox",
              required: false,
              options: [{ name: "Extra Fresh Bocconcini", price: 70 }],
            },
          ],
        },
        {
          restaurant: darkRoast._id,
          name: "Quattro Formaggi (4 Cheese)",
          category: "Woodfired Pizzas",
          description: "Blend of Mozzarella, Gorgonzola, aged Parmesan and creamy Ricotta with oregano and cracked pepper.",
          price: 520,
          isVeg: true,
          isTrending: false,
          inStock: true,
          isAvailable: true,
          rating: 4.9,
          reviewsCount: 310,
          image: "https://images.unsplash.com/photo-1573821663912-569905455b1a?auto=format&fit=crop&w=600&q=80",
          customizationGroups: [
            {
              name: "Size",
              type: "radio",
              required: true,
              options: [
                { name: "Regular (8 inch)", price: 0 },
                { name: "Medium (10 inch)", price: 130 },
                { name: "Large (12 inch)", price: 260 },
              ],
            },
          ],
        },
        {
          restaurant: darkRoast._id,
          name: "Penne Pesto Genovese",
          category: "Pastas",
          description: "Al dente penne pasta tossed in homemade Genovese basil pesto, toasted pine nuts and shaved Grana Padano.",
          price: 440,
          isVeg: true,
          isTrending: false,
          inStock: true,
          isAvailable: true,
          rating: 4.6,
          reviewsCount: 180,
          image: "https://images.unsplash.com/photo-1621996346565-e3d5d6281745?auto=format&fit=crop&w=600&q=80",
        },
        {
          restaurant: darkRoast._id,
          name: "Belgian Chocolate Lava Cake",
          category: "Desserts",
          description: "Warm molten Belgian dark chocolate cake with a gooey warm core, dusted with confectioners sugar.",
          price: 190,
          isVeg: true,
          isTrending: false,
          inStock: true,
          isAvailable: true,
          rating: 4.9,
          reviewsCount: 490,
          image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
        },
      ]);

      // Seed Items for Behrouz Biryani
      const behrouz = restaurants[3];
      await MenuItem.create([
        {
          restaurant: behrouz._id,
          name: "Dum Gosht Biryani",
          category: "Biryani",
          description: "Succulent mutton pieces marinated in royal Persian spices, layered with long grain basmati rice, slow-cooked on dum.",
          price: 465,
          isVeg: false,
          isTrending: true,
          inStock: true,
          isAvailable: true,
          rating: 4.9,
          reviewsCount: 2100,
          image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
          customizationGroups: [
            {
              name: "Portion Size",
              type: "radio",
              required: true,
              options: [
                { name: "Regular (Serves 1)", price: 0 },
                { name: "King Size (Serves 2)", price: 290 },
              ],
            },
            {
              name: "Accompaniments",
              type: "checkbox",
              required: false,
              options: [
                { name: "Extra Mint Raita", price: 35 },
                { name: "Gulab Jamun (2 pcs)", price: 65 },
              ],
            },
          ],
        },
        {
          restaurant: behrouz._id,
          name: "Zaikedaar Paneer Biryani",
          category: "Biryani",
          description: "Charcoal-grilled cottage cheese cubes layered with aromatic saffron rice and fried onions.",
          price: 360,
          isVeg: true,
          isTrending: false,
          inStock: true,
          isAvailable: true,
          rating: 4.7,
          reviewsCount: 940,
          image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80",
        },
      ]);

      console.log("[Seed] Menu items seeded.");
      }
    }

    // 4. Seed Default Address for Customer
    const customer = await User.findOne({ email: "customer@bitego.com" });
    if (customer) {
      const existingAddress = await Address.findOne({ user: customer._id });
      if (!existingAddress) {
        await Address.create({
          user: customer._id,
          fullName: customer.name || "Ananya Sharma",
          phone: customer.phone || "+91 98765 43210",
          houseFlat: "Flat 402, Tower B, Galaxy Heights",
          area: "Sindhu Bhavan Road, Bodakdev",
          landmark: "Near Bodakdev Urban Lake Park",
          city: "Ahmedabad",
          state: "Gujarat",
          pincode: "380054",
          type: "Home",
          isDefault: true,
        });
        console.log("[Seed] Default address initialized for customer.");
      }
    }
  } catch (error) {
    console.error("[Seed] Error seeding customer data:", error);
  }
};
