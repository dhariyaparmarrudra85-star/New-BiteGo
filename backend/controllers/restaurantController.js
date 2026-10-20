import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";

// @desc    Get all restaurants with filters, search, and sorting
// @route   GET /api/restaurants
// @access  Public
export const getAllRestaurants = async (req, res) => {
  try {
    const { search, cuisine, isPureVeg, sortBy, minRating, hub } = req.query;

    const query = { isOpen: true };

    if (search && search.trim()) {
      const q = search.trim();
      // Also find restaurants offering dishes matching the search query
      const matchingItems = await MenuItem.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { category: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
        ],
      }).select("restaurant");
      const matchedRestaurantIds = matchingItems
        .map((i) => i.restaurant)
        .filter(Boolean);

      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { cuisine: { $regex: q, $options: "i" } },
        { _id: { $in: matchedRestaurantIds } },
      ];
    }

    if (cuisine) {
      query.cuisine = { $regex: cuisine, $options: "i" };
    }

    if (isPureVeg === "true" || isPureVeg === true) {
      query.isPureVeg = true;
    }

    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    if (hub) {
      query.hub = { $regex: hub, $options: "i" };
    }

    let sortOption = { rating: -1 };
    if (sortBy === "rating-desc") sortOption = { rating: -1 };
    if (sortBy === "time-asc") sortOption = { deliveryNumeric: 1 };
    if (sortBy === "cost-asc") sortOption = { costNumeric: 1 };
    if (sortBy === "cost-desc") sortOption = { costNumeric: -1 };

    const restaurants = await Restaurant.find(query).sort(sortOption);

    res.json({
      success: true,
      count: restaurants.length,
      restaurants,
      data: restaurants,
    });
  } catch (error) {
    console.error("Get Restaurants Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching restaurants.",
      error: error.message,
    });
  }
};

// @desc    Get single restaurant by ID or slug
// @route   GET /api/restaurants/:id
// @access  Public
export const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    let restaurant;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      restaurant = await Restaurant.findById(id);
    }
    if (!restaurant) {
      restaurant = await Restaurant.findOne({ slug: id });
    }

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    res.json({
      success: true,
      restaurant,
      data: restaurant,
    });
  } catch (error) {
    console.error("Get Restaurant Detail Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching restaurant details.",
      error: error.message,
    });
  }
};

// @desc    Get menu items grouped by category for a restaurant
// @route   GET /api/restaurants/:id/menu
// @access  Public
export const getRestaurantMenu = async (req, res) => {
  try {
    const { id } = req.params;
    let restaurantId = id;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      const rest = await Restaurant.findOne({ slug: id });
      if (!rest) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found.",
        });
      }
      restaurantId = rest._id;
    }

    const items = await MenuItem.find({
      restaurant: restaurantId,
      isAvailable: true,
    });

    // Group items by category
    const categoriesMap = {};
    items.forEach((item) => {
      const cat = item.category || "General";
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = [];
      }
      categoriesMap[cat].push(item);
    });

    const menu = Object.keys(categoriesMap).map((categoryName) => ({
      category: categoryName,
      items: categoriesMap[categoryName],
    }));

    res.json({
      success: true,
      totalItems: items.length,
      menu,
      items,
      data: { menu, items },
    });
  } catch (error) {
    console.error("Get Restaurant Menu Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching restaurant menu.",
      error: error.message,
    });
  }
};

// @desc    Get trending dishes across popular restaurants
// @route   GET /api/restaurants/trending-dishes
// @access  Public
export const getTrendingDishes = async (req, res) => {
  try {
    const trendingItems = await MenuItem.find({
      isTrending: true,
      isAvailable: true,
    }).populate("restaurant", "name slug address deliveryTime rating");

    const dishes = trendingItems.map((item) => ({
      id: item._id,
      _id: item._id,
      name: item.name,
      restaurant: item.restaurant?.name || "The Dark Roast Pizzeria",
      restaurantId: item.restaurant?._id,
      price: item.price,
      rating: item.rating,
      reviews: `${item.reviewsCount}+`,
      type: item.isVeg ? "Veg" : "Non-Veg",
      isVeg: item.isVeg,
      image: item.image,
      category: item.category,
      customizationGroups: item.customizationGroups,
    }));

    res.json({
      success: true,
      count: trendingItems.length,
      dishes,
      data: dishes,
    });
  } catch (error) {
    console.error("Get Trending Dishes Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching trending dishes.",
      error: error.message,
    });
  }
};

// @desc    Get dynamic food categories from real MongoDB data
// @route   GET /api/restaurants/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categoryNames = await MenuItem.distinct("category");

    const categoryImageMap = {
      "Woodfired Pizzas": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80",
      "Gourmet Burgers": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80",
      "Biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80",
      "Kathiyawadi Thali": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=300&q=80",
      "Thali Combos": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=300&q=80",
      "South Indian": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=300&q=80",
      "Pastas": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=300&q=80",
      "Chaat & Street Bites": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=300&q=80",
      "Desserts": "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=300&q=80",
      "Mithai & Sweets": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=300&q=80",
      "Beverages": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=300&q=80",
      "Thickshakes & Coolers": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80",
      "Artisanal Breads": "https://images.unsplash.com/photo-1573821663912-569905455b1a?auto=format&fit=crop&w=300&q=80",
      "Breakfast & Farsan": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=300&q=80",
      "Farsan & Starters": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=300&q=80",
    };

    const categories = await Promise.all(
      categoryNames.map(async (name) => {
        const itemCount = await MenuItem.countDocuments({
          category: name,
          isAvailable: true,
        });
        const sampleItem = await MenuItem.findOne({
          category: name,
          image: { $exists: true, $ne: "" },
        }).select("image");

        return {
          id: name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          name,
          itemCount,
          image:
            sampleItem?.image ||
            categoryImageMap[name] ||
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80",
        };
      })
    );

    res.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching categories.",
      error: error.message,
    });
  }
};

