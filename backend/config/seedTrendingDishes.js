import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });
import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";

const itemsToSeed = [
  // 1. South Spice -> Dosa
  {
    restaurantMatch: "South Spice",
    items: [
      {
        name: "Classic Masala Dosa",
        category: "Dosa",
        description: "Crispy golden fermented crepe stuffed with spiced potato masala, served with coconut chutney, tomato chutney & piping hot sambar.",
        price: 160,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviewsCount: 320,
      },
      {
        name: "Mysore Masala Dosa",
        category: "Dosa",
        description: "Spicy red garlic chutney smeared dosa filled with rich potato bhaji, fried curry leaves and a dollop of white butter.",
        price: 190,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        reviewsCount: 450,
      },
      {
        name: "Ghee Roast Paper Dosa",
        category: "Dosa",
        description: "Paper thin extra crispy crepe roasted in pure aromatic desi ghee, served with special Gunpowder podi and chutneys.",
        price: 210,
        isVeg: true,
        image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80",
        rating: 4.7,
        reviewsCount: 210,
      },
      {
        name: "Onion Rava Masala Dosa",
        category: "Dosa",
        description: "Crisp semolina crepe studded with finely chopped shallots, green chilies, cilantro and cumin seeds.",
        price: 180,
        isVeg: true,
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
        rating: 4.6,
        reviewsCount: 185,
      },
    ],
  },
  // 2. Dragon Wok -> Momos & Fried Rice
  {
    restaurantMatch: "Dragon Wok",
    items: [
      {
        name: "Steamed Himalayan Veg Momos",
        category: "Momos",
        description: "Delicate translucent steamed dumplings packed with finely minced cabbage, carrots, bell peppers and scallions, served with spicy red chili dip.",
        price: 150,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviewsCount: 410,
      },
      {
        name: "Crispy Pan-Fried Paneer Momos",
        category: "Momos",
        description: "Golden crusted pan-fried dumplings filled with spiced cottage cheese, spring onions, and coriander.",
        price: 180,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80",
        rating: 4.7,
        reviewsCount: 290,
      },
      {
        name: "Fiery Schezwan Tossed Momos",
        category: "Momos",
        description: "Deep fried momos wok-tossed in pungent Sichuan pepper sauce with caramelized garlic and bell pepper chunks.",
        price: 195,
        isVeg: true,
        image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviewsCount: 340,
      },
      {
        name: "Classic Veg Fried Rice",
        category: "Fried Rice",
        description: "Fragrant long-grain basmati wok-tossed on high flame with seasonal vegetables, light soy sauce, and fresh scallions.",
        price: 210,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
        rating: 4.7,
        reviewsCount: 380,
      },
      {
        name: "Burnt Garlic Chilli Fried Rice",
        category: "Fried Rice",
        description: "Smoky wok-charred rice bursting with golden roasted garlic flakes, green chilies, and crisp French beans.",
        price: 230,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        reviewsCount: 470,
      },
      {
        name: "Schezwan Triple Veg Fried Rice",
        category: "Fried Rice",
        description: "Spicy Schezwan fried rice paired with crispy fried hakka noodles and rich vegetable Manchurian gravy.",
        price: 260,
        isVeg: true,
        image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
        rating: 4.6,
        reviewsCount: 220,
      },
    ],
  },
  // 3. Burger Junction -> Burgers
  {
    restaurantMatch: "Burger Junction",
    items: [
      {
        name: "Classic Veggie Crunch Burger",
        category: "Burgers",
        description: "Crispy seasoned vegetable and herb patty, iceberg lettuce, juicy ripe tomatoes, and Thousand Island sauce in a toasted brioche bun.",
        price: 149,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviewsCount: 520,
      },
      {
        name: "Crispy Paneer Makhani Lava Burger",
        category: "Burgers",
        description: "Thick golden crusted cottage cheese block drenched in rich buttery makhani sauce and pickled purple onions.",
        price: 199,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        reviewsCount: 680,
      },
      {
        name: "Double Cheese Jalapeño Flame Burger",
        category: "Burgers",
        description: "Double melted cheddar cheese slice over a spicy chili-infused potato patty, topped with spicy pickled jalapeños.",
        price: 229,
        isVeg: true,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
        rating: 4.7,
        reviewsCount: 310,
      },
    ],
  },
  // 4. Café Bombay -> Chaat
  {
    restaurantMatch: "Café Bombay",
    items: [
      {
        name: "Mumbai Special Sev Puri",
        category: "Chaat",
        description: "Crispy flat puris laden with spiced boiled potatoes, chopped onions, trio of tangy mint and sweet saunth chutneys, crowned with crunchy nylon sev.",
        price: 99,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        reviewsCount: 630,
      },
      {
        name: "Dahi Papdi Chaat Royal",
        category: "Chaat",
        description: "Flaky crisp papdis smothered in chilled sweet yogurt, boiled chickpeas, tangy tamarind chutney, roasted cumin, and pomegranate pearls.",
        price: 120,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviewsCount: 440,
      },
      {
        name: "Royal Pani Puri Platter (8 Pcs)",
        category: "Chaat",
        description: "8 extra crispy puris served with ice-chilled spicy mint-coriander pani, sweet date-tamarind saunth, and warm spiced ragda.",
        price: 80,
        isVeg: true,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
        rating: 4.7,
        reviewsCount: 510,
      },
      {
        name: "Chowpatty Sukha & Geela Bhel Puri",
        category: "Chaat",
        description: "Golden puffed rice, crushed papdi, roasted peanuts, diced onions, and raw mango slivers tossed in zesty garlic chutney.",
        price: 90,
        isVeg: true,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
        rating: 4.6,
        reviewsCount: 290,
      },
    ],
  },
  // 5. The Sandwich Co. -> Sandwiches
  {
    restaurantMatch: "The Sandwich Co.",
    items: [
      {
        name: "Bombay Masala Toast Grilled Sandwich",
        category: "Sandwiches",
        description: "Three-layered jumbo bread packed with spiced turmeric potato mash, cucumber, beetroot, onions, cheese, and spicy mint chutney.",
        price: 140,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviewsCount: 420,
      },
      {
        name: "Paneer Tikka Focaccia Grill Sandwich",
        category: "Sandwiches",
        description: "Smoky tandoori paneer slices, char-grilled bell peppers, chipotle aioli, and mozzarella cheese pressed inside herb focaccia.",
        price: 190,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        reviewsCount: 380,
      },
      {
        name: "Triple Cheese Corn Melt Sandwich",
        category: "Sandwiches",
        description: "Golden sweet corn kernels tossed in Italian herbs and folded with cheddar, mozzarella, and processed cheese in buttery toast.",
        price: 160,
        isVeg: true,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80",
        rating: 4.7,
        reviewsCount: 260,
      },
    ],
  },
  // 6. Dessert Paradise -> Desserts
  {
    restaurantMatch: "Dessert Paradise",
    items: [
      {
        name: "Sizzling Brownie with Vanilla Bean Gelato",
        category: "Desserts",
        description: "Warm gooey dark chocolate walnut brownie served on a piping cast iron skillet with vanilla gelato and melted hot fudge.",
        price: 199,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        reviewsCount: 610,
      },
      {
        name: "Royal Kesar Rasmalai Cheesecake",
        category: "Desserts",
        description: "Decadent fusion creation featuring saffron-infused spongy rasmalai baked gently over a buttery biscuit crust.",
        price: 249,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviewsCount: 470,
      },
      {
        name: "Warm Gulab Jamun Sundae",
        category: "Desserts",
        description: "Two tender cardamom-infused khoya gulab jamuns paired with Madagascar vanilla ice cream and roasted pistachios.",
        price: 160,
        isVeg: true,
        image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80",
        rating: 4.7,
        reviewsCount: 330,
      },
    ],
  },
  // 7. Biryani House -> Biryani
  {
    restaurantMatch: "Biryani House",
    items: [
      {
        name: "Hyderabadi Dum Paneer Biryani",
        category: "Biryani",
        description: "Slow-dum cooked long grain basmati infused with saffron milk, marinated paneer cubes, mint leaves, and golden brown fried onions.",
        price: 290,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviewsCount: 540,
      },
      {
        name: "Nawabi Subz Dum Biryani",
        category: "Biryani",
        description: "Garden fresh carrots, French beans, cauliflower and green peas simmered in secret Nawabi spices with fragrant basmati.",
        price: 260,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
        rating: 4.7,
        reviewsCount: 390,
      },
    ],
  },
  // 8. Spice Garden -> Paneer Tikka
  {
    restaurantMatch: "Spice Garden",
    items: [
      {
        name: "Classic Charcoal Tandoori Paneer Tikka",
        category: "Paneer Tikka",
        description: "Juicy chunks of malai paneer marinated in hung curd, Kashmiri deggi mirch, and roasted spices, skewered and charred over charcoal.",
        price: 270,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        reviewsCount: 510,
      },
      {
        name: "Afghani Malai Paneer Tikka",
        category: "Paneer Tikka",
        description: "Silky cottage cheese cubes marinated in rich cashew cream, grated cheese, cardamom, and white pepper, roasted till golden.",
        price: 295,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviewsCount: 370,
      },
      {
        name: "Achari Tandoori Paneer Tikka",
        category: "Paneer Tikka",
        description: "Tangy pickled spiced paneer char-roasted with onion bulbs and sweet bell peppers, served with fresh mint chutney.",
        price: 280,
        isVeg: true,
        image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80",
        rating: 4.7,
        reviewsCount: 280,
      },
    ],
  },
  // 9. Pizza Palace -> Pizza
  {
    restaurantMatch: "Pizza Palace",
    items: [
      {
        name: "Signature Farmhouse Delight Pizza",
        category: "Pizza",
        description: "Loaded with button mushrooms, green capsicum, juicy sweet corn kernels, diced tomatoes and 100% mozzarella cheese.",
        price: 360,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviewsCount: 440,
      },
      {
        name: "Spicy Peri Peri Paneer Pizza",
        category: "Pizza",
        description: "Spicy peri peri marinated paneer chunks, red paprika, golden corn and crisp onions on hand-tossed crust.",
        price: 390,
        isVeg: true,
        isTrending: true,
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
        rating: 4.7,
        reviewsCount: 390,
      },
    ],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB for seeding trending category dishes");

  let addedTotal = 0;

  for (const group of itemsToSeed) {
    const restaurant = await Restaurant.findOne({
      name: new RegExp(group.restaurantMatch, "i"),
    });

    if (!restaurant) {
      console.log(`Restaurant not found for regex: ${group.restaurantMatch}`);
      continue;
    }

    console.log(`Processing ${restaurant.name} (${restaurant._id})...`);

    for (const itemData of group.items) {
      const existing = await MenuItem.findOne({
        restaurant: restaurant._id,
        name: itemData.name,
      });

      if (!existing) {
        await MenuItem.create({
          restaurant: restaurant._id,
          name: itemData.name,
          category: itemData.category,
          description: itemData.description,
          price: itemData.price,
          isVeg: itemData.isVeg,
          inStock: true,
          isAvailable: true,
          rating: itemData.rating,
          reviewsCount: itemData.reviewsCount,
          isTrending: itemData.isTrending || false,
          image: itemData.image,
        });
        addedTotal++;
        console.log(`  + Added: ${itemData.name} [${itemData.category}]`);
      } else {
        console.log(`  = Already exists: ${itemData.name}`);
      }
    }
  }

  console.log(`Seeding complete! Added ${addedTotal} new dishes.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
