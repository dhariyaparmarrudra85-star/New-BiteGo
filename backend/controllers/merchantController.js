import MerchantApplication from "../models/MerchantApplication.js";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import { notifyMerchantApplication, notifyOrderStateChange } from "../utils/notificationService.js";

// Helper to get or link restaurant for authenticated merchant
const getMerchantRestaurantHelper = async (userId) => {
  let restaurant = await Restaurant.findOne({
    $or: [{ merchantUser: userId }, { owner: userId }],
  });
  if (!restaurant) {
    const app = await MerchantApplication.findOne({ userId, status: "approved" });
    if (app) {
      const baseSlug = app.restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const existingSlug = await Restaurant.findOne({ slug: baseSlug });
      const slug = existingSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

      restaurant = await Restaurant.create({
        name: app.restaurantName,
        slug,
        address: app.address,
        hub: app.hub || "Bodakdev Hub",
        cuisine: [app.category],
        description: app.description || "Authentic culinary creations crafted with passion.",
        image:
          app.photo ||
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
        merchantUser: userId,
        isOpen: true,
      });
    }
  }
  return restaurant;
};

// @desc    Submit merchant onboarding application
// @route   POST /api/merchant/apply
// @access  Private (Authenticated User)
export const applyMerchant = async (req, res) => {
  try {
    const {
      restaurantName,
      ownerName,
      phone,
      address,
      hub = "Bodakdev Hub",
      category,
      description = "",
      photo = "",
      fssaiNumber,
      gstin = "",
      requestedCommission = 18.0,
      documents = [],
    } = req.body;

    // Validation
    if (!restaurantName || !ownerName || !phone || !address || !category || !fssaiNumber) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields (restaurant name, owner name, phone, address, category, FSSAI number).",
      });
    }

    const userId = req.user._id;

    // Check if an application already exists
    let application = await MerchantApplication.findOne({ userId });

    if (application) {
      application.restaurantName = restaurantName;
      application.ownerName = ownerName;
      application.email = req.user.email;
      application.phone = phone;
      application.address = address;
      application.hub = hub;
      application.category = category;
      application.description = description;
      application.photo = photo;
      application.fssaiNumber = fssaiNumber;
      application.gstin = gstin;
      application.requestedCommission = requestedCommission;
      application.documents = documents;
      application.status = "pending";
      application.rejectionReason = null;
      await application.save();
    } else {
      application = await MerchantApplication.create({
        userId,
        restaurantName,
        ownerName,
        email: req.user.email,
        phone,
        address,
        hub,
        category,
        description,
        photo,
        fssaiNumber,
        gstin,
        requestedCommission,
        documents,
        status: "pending",
      });
    }

    // Update user role to merchant and status to pending
    await User.findByIdAndUpdate(userId, {
      role: "merchant",
      verificationStatus: "pending",
      rejectionReason: null,
      phone: phone,
    });

    // Notify Platform Admins & Super Admin
    await notifyMerchantApplication(application);

    res.status(201).json({
      success: true,
      message:
        "Your merchant application has been submitted and is currently under review by BiteGo administrators.",
      application,
    });
  } catch (error) {
    console.error("Apply Merchant Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error submitting merchant application.",
      error: error.message,
    });
  }
};

// @desc    Get current user's merchant application status
// @route   GET /api/merchant/application
// @access  Private
export const getMyApplication = async (req, res) => {
  try {
    const application = await MerchantApplication.findOne({
      userId: req.user._id,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "No merchant application found for this account.",
      });
    }

    res.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Get Merchant Application Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching merchant application.",
    });
  }
};

// =========================================================================
// RESTAURANT MANAGEMENT
// =========================================================================

// @desc    Get merchant's own restaurant details
// @route   GET /api/merchant/restaurant
// @access  Private (Approved Merchant)
export const getMerchantRestaurant = async (req, res) => {
  try {
    const restaurant = await getMerchantRestaurantHelper(req.user._id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "No restaurant found associated with this merchant account.",
      });
    }

    res.json({
      success: true,
      restaurant,
    });
  } catch (error) {
    console.error("Get Merchant Restaurant Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching restaurant details.",
    });
  }
};

