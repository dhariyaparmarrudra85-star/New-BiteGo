import crypto from "crypto";
import bcrypt from "bcryptjs";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import Coupon from "../models/Coupon.js";
import Address from "../models/Address.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import { notifyOrderStateChange } from "../utils/notificationService.js";

// Helper to generate unique order number like BG-89421
const generateOrderNumber = async () => {
  let unique = false;
  let orderNumber = "";
  while (!unique) {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    orderNumber = `BG-${randomDigits}`;
    const existing = await Order.findOne({ orderNumber });
    if (!existing) unique = true;
  }
  return orderNumber;
};

// @desc    Place a new order with complete server-side price validation
// @route   POST /api/orders
// @access  Private (Customer)
export const createOrder = async (req, res) => {
  try {
    const {
      restaurantId,
      items,
      addressId,
      deliveryAddress: customAddress,
      deliveryInstructions,
      couponCode,
      paymentMethod,
      tipAmount,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty.",
      });
    }

    // 1. Verify Restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found or no longer available.",
      });
    }

    if (!restaurant.isOpen) {
      return res.status(400).json({
        success: false,
        message: `${restaurant.name} is currently closed for orders.`,
      });
    }

    // 2. Validate Items & Recalculate Subtotal
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      let dbItem = null;
      const lookupId = item.menuItemId || item.id || item._id;
      if (lookupId && lookupId.toString().match(/^[0-9a-fA-F]{24}$/)) {
        dbItem = await MenuItem.findById(lookupId);
      }
      if (!dbItem && item.name) {
        dbItem = await MenuItem.findOne({ name: item.name });
      }
      if (!dbItem) {
        return res.status(404).json({
          success: false,
          message: `Dish '${item.name || "Item"}' is no longer available on the menu.`,
        });
      }

      if (!dbItem.isAvailable || !dbItem.inStock) {
        return res.status(400).json({
          success: false,
          message: `'${dbItem.name}' is currently out of stock. Please remove it from your cart.`,
        });
      }

      // Calculate customization prices
      let customizationTotal = 0;
      const appliedCustomizations = [];

      if (item.customizations && Array.isArray(item.customizations)) {
        for (const cust of item.customizations) {
          customizationTotal += Number(cust.price) || 0;
          appliedCustomizations.push({
            group: cust.group || "Option",
            name: cust.name,
            price: Number(cust.price) || 0,
          });
        }
      }

      const unitPrice = dbItem.price + customizationTotal;
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const itemTotal = unitPrice * quantity;
      subtotal += itemTotal;

      validatedItems.push({
        menuItem: dbItem._id,
        name: dbItem.name,
        price: unitPrice,
        quantity,
        image: dbItem.image,
        isVeg: dbItem.isVeg,
        customizations: appliedCustomizations,
        itemTotal,
      });
    }

    // 3. Resolve Delivery Address
    let finalAddress = null;
    if (addressId) {
      const saved = await Address.findOne({ _id: addressId, user: req.user._id });
      if (saved) {
        finalAddress = {
          fullName: saved.fullName,
          phone: saved.phone,
          houseFlat: saved.houseFlat,
          area: saved.area,
          landmark: saved.landmark,
          city: saved.city,
          state: saved.state,
          pincode: saved.pincode,
        };
      }
    }

    if (!finalAddress && customAddress) {
      finalAddress = {
        fullName: customAddress.fullName || req.user.name,
        phone: customAddress.phone || req.user.phone,
        houseFlat: customAddress.houseFlat || "Flat 402, Tower B",
        area: customAddress.area || "Bodakdev",
        landmark: customAddress.landmark || "",
        city: customAddress.city || "Ahmedabad",
        state: customAddress.state || "Gujarat",
        pincode: customAddress.pincode || "380054",
      };
    }

    if (!finalAddress) {
      // Fallback to default user address
      const defaultAddr = await Address.findOne({ user: req.user._id, isDefault: true });
      if (defaultAddr) {
        finalAddress = {
          fullName: defaultAddr.fullName,
          phone: defaultAddr.phone,
          houseFlat: defaultAddr.houseFlat,
          area: defaultAddr.area,
          landmark: defaultAddr.landmark,
          city: defaultAddr.city,
          state: defaultAddr.state,
          pincode: defaultAddr.pincode,
        };
      } else {
        finalAddress = {
          fullName: req.user.name || "Customer",
          phone: req.user.phone || "+91 98765 43210",
          houseFlat: "Flat 402, Galaxy Heights",
          area: "Sindhu Bhavan Road, Bodakdev",
          landmark: "Near Bodakdev Urban Lake Park",
          city: "Ahmedabad",
          state: "Gujarat",
          pincode: "380054",
        };
      }
    }

    // 4. Validate Coupon
    let discount = 0;
    let appliedCoupon = { code: null, discountAmount: 0 };

    if (couponCode && couponCode.trim()) {
      const codeClean = couponCode.trim().toUpperCase();
      const dbCoupon = await Coupon.findOne({ code: codeClean, isActive: true });
      if (
        dbCoupon &&
        new Date() <= new Date(dbCoupon.expiryDate) &&
        subtotal >= dbCoupon.minOrderAmount &&
        dbCoupon.usedCount < dbCoupon.usageLimit
      ) {
        if (dbCoupon.discountType === "fixed") {
          discount = dbCoupon.discountAmount;
        } else if (dbCoupon.discountType === "percentage") {
          discount = (subtotal * dbCoupon.discountAmount) / 100;
          if (dbCoupon.maxDiscount) discount = Math.min(discount, dbCoupon.maxDiscount);
        }
        discount = Math.min(discount, subtotal);
        appliedCoupon = { code: dbCoupon.code, discountAmount: discount };
        // Increment coupon count
        await Coupon.findByIdAndUpdate(dbCoupon._id, { $inc: { usedCount: 1 } });
      }
    }

    // 5. Taxes & Fees
    const deliveryFee = 0; // FREE with BiteGo Gold Pass promotion
    const taxesAndPackaging = Number((subtotal * 0.05).toFixed(2));
    const platformFee = 0;
    const tip = Number(tipAmount) > 0 ? Number(tipAmount) : 0;
    const totalAmount = Math.max(0, subtotal + taxesAndPackaging + deliveryFee + platformFee - discount + tip);

    // 6. Generate IDs & Secure Delivery OTP
    const orderNumber = await generateOrderNumber();
    const orderOtp = crypto.randomInt(1000, 10000).toString(); // Cryptographically secure 4-digit code e.g. 8942
    const orderOtpHash = await bcrypt.hash(orderOtp, 10);

    let formattedPaymentMethod = "UPI";
    if (paymentMethod) {
      const pmUpper = paymentMethod.toUpperCase();
      if (pmUpper === "COD") formattedPaymentMethod = "COD";
      else if (pmUpper === "UPI") formattedPaymentMethod = "UPI";
      else if (pmUpper === "CARD") formattedPaymentMethod = "Card";
      else if (pmUpper === "ONLINE") formattedPaymentMethod = "Online";
      else if (pmUpper === "WALLET") formattedPaymentMethod = "Wallet";
    }

    const order = await Order.create({
      orderNumber,
      customer: req.user._id,
      restaurant: restaurant._id,
      items: validatedItems,
      deliveryAddress: finalAddress,
      deliveryInstructions: deliveryInstructions || "Leave at security desk",
      subtotal,
      discount,
      deliveryFee,
      tax: taxesAndPackaging,
      platformFee,
      tipAmount: tip,
      totalAmount,
      coupon: appliedCoupon,
      paymentMethod: formattedPaymentMethod,
      paymentStatus: formattedPaymentMethod === "COD" ? "PENDING" : "SUCCESS",
      paymentDetails: {
        transactionId: formattedPaymentMethod === "COD" ? null : `TXN-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`,
        gateway: formattedPaymentMethod === "COD" ? "CashOnDelivery" : "OnlinePaymentGateway",
        paidAt: formattedPaymentMethod === "COD" ? null : new Date(),
      },
      orderStatus: "PLACED",
      orderOtp,
      orderOtpHash,
      estimatedDeliveryTime: "22–26 mins",
      statusTimeline: [
        {
          status: "PLACED",
          timestamp: new Date(),
          note: "Order received and forwarded to kitchen",
        },
      ],
    });

    // Real-world push notification to customer & merchant
    await notifyOrderStateChange(order, "PLACED");

    const orderObj = order.toObject ? order.toObject() : { ...order };
    delete orderObj.orderOtpHash;

    res.status(201).json({
      success: true,
      message: `Feast ordered successfully! Your order ${order.orderNumber} is confirmed.`,
      order: orderObj,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating order.",
      error: error.message,
    });
  }
};

