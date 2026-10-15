import Cart from "../models/Cart.js";

// @desc    Get user's current saved cart
// @route   GET /api/cart
// @access  Private (Customer)
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate("restaurant", "name slug address deliveryTime rating isOpen")
      .populate("items.menuItemId", "name price isAvailable inStock image isVeg");

    if (!cart) {
      return res.json({
        success: true,
        cart: {
          items: [],
          activeRestaurant: null,
          appliedCoupon: null,
        },
      });
    }

    res.json({
      success: true,
      cart: {
        items: cart.items || [],
        activeRestaurant: cart.restaurant
          ? {
              id: cart.restaurant._id,
              _id: cart.restaurant._id,
              name: cart.restaurant.name,
              isOpen: cart.restaurant.isOpen,
            }
          : cart.restaurantName
          ? { name: cart.restaurantName }
          : null,
        appliedCoupon: cart.appliedCoupon || null,
      },
    });
  } catch (error) {
    console.error("Get Cart Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching cart.",
      error: error.message,
    });
  }
};

// @desc    Sync / update user's cart in MongoDB
// @route   POST /api/cart
// @access  Private (Customer)
export const syncCart = async (req, res) => {
  try {
    const { items = [], activeRestaurant = null, appliedCoupon = null } = req.body;

    const restaurantId =
      activeRestaurant?.id ||
      activeRestaurant?._id ||
      (items.length > 0 ? items[0].restaurantId : null);

    const restaurantName =
      activeRestaurant?.name ||
      (items.length > 0 ? items[0].restaurant : "");

    const formattedItems = (items || []).map((item) => ({
      cartItemId: item.cartItemId || `${item.id || item._id}_plain`,
      menuItemId: item.menuItemId || item.id || item._id,
      name: item.name,
      price: Number(item.price) || 0,
      basePrice: Number(item.basePrice) || Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      image: item.image || "",
      isVeg: item.isVeg !== undefined ? item.isVeg : true,
      customizations: item.customizations || [],
      customizationText: item.customizationText || "",
      restaurant: item.restaurant || restaurantName,
      restaurantId: item.restaurantId || restaurantId,
    }));

    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        restaurant: restaurantId && restaurantId.toString().match(/^[0-9a-fA-F]{24}$/) ? restaurantId : null,
        restaurantName: restaurantName || "",
        items: formattedItems,
        appliedCoupon: appliedCoupon || null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: "Cart synced successfully.",
      cart,
    });
  } catch (error) {
    console.error("Sync Cart Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error syncing cart.",
      error: error.message,
    });
  }
};

// @desc    Clear user's saved cart in MongoDB
// @route   DELETE /api/cart
// @access  Private (Customer)
export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.json({
      success: true,
      message: "Cart cleared successfully.",
    });
  } catch (error) {
    console.error("Clear Cart Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error clearing cart.",
      error: error.message,
    });
  }
};