// @desc    Update merchant's restaurant profile
// @route   PUT /api/merchant/restaurant
// @access  Private (Approved Merchant)
export const updateMerchantRestaurant = async (req, res) => {
  try {
    const restaurant = await getMerchantRestaurantHelper(req.user._id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant profile not found for this merchant.",
      });
    }

    const {
      name,
      description,
      image,
      logo,
      banner,
      address,
      hub,
      cuisine,
      priceForTwo,
      deliveryTime,
      isOpen,
      isPureVeg,
    } = req.body;

    if (name) restaurant.name = name;
    if (description !== undefined) restaurant.description = description;
    if (image) restaurant.image = image;
    if (logo !== undefined) restaurant.logo = logo;
    if (banner !== undefined) restaurant.banner = banner;
    if (address) restaurant.address = address;
    if (hub) restaurant.hub = hub;
    if (cuisine) restaurant.cuisine = Array.isArray(cuisine) ? cuisine : [cuisine];
    if (priceForTwo) restaurant.priceForTwo = priceForTwo;
    if (deliveryTime) restaurant.deliveryTime = deliveryTime;
    if (isOpen !== undefined) restaurant.isOpen = Boolean(isOpen);
    if (isPureVeg !== undefined) restaurant.isPureVeg = Boolean(isPureVeg);

    await restaurant.save();

    res.json({
      success: true,
      message: "Restaurant profile updated successfully.",
      restaurant,
    });
  } catch (error) {
    console.error("Update Merchant Restaurant Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating restaurant profile.",
      error: error.message,
    });
  }
};

// @desc    Toggle restaurant open/closed status
// @route   PATCH /api/merchant/restaurant/status
// @access  Private (Approved Merchant)
export const toggleRestaurantStatus = async (req, res) => {
  try {
    const restaurant = await getMerchantRestaurantHelper(req.user._id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant profile not found.",
      });
    }

    const { isOpen } = req.body;
    restaurant.isOpen = isOpen !== undefined ? Boolean(isOpen) : !restaurant.isOpen;
    await restaurant.save();

    res.json({
      success: true,
      message: `Store taking orders is now ${restaurant.isOpen ? "OPEN" : "CLOSED"}.`,
      isOpen: restaurant.isOpen,
      restaurant,
    });
  } catch (error) {
    console.error("Toggle Restaurant Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error toggling restaurant status.",
    });
  }
};

// =========================================================================
// MENU MANAGEMENT
// =========================================================================

// @desc    Get menu items for merchant's restaurant
// @route   GET /api/merchant/menu
// @access  Private (Approved Merchant)
export const getMerchantMenuItems = async (req, res) => {
  try {
    const restaurant = await getMerchantRestaurantHelper(req.user._id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant profile not found.",
      });
    }

    const items = await MenuItem.find({ restaurant: restaurant._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error("Get Merchant Menu Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching menu items.",
    });
  }
};

// @desc    Add new food item to restaurant menu
// @route   POST /api/merchant/menu
// @access  Private (Approved Merchant)
export const addMerchantMenuItem = async (req, res) => {
  try {
    const restaurant = await getMerchantRestaurantHelper(req.user._id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant profile not found.",
      });
    }

    const {
      name,
      description = "",
      category,
      price,
      image,
      isVeg = true,
      inStock = true,
      isAvailable = true,
      customizationGroups = [],
    } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({
        success: false,
        message: "Please provide item name, price, and category.",
      });
    }

    const newItem = await MenuItem.create({
      restaurant: restaurant._id,
      name,
      description,
      category,
      price: Number(price),
      image:
        image ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
      isVeg: Boolean(isVeg),
      inStock: Boolean(inStock),
      isAvailable: Boolean(isAvailable),
      customizationGroups,
    });

    res.status(201).json({
      success: true,
      message: `Dish "${newItem.name}" added to menu catalog successfully.`,
      item: newItem,
    });
  } catch (error) {
    console.error("Add Merchant Menu Item Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error adding menu item.",
      error: error.message,
    });
  }
};