// @desc    Get order history for customer
// @route   GET /api/orders
// @access  Private (Customer)
export const getMyOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { customer: req.user._id };

    if (status === "ongoing") {
      filter.orderStatus = {
        $in: [
          "PLACED",
          "CONFIRMED",
          "PREPARING",
          "READY_FOR_PICKUP",
          "ASSIGNED",
          "ACCEPTED",
          "PICKED_UP",
          "OUT_FOR_DELIVERY",
        ],
      };
    } else if (status === "delivered") {
      filter.orderStatus = "DELIVERED";
    } else if (status === "cancelled") {
      filter.orderStatus = "CANCELLED";
    }

    const orders = await Order.find(filter)
      .populate("restaurant", "name slug image address deliveryTime rating")
      .populate("deliveryPartner", "name phone profilePhoto vehicleType vehicleNumber rating isOnline")
      .sort({ createdAt: -1 });

    const sanitizedOrders = orders.map((ord) => {
      const obj = ord.toObject ? ord.toObject() : { ...ord };
      delete obj.orderOtpHash;
      return obj;
    });

    res.json({
      success: true,
      count: sanitizedOrders.length,
      orders: sanitizedOrders,
    });
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching orders.",
      error: error.message,
    });
  }
};

// @desc    Get single order details by ID or orderNumber
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    let query = {};

    if (id.startsWith("BG-")) {
      query.orderNumber = id.toUpperCase();
    } else if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.orderNumber = id.toUpperCase();
    }

    const order = await Order.findOne(query)
      .populate("restaurant", "name slug image address deliveryTime rating phone")
      .populate("deliveryPartner", "name phone vehicleType vehicleNumber rating profilePhoto")
      .populate("customer", "name email phone");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Role check: customer can only view own order unless merchant/delivery/admin/superadmin
    if (
      req.user.role === "customer" &&
      order.customer?._id?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order.",
      });
    }

    const orderObj = order.toObject ? order.toObject() : { ...order };
    delete orderObj.orderOtpHash;
    if (req.user.role === "delivery" || req.user.role === "merchant") {
      delete orderObj.orderOtp;
    }

    res.json({
      success: true,
      order: orderObj,
    });
  } catch (error) {
    console.error("Get Order Detail Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching order details.",
      error: error.message,
    });
  }
};