// @desc    Unified backend search across restaurants and dishes
// @route   GET /api/restaurants/search
// @access  Public
export const searchRestaurantsAndDishes = async (req, res) => {
  try {
    const query = req.query.q || req.query.query || req.query.search || "";
    if (!query.trim()) {
      return res.json({
        success: true,
        restaurants: [],
        dishes: [],
      });
    }

    const q = query.trim();

    // 1. Find matching dishes
    const matchingDishes = await MenuItem.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
      isAvailable: true,
    })
      .populate("restaurant", "name slug address deliveryTime rating isOpen")
      .limit(20);

    const dishRestaurantIds = matchingDishes
      .map((d) => d.restaurant?._id)
      .filter(Boolean);

    // 2. Find matching restaurants
    const matchingRestaurants = await Restaurant.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { cuisine: { $regex: q, $options: "i" } },
        { _id: { $in: dishRestaurantIds } },
      ],
      isOpen: true,
    }).limit(20);

    res.json({
      success: true,
      query: q,
      restaurants: matchingRestaurants,
      dishes: matchingDishes,
    });
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error performing search.",
      error: error.message,
    });
  }
};

// @desc    Get all dishes for a specific category across all open restaurants
// @route   GET /api/restaurants/category/:category
// @access  Public
export const getCategoryDishes = async (req, res) => {
  try {
    const rawCategory = req.params.category || "";
    const cleanCategory = decodeURIComponent(rawCategory).trim().replace(/-/g, " ");

    if (!cleanCategory) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const lower = cleanCategory.toLowerCase();
    let queryFilter = {};

    if (lower === "pizza") {
      queryFilter = {
        $or: [
          { category: { $regex: /pizza/i } },
          { name: { $regex: /pizza/i } },
        ],
      };
    } else if (lower.startsWith("burger")) {
      queryFilter = {
        $or: [
          { category: { $regex: /burger/i } },
          { name: { $regex: /burger/i } },
        ],
      };
    } else if (lower === "biryani") {
      queryFilter = {
        $or: [
          { category: { $regex: /biryani/i } },
          { name: { $regex: /biryani/i } },
        ],
      };
    } else if (lower.startsWith("momo")) {
      queryFilter = {
        $or: [
          { category: { $regex: /momo/i } },
          { name: { $regex: /momo/i } },
        ],
      };
    } else if (lower === "chaat") {
      queryFilter = {
        $or: [
          { category: { $regex: /chaat/i } },
          { name: { $regex: /chaat|puri|bhel/i } },
        ],
      };
    } else if (lower === "dosa") {
      queryFilter = {
        $or: [
          { category: { $regex: /dosa/i } },
          { name: { $regex: /dosa/i } },
        ],
      };
    } else if (lower.includes("paneer tikka")) {
      queryFilter = {
        $or: [
          { category: { $regex: /paneer tikka/i } },
          { name: { $regex: /paneer tikka/i } },
        ],
      };
    } else if (lower.includes("fried rice")) {
      queryFilter = {
        $or: [
          { category: { $regex: /fried rice/i } },
          { name: { $regex: /fried rice/i } },
        ],
      };
    } else if (lower.startsWith("sandwich")) {
      queryFilter = {
        $or: [
          { category: { $regex: /sandwich/i } },
          { name: { $regex: /sandwich/i } },
        ],
      };
    } else if (lower.startsWith("dessert")) {
      queryFilter = {
        $or: [
          { category: { $regex: /dessert|sweet|mithai/i } },
          { name: { $regex: /brownie|sundae|cake|pastry|dessert|cheesecake|jamun/i } },
        ],
      };
    } else {
      queryFilter = {
        $or: [
          { category: { $regex: new RegExp(cleanCategory, "i") } },
          { name: { $regex: new RegExp(cleanCategory, "i") } },
        ],
      };
    }

    // Only available dishes
    queryFilter.isAvailable = true;

    // Fetch items with populated restaurant details
    const dishes = await MenuItem.find(queryFilter)
      .populate("restaurant", "name slug address deliveryTime rating isOpen isPureVeg image")
      .sort({ rating: -1, price: 1 });

    // Filter to include dishes ONLY from open restaurants
    const availableDishes = dishes.filter(
      (d) => d.restaurant && d.restaurant.isOpen
    );

    const formattedDishes = availableDishes.map((item) => ({
      _id: item._id,
      id: item._id,
      name: item.name,
      description: item.description || "",
      price: item.price,
      isVeg: item.isVeg,
      rating: item.rating || 4.8,
      reviewsCount: item.reviewsCount || 120,
      image: item.image,
      category: item.category,
      inStock: item.inStock,
      isAvailable: item.isAvailable,
      restaurant: item.restaurant,
      restaurantId: item.restaurant?._id,
      restaurantName: item.restaurant?.name || "BiteGo Restaurant",
      customizationGroups: item.customizationGroups || [],
    }));

    res.json({
      success: true,
      category: cleanCategory,
      total: formattedDishes.length,
      dishes: formattedDishes,
    });
  } catch (error) {
    console.error("Get Category Dishes Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching category dishes.",
      error: error.message,
    });
  }
};