// @desc    Update existing menu item
// @route   PUT /api/merchant/menu/:id
// @access  Private (Approved Merchant)
export const updateMerchantMenuItem = async (req, res) => {
  try {
    const restaurant = await getMerchantRestaurantHelper(req.user._id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant profile not found.",
      });
    }

    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }

    // Security check: Merchant can only edit items belonging to their own restaurant
    if (item.restaurant.toString() !== restaurant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You cannot modify dishes belonging to another restaurant.",
      });
    }

    const {
      name,
      description,
      category,
      price,
      image,
      isVeg,
      inStock,
      isAvailable,
      customizationGroups,
    } = req.body;

    if (name) item.name = name;
    if (description !== undefined) item.description = description;
    if (category) item.category = category;
    if (price !== undefined) item.price = Number(price);
    if (image) item.image = image;
    if (isVeg !== undefined) item.isVeg = Boolean(isVeg);
    if (inStock !== undefined) item.inStock = Boolean(inStock);
    if (isAvailable !== undefined) item.isAvailable = Boolean(isAvailable);
    if (customizationGroups !== undefined) item.customizationGroups = customizationGroups;

    await item.save();

    res.json({
      success: true,
      message: `Menu item "${item.name}" updated successfully.`,
      item,
    });
  } catch (error) {
    console.error("Update Menu Item Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating menu item.",
      error: error.message,
    });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/merchant/menu/:id
// @access  Private (Approved Merchant)
export const deleteMerchantMenuItem = async (req, res) => {
  try {
    const restaurant = await getMerchantRestaurantHelper(req.user._id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant profile not found.",
      });
    }

    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }

    // Security check: Merchant can only delete items belonging to their own restaurant
    if (item.restaurant.toString() !== restaurant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You cannot delete dishes belonging to another restaurant.",
      });
    }

    await item.deleteOne();

    res.json({
      success: true,
      message: `Dish "${item.name}" has been removed from menu catalog.`,
    });
  } catch (error) {
    console.error("Delete Menu Item Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting menu item.",
    });
  }
};

// @desc    Toggle dish availability (inStock / isAvailable)
// @route   PATCH /api/merchant/menu/:id/availability
// @access  Private (Approved Merchant)
export const toggleMenuItemAvailability = async (req, res) => {
  try {
    const restaurant = await getMerchantRestaurantHelper(req.user._id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant profile not found.",
      });
    }

    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }

    if (item.restaurant.toString() !== restaurant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You cannot modify dishes belonging to another restaurant.",
      });
    }

    const { inStock, isAvailable } = req.body;
    if (inStock !== undefined) item.inStock = Boolean(inStock);
    if (isAvailable !== undefined) item.isAvailable = Boolean(isAvailable);
    if (inStock === undefined && isAvailable === undefined) {
      item.inStock = !item.inStock;
      item.isAvailable = item.inStock;
    }

    await item.save();

    res.json({
      success: true,
      message: `Dish "${item.name}" is now ${item.inStock ? "IN STOCK" : "OUT OF STOCK"}.`,
      item,
    });
  } catch (error) {
    console.error("Toggle Menu Item Availability Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating item availability.",
    });
  }
};

// =========================================================================
// ORDERS MANAGEMENT
// =========================================================================

// @desc    Get merchant's own restaurant orders
// @route   GET /api/merchant/orders
// @access  Private (Approved Merchant)
export const getMerchantOrders = async (req, res) => {
  try {
    const restaurant = await getMerchantRestaurantHelper(req.user._id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant profile not found.",
      });
    }

    const { status } = req.query;
    const filter = { restaurant: restaurant._id };

    if (status) {
      if (status === "incoming") {
        filter.orderStatus = { $in: ["PLACED"] };
      } else if (status === "preparing") {
        filter.orderStatus = { $in: ["CONFIRMED", "PREPARING"] };
      } else if (status === "ready") {
        filter.orderStatus = { $in: ["READY_FOR_PICKUP"] };
      } else if (status === "dispatched") {
        filter.orderStatus = { $in: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"] };
      } else if (status === "completed") {
        filter.orderStatus = "DELIVERED";
      } else if (status === "cancelled") {
        filter.orderStatus = "CANCELLED";
      } else {
        filter.orderStatus = status.toUpperCase();
      }
    }

    const orders = await Order.find(filter)
      .populate("customer", "name email phone")
      .populate("deliveryPartner", "name phone vehicleType rating profilePhoto")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get Merchant Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching merchant orders.",
    });
  }
};