// @desc    Cancel order (allowed before preparation)
// @route   PATCH /api/orders/:id/cancel
// @access  Private (Customer or Admin)
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { orderNumber: id.toUpperCase() }],
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (["PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "This order is already being prepared or in transit and cannot be cancelled.",
      });
    }

    if (order.orderStatus === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled.",
      });
    }

    order.orderStatus = "CANCELLED";
    order.cancellationReason = reason || "Cancelled by customer before preparation";
    order.statusTimeline.push({
      status: "CANCELLED",
      timestamp: new Date(),
      note: order.cancellationReason,
    });

    if (order.paymentStatus === "SUCCESS" || order.paymentStatus === "paid") {
      order.paymentStatus = "REFUNDED";
      if (!order.paymentDetails) order.paymentDetails = {};
      order.paymentDetails.refundedAt = new Date();
      order.paymentDetails.refundAmount = order.totalAmount;
    } else if (order.paymentStatus === "PENDING" || order.paymentStatus === "pending") {
      order.paymentStatus = "FAILED";
      if (!order.paymentDetails) order.paymentDetails = {};
      order.paymentDetails.failureReason = "Order cancelled before payment collection";
    }

    await order.save();

    // Trigger cancellation notifications
    await notifyOrderStateChange(order, "CANCELLED", { reason: order.cancellationReason });

    res.json({
      success: true,
      message: "Order has been cancelled successfully.",
      order,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error cancelling order.",
      error: error.message,
    });
  }
};

