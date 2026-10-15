import Favorite from "../models/Favorite.js";

// @desc    Get all favorites of current customer
// @route   GET /api/favorites
// @access  Private
export const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate("restaurant", "name slug image rating deliveryTime priceForTwo")
      .populate("menuItem", "name price image rating isVeg");

    res.json({
      success: true,
      count: favorites.length,
      favorites,
    });
  } catch (error) {
    console.error("Get Favorites Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching favorites.",
      error: error.message,
    });
  }
};

// @desc    Toggle favorite on/off
// @route   POST /api/favorites
// @access  Private
export const toggleFavorite = async (req, res) => {
  try {
    const rawType = req.body.targetType || req.body.itemType || "restaurant";
    const rawId = req.body.targetId || req.body.restaurantId || req.body.menuItemId;

    if (!rawId) {
      return res.status(400).json({
        success: false,
        message: "Target ID is required.",
      });
    }

    const targetType =
      rawType === "dish" || rawType === "menuItem" ? "dish" : "restaurant";

    const query = {
      user: req.user._id,
      targetType,
    };

    if (targetType === "dish") {
      query.menuItem = rawId;
    } else {
      query.restaurant = rawId;
    }

    const existing = await Favorite.findOne(query);

    if (existing) {
      await Favorite.findByIdAndDelete(existing._id);
      return res.json({
        success: true,
        isFavorite: false,
        message: "Removed from favorites.",
      });
    }

    await Favorite.create(query);
    res.json({
      success: true,
      isFavorite: true,
      message: "Saved to favorites!",
    });
  } catch (error) {
    console.error("Toggle Favorite Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error toggling favorite.",
      error: error.message,
    });
  }
};