// @desc    Update order lifecycle stage by Merchant
// @route   PATCH /api/merchant/orders/:id/status
// @access  Private (Approved Merchant)
export const updateMerchantOrderStatus = async (req, res) => {
  try {
    const restaurant = await getMerchantRestaurantHelper(req.user._id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant profile not found.",
      });
    }

    const { id } = req.params;
    let { status, note } = req.body;

    // Standardize status format
    if (typeof status === "string") {
      const normalized = status.toUpperCase().trim().replace(/\s+/g, "_");
      if (
        normalized === "READY_AT_COUNTER" ||
        normalized === "READY" ||
        normalized === "READY_FOR_PICKUP"
      ) {
        status = "READY_FOR_PICKUP";
      } else {
        status = normalized;
      }
    }

    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { orderNumber: id.toUpperCase() };

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order ticket not found.",
      });
    }

    // STRICT ISOLATION CHECK: Merchant A must NEVER touch Merchant B's orders
    if (order.restaurant.toString() !== restaurant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Security violation: You can only manage orders belonging to your own restaurant.",
      });
    }

    // RESTRICTION: Merchant can only manage kitchen prep stages
    // Merchant can: PLACED -> CONFIRMED / CANCELLED -> PREPARING -> READY_FOR_PICKUP
    // Merchant must NOT mark orders as delivered, out for delivery, or picked up!
    const allowedMerchantStatuses = [
      "CONFIRMED",
      "PREPARING",
      "READY_FOR_PICKUP",
      "CANCELLED",
    ];

    if (["DELIVERED", "OUT_FOR_DELIVERY", "PICKED_UP", "ASSIGNED"].includes(status)) {
      return res.status(403).json({
        success: false,
        message:
          "Merchants cannot advance order to delivery stages or mark as delivered. This lifecycle action is reserved for delivery fleet partners upon OTP verification.",
      });
    }

    if (!allowedMerchantStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed merchant statuses: ${allowedMerchantStatuses.join(", ")}`,
      });
    }

    const validMerchantTransitions = {
      PLACED: ["CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "CANCELLED"],
      CONFIRMED: ["PREPARING", "READY_FOR_PICKUP", "CANCELLED"],
      PREPARING: ["READY_FOR_PICKUP"],
      READY_FOR_PICKUP: ["READY_FOR_PICKUP"],
    };

    const allowedTransitions = validMerchantTransitions[order.orderStatus] || [];
    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition order from '${order.orderStatus}' to '${status}'.`,
      });
    }

    order.orderStatus = status;
    order.statusTimeline.push({
      status,
      timestamp: new Date(),
      note: note || `Kitchen updated status to ${status}`,
    });

    if (status === "CANCELLED") {
      order.cancellationReason = note || "Declined/cancelled by merchant kitchen";
      if (order.paymentStatus === "SUCCESS" || order.paymentStatus === "paid") {
        order.paymentStatus = "REFUNDED";
        if (!order.paymentDetails) order.paymentDetails = {};
        order.paymentDetails.refundedAt = new Date();
        order.paymentDetails.refundAmount = order.totalAmount;
      }
    }

    await order.save();

    if (status === "READY_FOR_PICKUP") {
      console.log(
        `[Merchant] Order #${order.orderNumber} (${order._id}) marked ready at counter -> resulting status: READY_FOR_PICKUP`
      );
    }

    // Trigger cross-role notification
    await notifyOrderStateChange(order, status, { note });

    res.json({
      success: true,
      message: `Order #${order.orderNumber} updated to ${status}.`,
      order,
    });
  } catch (error) {
    console.error("Update Merchant Order Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating order status.",
      error: error.message,
    });
  }
};