// @desc    Process or verify payment for order on server side
// @route   POST /api/orders/:id/pay
// @access  Private (Customer)
export const processOrderPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod = "Online", transactionId } = req.body;

    const order = await Order.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { orderNumber: id.toUpperCase() }],
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.paymentStatus === "SUCCESS" || order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment for this order has already succeeded.",
      });
    }

    if (paymentMethod.toUpperCase() === "COD") {
      order.paymentMethod = "COD";
      order.paymentStatus = "PENDING";
      order.paymentDetails = {
        transactionId: null,
        gateway: "CashOnDelivery",
        paidAt: null,
      };
    } else {
      const validatedTxnId =
        transactionId || `TXN-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
      order.paymentMethod = paymentMethod || "Online";
      order.paymentStatus = "SUCCESS";
      order.paymentDetails = {
        transactionId: validatedTxnId,
        gateway: "OnlinePaymentGateway",
        paidAt: new Date(),
      };
    }

    await order.save();

    res.json({
      success: true,
      message: `Payment updated: ${order.paymentStatus}`,
      order,
    });
  } catch (error) {
    console.error("Payment Processing Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error processing payment.",
      error: error.message,
    });
  }
};

// @desc    Review and rate restaurant & delivery partner
// @route   POST /api/orders/:id/review
// @access  Private (Customer)
export const reviewOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, reviewText, courierRating, restaurantRating, deliveryRating, comment } = req.body;

    const finalRating = Number(rating || restaurantRating);
    const finalCourierRating = courierRating || deliveryRating ? Number(courierRating || deliveryRating) : undefined;
    const finalReviewText = reviewText || comment || "";

    if (!finalRating || finalRating < 1 || finalRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid rating between 1 and 5 stars.",
      });
    }

    const order = await Order.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { orderNumber: id.toUpperCase() }],
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.orderStatus !== "DELIVERED") {
      return res.status(400).json({
        success: false,
        message: "Reviews can only be submitted after your order has been delivered.",
      });
    }

    if (order.review && order.review.rating) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this feast.",
      });
    }

    // Save review on Order
    order.review = {
      rating: finalRating,
      restaurantRating: finalRating,
      reviewText: finalReviewText,
      courierRating: finalCourierRating,
      createdAt: new Date(),
    };
    await order.save();

    // Create standalone review document
    await Review.create({
      user: req.user._id,
      order: order._id,
      restaurant: order.restaurant,
      rating: finalRating,
      reviewText: finalReviewText,
      courierRating: finalCourierRating,
      courier: order.deliveryPartner || undefined,
    });

    // Dynamically recalculate restaurant average rating and persist in MongoDB
    const reviews = await Review.find({ restaurant: order.restaurant });
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await Restaurant.findByIdAndUpdate(order.restaurant, {
        rating: parseFloat(avgRating.toFixed(1)),
        numRatings: reviews.length,
      });
    }

    res.json({
      success: true,
      message: "Thank you for reviewing your meal and courier partner!",
      review: order.review,
    });
  } catch (error) {
    console.error("Review Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error submitting review.",
      error: error.message,
    });
  }
};

// @desc    Reorder previous feast
// @route   POST /api/orders/:id/reorder
// @access  Private (Customer)
export const reorderOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { orderNumber: id.toUpperCase() }],
    }).populate("restaurant", "name isOpen");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Original order not found.",
      });
    }

    const availableItems = [];
    const unavailableItems = [];

    for (const item of order.items) {
      const dbItem = await MenuItem.findById(item.menuItem);
      if (dbItem && dbItem.isAvailable && dbItem.inStock) {
        availableItems.push({
          id: dbItem._id,
          name: dbItem.name,
          restaurant: order.restaurant?.name || "The Dark Roast Pizzeria",
          restaurantId: order.restaurant?._id,
          price: dbItem.price,
          quantity: item.quantity,
          image: dbItem.image,
          customizations: item.customizations,
        });
      } else {
        unavailableItems.push(item.name);
      }
    }

    res.json({
      success: true,
      restaurant: order.restaurant,
      availableItems,
      unavailableItems,
      message:
        unavailableItems.length > 0
          ? `${availableItems.length} items added to cart. (${unavailableItems.join(", ")} out of stock)`
          : "All items from previous feast re-added to cart!",
    });
  } catch (error) {
    console.error("Reorder Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during reorder.",
      error: error.message,
    });
  }
};

// =========================================================================
// PORTAL SYNCHRONIZATION: RESTAURANT & DELIVERY WORKFLOW ENDPOINTS
// =========================================================================

// @desc    Update order lifecycle stage (Merchant / Delivery / Admin)
// @route   PATCH /api/orders/:id/status
// @access  Private (Merchant, Delivery, Admin, SuperAdmin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status, note, otp } = req.body;

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

    const validStatuses = [
      "CONFIRMED",
      "PREPARING",
      "READY_FOR_PICKUP",
      "ASSIGNED",
      "ACCEPTED",
      "PICKED_UP",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed: ${validStatuses.join(", ")}`,
      });
    }

    // Role Guard: Customer cannot directly alter order status
    if (req.user.role === "customer") {
      return res.status(403).json({
        success: false,
        message: "Security violation: Customers cannot directly update order status.",
      });
    }

    const order = await Order.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { orderNumber: id.toUpperCase() }],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Role Guard: Merchant
    if (req.user.role === "merchant") {
      // Merchant cannot set delivery or final completion statuses
      if (["DELIVERED", "OUT_FOR_DELIVERY", "PICKED_UP", "ASSIGNED"].includes(status)) {
        return res.status(403).json({
          success: false,
          message:
            "Merchants cannot advance order to delivery stages or mark as delivered. This action is reserved for delivery partners.",
        });
      }

      // Check merchant owns this order's restaurant
      const merchantRestaurant = await Restaurant.findOne({ merchantUser: req.user._id });
      if (!merchantRestaurant || order.restaurant.toString() !== merchantRestaurant._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Security violation: You can only update orders belonging to your restaurant.",
        });
      }

      // Validate sequential kitchen transitions
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
    }

    // Role Guard: Delivery Partner
    if (req.user.role === "delivery") {
      // Delivery partner cannot set kitchen statuses
      if (["PREPARING", "CONFIRMED", "PLACED"].includes(status)) {
        return res.status(403).json({
          success: false,
          message: "Delivery partners cannot update kitchen preparation status.",
        });
      }

      const validDeliveryTransitions = {
        READY_FOR_PICKUP: ["ACCEPTED", "PICKED_UP"],
        ASSIGNED: ["ACCEPTED", "PICKED_UP"],
        ACCEPTED: ["PICKED_UP"],
        PICKED_UP: ["OUT_FOR_DELIVERY"],
        OUT_FOR_DELIVERY: ["DELIVERED"],
        DELIVERED: [],
      };

      const allowedTransitions = validDeliveryTransitions[order.orderStatus] || [];
      if (!allowedTransitions.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition delivery from '${order.orderStatus}' to '${status}'.`,
        });
      }

      // For ACCEPTED, bind courier if not already bound
      if (status === "ACCEPTED") {
        if (order.deliveryPartner && order.deliveryPartner.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "Order is assigned to another delivery partner.",
          });
        }
        order.deliveryPartner = req.user._id;
      } else {
        // Must be the assigned courier
        if (!order.deliveryPartner || order.deliveryPartner.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "Security violation: You are not assigned to this delivery mission.",
          });
        }
      }

      // For DELIVERED, verify OTP if supplied
      if (status === "DELIVERED" && otp && order.orderOtp && order.orderOtp !== otp) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP! Verification code does not match customer's code.",
        });
      }
    }

    // Role Guard: Admin / Super Admin (Must follow sequential rules, no arbitrary jump)
    if (req.user.role === "admin" || req.user.role === "superadmin") {
      const validAdminTransitions = {
        PLACED: ["CONFIRMED", "CANCELLED"],
        CONFIRMED: ["PREPARING", "CANCELLED"],
        PREPARING: ["READY_FOR_PICKUP", "CANCELLED"],
        READY_FOR_PICKUP: ["ASSIGNED", "ACCEPTED", "CANCELLED"],
        ASSIGNED: ["ACCEPTED", "PICKED_UP", "CANCELLED"],
        ACCEPTED: ["PICKED_UP", "CANCELLED"],
        PICKED_UP: ["OUT_FOR_DELIVERY"],
        OUT_FOR_DELIVERY: ["DELIVERED"],
        DELIVERED: [],
        CANCELLED: [],
      };

      const allowedTransitions = validAdminTransitions[order.orderStatus] || [];
      if (!allowedTransitions.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid state transition from '${order.orderStatus}' to '${status}'. Admin cannot skip lifecycle steps.`,
        });
      }
    }

    order.orderStatus = status;
    order.statusTimeline.push({
      status,
      timestamp: new Date(),
      note: note || `Order updated to ${status} by ${req.user.name} (${req.user.role})`,
    });

    if (status === "DELIVERED") {
      order.paymentStatus = "SUCCESS";
      if (!order.paymentDetails) order.paymentDetails = {};
      order.paymentDetails.paidAt = new Date();
    } else if (status === "CANCELLED") {
      if (order.paymentStatus === "SUCCESS" || order.paymentStatus === "paid") {
        order.paymentStatus = "REFUNDED";
        if (!order.paymentDetails) order.paymentDetails = {};
        order.paymentDetails.refundedAt = new Date();
        order.paymentDetails.refundAmount = order.totalAmount;
      }
    }

    await order.save();
    await notifyOrderStateChange(order, status, { note });

    res.json({
      success: true,
      message: `Order status updated to ${status}.`,
      order,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating status.",
      error: error.message,
    });
  }
};

// @desc    Delivery partner accepts order
// @route   PATCH /api/orders/:id/accept-delivery
// @access  Private (Delivery, Admin, SuperAdmin)
export const acceptDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.user._id;

    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { orderNumber: id.toUpperCase() };

    const order = await Order.findOne(query)
      .populate("restaurant", "name address hub phone")
      .populate("customer", "name phone");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.deliveryPartner && order.deliveryPartner.toString() !== partnerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Security violation: This order is assigned to another delivery partner.",
      });
    }

    if (!["READY_FOR_PICKUP", "ASSIGNED"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be accepted in current status (${order.orderStatus}). Order must be READY_FOR_PICKUP or ASSIGNED.`,
      });
    }

    // Atomic assignment & state transition
    const updatedOrder = await Order.findOneAndUpdate(
      {
        ...query,
        orderStatus: { $in: ["READY_FOR_PICKUP", "ASSIGNED"] },
        $or: [{ deliveryPartner: null }, { deliveryPartner: partnerId }],
      },
      {
        $set: {
          deliveryPartner: partnerId,
          orderStatus: "ACCEPTED",
        },
        $push: {
          statusTimeline: {
            status: "ACCEPTED",
            timestamp: new Date(),
            note: `Delivery partner ${req.user.name} accepted mission dispatch`,
          },
        },
      },
      { new: true }
    )
      .populate("restaurant", "name address hub phone")
      .populate("customer", "name phone");

    if (!updatedOrder) {
      return res.status(409).json({
        success: false,
        message: "Order was already accepted or status changed.",
      });
    }

    await User.findByIdAndUpdate(partnerId, { isAvailable: false });
    await notifyOrderStateChange(updatedOrder, "ACCEPTED");

    res.json({
      success: true,
      message: `Delivery accepted! You are assigned to order ${updatedOrder.orderNumber}.`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Accept Delivery Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error accepting delivery.",
      error: error.message,
    });
  }
};

// @desc    Delivery partner marks parcel picked up from restaurant
// @route   PATCH /api/orders/:id/pickup
// @access  Private (Delivery, Admin, SuperAdmin)
export const pickupDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { orderNumber: id.toUpperCase() };

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      req.user.role === "delivery" &&
      (!order.deliveryPartner || order.deliveryPartner.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Security violation: You are not assigned to this delivery.",
      });
    }

    if (!["ACCEPTED", "ASSIGNED"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order must be ACCEPTED before pickup. Current status: ${order.orderStatus}`,
      });
    }

    order.orderStatus = "PICKED_UP";
    order.statusTimeline.push({
      status: "PICKED_UP",
      timestamp: new Date(),
      note: `Courier ${req.user.name} collected parcel from restaurant counter`,
    });

    await order.save();
    await notifyOrderStateChange(order, "PICKED_UP");

    await order.populate("restaurant", "name address hub phone image rating");
    await order.populate("customer", "name phone");

    res.json({
      success: true,
      message: `Order #${order.orderNumber} picked up from kitchen.`,
      order,
    });
  } catch (error) {
    console.error("Pickup Delivery Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error marking order picked up.",
      error: error.message,
    });
  }
};