// =========================================================================
// DASHBOARD & ANALYTICS
// =========================================================================

// @desc    Get real-time merchant dashboard telemetry from MongoDB
// @route   GET /api/merchant/dashboard
// @access  Private (Approved Merchant)
export const getMerchantDashboard = async (req, res) => {
  try {
    const restaurant = await getMerchantRestaurantHelper(req.user._id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant profile not found.",
      });
    }

    const restId = restaurant._id;

    // Time boundaries
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Queries in parallel
    const [
      allOrders,
      todayOrders,
      pendingOrdersCount,
      completedOrdersCount,
      pausedDishesCount,
    ] = await Promise.all([
      Order.find({ restaurant: restId })
        .populate("customer", "name phone")
        .populate("deliveryPartner", "name phone vehicleType")
        .sort({ createdAt: -1 }),
      Order.find({ restaurant: restId, createdAt: { $gte: startOfDay } }),
      Order.countDocuments({
        restaurant: restId,
        orderStatus: { $in: ["PLACED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP"] },
      }),
      Order.countDocuments({ restaurant: restId, orderStatus: "DELIVERED" }),
      MenuItem.countDocuments({
        restaurant: restId,
        $or: [{ inStock: false }, { isAvailable: false }],
      }),
    ]);

    // Financial calculations
    const todayRevenue = todayOrders
      .filter((o) => o.orderStatus !== "CANCELLED")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const netRevenue = allOrders
      .filter((o) => o.orderStatus !== "CANCELLED")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Top selling dishes calculation
    const itemMap = {};
    for (const ord of allOrders) {
      if (ord.orderStatus === "CANCELLED") continue;
      for (const it of ord.items || []) {
        const title = it.name || "Special Dish";
        if (!itemMap[title]) {
          itemMap[title] = { name: title, orders: 0, revenue: 0, price: it.price || 0 };
        }
        itemMap[title].orders += it.quantity || 1;
        itemMap[title].revenue += (it.price || 0) * (it.quantity || 1);
      }
    }

    const topDishes = Object.values(itemMap)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5)
      .map((d, idx) => ({
        rank: idx + 1,
        name: d.name,
        orders: d.orders,
        rev: `₹${d.revenue.toFixed(2)}`,
        rating: (4.6 + (idx % 3) * 0.1).toFixed(1) + "★",
      }));

    // Pipeline active counts
    const incomingCount = allOrders.filter((o) => o.orderStatus === "PLACED").length;
    const prepCount = allOrders.filter((o) =>
      ["CONFIRMED", "PREPARING"].includes(o.orderStatus)
    ).length;
    const readyCount = allOrders.filter((o) => o.orderStatus === "READY_FOR_PICKUP").length;
    const dispatchedCount = allOrders.filter((o) =>
      ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(o.orderStatus)
    ).length;

    res.json({
      success: true,
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        address: restaurant.address,
        hub: restaurant.hub,
        isOpen: restaurant.isOpen,
        rating: restaurant.rating,
        numRatings: restaurant.numRatings,
        cuisine: restaurant.cuisine,
        image: restaurant.image,
      },
      metrics: {
        todayOrders: todayOrders.length,
        todayRevenue,
        netRevenue,
        activeQueue: pendingOrdersCount,
        pendingOrders: pendingOrdersCount,
        completedOrders: completedOrdersCount,
        pausedDishes: pausedDishesCount,
        storeRating: `${restaurant.rating} / 5.0`,
        numRatings: restaurant.numRatings,
        pipeline: {
          incoming: incomingCount,
          preparing: prepCount,
          ready: readyCount,
          dispatched: dispatchedCount,
        },
      },
      topDishes,
      recentOrders: allOrders.slice(0, 15),
    });
  } catch (error) {
    console.error("Get Merchant Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error calculating merchant telemetry.",
      error: error.message,
    });
  }
};