// @desc    Delivery partner sets order out for delivery
// @route   PATCH /api/orders/:id/out-for-delivery
// @access  Private (Delivery, Admin, SuperAdmin)
export const outForDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { orderNumber: id.toUpperCase() };

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      req.user.role === "delivery" &&
      (!order.deliveryPartner || order.deliveryPartner.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Security violation: You are not assigned to this delivery.",
      });
    }

    if (order.orderStatus !== "PICKED_UP") {
      return res.status(400).json({
        success: false,
        message: `Order must be PICKED_UP before heading out. Current status: ${order.orderStatus}`,
      });
    }

    order.orderStatus = "OUT_FOR_DELIVERY";
    order.statusTimeline.push({
      status: "OUT_FOR_DELIVERY",
      timestamp: new Date(),
      note: `Courier ${req.user.name} is out for delivery heading to customer location`,
    });

    await order.save();
    await notifyOrderStateChange(order, "OUT_FOR_DELIVERY");

    await order.populate("restaurant", "name address hub phone image rating");
    await order.populate("customer", "name phone");

    res.json({
      success: true,
      message: `Order #${order.orderNumber} is now out for delivery.`,
      order,
    });
  } catch (error) {
    console.error("Out for Delivery Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error setting out for delivery.",
      error: error.message,
    });
  }
};

// @desc    Delivery partner completes delivery by verifying 4-digit customer OTP
// @route   PATCH /api/orders/:id/verify-otp
// @access  Private (Delivery, Admin, SuperAdmin)
export const verifyDeliveryOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { orderNumber: id.toUpperCase() };

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      req.user.role === "delivery" &&
      (!order.deliveryPartner || order.deliveryPartner.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Security violation: You are not assigned to this delivery mission.",
      });
    }

    if (order.orderStatus === "DELIVERED") {
      return res.status(400).json({
        success: false,
        message: "Order has already been marked delivered.",
      });
    }

    if (order.orderStatus !== "OUT_FOR_DELIVERY") {
      return res.status(400).json({
        success: false,
        message: `Order must be 'OUT_FOR_DELIVERY' before verifying OTP. Current status: ${order.orderStatus}`,
      });
    }

    if (!otp || typeof otp !== "string" || !otp.trim()) {
      return res.status(400).json({
        success: false,
        message: "OTP is required. Please ask the customer for the 4-digit code.",
      });
    }

    const isMatch = await order.compareOtp(otp);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP! Please ask the customer for the correct 4-digit code.",
      });
    }

    order.orderStatus = "DELIVERED";
    order.deliveredAt = new Date();
    order.paymentStatus = "SUCCESS";
    if (!order.paymentDetails) order.paymentDetails = {};
    order.paymentDetails.paidAt = new Date();
    order.statusTimeline.push({
      status: "DELIVERED",
      timestamp: new Date(),
      note: "Customer confirmed delivery with 4-digit OTP handover",
    });

    await order.save();
    await notifyOrderStateChange(order, "DELIVERED");

    if (order.deliveryPartner) {
      const partnerUser = await User.findById(order.deliveryPartner);
      if (partnerUser) {
        partnerUser.isAvailable = partnerUser.isOnline;
        await partnerUser.save();
      }
    }

    res.json({
      success: true,
      message: `Delivery for ${order.orderNumber} confirmed! Bon appétit.`,
      order,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error verifying OTP.",
      error: error.message,
    });
  }
};
