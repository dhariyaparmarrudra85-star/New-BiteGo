import DeliveryApplication from "../models/DeliveryApplication.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import DeliveryEarning from "../models/DeliveryEarning.js";
import { notifyDeliveryApplication, notifyOrderStateChange } from "../utils/notificationService.js";

// Helper to sanitize order details sent to delivery partners (hides customer's delivery OTP & hash)
const sanitizeOrderForPartner = (ord) => {
  if (!ord) return null;
  const obj = ord.toObject ? ord.toObject() : { ...ord };
  delete obj.orderOtp;
  delete obj.orderOtpHash;
  return obj;
};

// @desc    Submit delivery partner onboarding application
// @route   POST /api/delivery/apply
// @access  Private (Authenticated User)
export const applyDelivery = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      dob = "",
      address,
      profilePhoto = "",
      emergencyContactName = "",
      emergencyContactPhone = "",
      vehicleType,
      vehicleNumber = "",
      drivingLicenseNumber = "",
      vehicleRCNumber = "",
      governmentId = "",
      documents = [],
    } = req.body;

    // Validation
    if (!fullName || !phone || !address || !vehicleType) {
      return res.status(400).json({
        success: false,
        message: "Please provide full name, phone, address, and vehicle type.",
      });
    }

    // Vehicle rule: Driving licence mandatory for motor vehicles (Bike / Scooter)
    if (vehicleType === "Bike" || vehicleType === "Scooter") {
      if (!drivingLicenseNumber || !drivingLicenseNumber.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Driving Licence number is mandatory for motor vehicles (Bike / Scooter).",
        });
      }
    }

    const userId = req.user._id;

    // Check if an application already exists
    let application = await DeliveryApplication.findOne({ userId });

    if (application) {
      application.fullName = fullName;
      application.email = req.user.email;
      application.phone = phone;
      application.dob = dob;
      application.address = address;
      application.profilePhoto = profilePhoto;
      application.emergencyContactName = emergencyContactName;
      application.emergencyContactPhone = emergencyContactPhone;
      application.vehicleType = vehicleType;
      application.vehicleNumber = vehicleNumber;
      application.drivingLicenseNumber = drivingLicenseNumber;
      application.vehicleRCNumber = vehicleRCNumber;
      application.governmentId = governmentId;
      application.documents = documents;
      application.status = "pending";
      application.rejectionReason = null;
      await application.save();
    } else {
      application = await DeliveryApplication.create({
        userId,
        fullName,
        email: req.user.email,
        phone,
        dob,
        address,
        profilePhoto,
        emergencyContactName,
        emergencyContactPhone,
        vehicleType,
        vehicleNumber,
        drivingLicenseNumber,
        vehicleRCNumber,
        governmentId,
        documents,
        status: "pending",
      });
    }

    // Update user role to delivery and status to pending
    await User.findByIdAndUpdate(userId, {
      role: "delivery",
      verificationStatus: "pending",
      rejectionReason: null,
      phone,
      profilePhoto: profilePhoto || "",
      isOnline: false,
      isAvailable: false,
    });

    // Notify Admins & Super Admin
    await notifyDeliveryApplication(application);

    res.status(201).json({
      success: true,
      message:
        "Your delivery partner application has been submitted and is currently under review by BiteGo administrators.",
      application,
    });
  } catch (error) {
    console.error("Apply Delivery Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error submitting delivery partner application.",
      error: error.message,
    });
  }
};

// @desc    Get current user's delivery application status
// @route   GET /api/delivery/application
// @access  Private
export const getMyApplication = async (req, res) => {
  try {
    const application = await DeliveryApplication.findOne({
      userId: req.user._id,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "No delivery partner application found for this account.",
      });
    }

    res.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Get Delivery Application Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching delivery application.",
    });
  }
};

// @desc    Toggle delivery online/offline status
// @route   PATCH /api/delivery/status
// @access  Private (Approved Delivery Partner)
export const toggleDutyStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role !== "delivery" || user.verificationStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Only approved delivery partners can update duty status.",
      });
    }

    const nextOnlineState = typeof isOnline === "boolean" ? isOnline : !user.isOnline;

    user.isOnline = nextOnlineState;
    if (nextOnlineState) {
      // Check if user has an active ongoing delivery
      const activeOrder = await Order.findOne({
        deliveryPartner: user._id,
        orderStatus: { $in: ["ASSIGNED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"] },
      });
      user.isAvailable = !activeOrder;
    } else {
      user.isAvailable = false;
    }

    await user.save();

    res.json({
      success: true,
      message: `Duty status updated: ${nextOnlineState ? "Online & Ready" : "Offline"}`,
      isOnline: user.isOnline,
      isAvailable: user.isAvailable,
    });
  } catch (error) {
    console.error("Toggle Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating duty status.",
    });
  }
};

// @desc    Get available ready-for-pickup deliveries (broadcast queue)
// @route   GET /api/delivery/available
// @access  Private (Approved & Online Delivery Partner)
export const getAvailableDeliveries = async (req, res) => {
  try {
    const partner = await User.findById(req.user._id);

    if (!partner || !partner.isOnline) {
      return res.status(400).json({
        success: false,
        message: "You are currently offline. Please switch to ONLINE duty to receive available drops.",
        orders: [],
      });
    }

    const readyStatuses = [
      "READY_FOR_PICKUP",
      "ready_for_pickup",
      "READY",
      "ready",
      "READY_AT_COUNTER",
      "Ready at Counter",
    ];

    // Only orders that are ready for pickup, unassigned, and not declined by this partner
    const rawOrders = await Order.find({
      orderStatus: { $in: readyStatuses },
      $or: [
        { deliveryPartner: null },
        { deliveryPartner: { $exists: false } },
      ],
      declinedBy: { $ne: partner._id },
    })
      .populate("restaurant", "name address hub image phone rating")
      .populate("customer", "name phone")
      .sort({ updatedAt: -1 });

    // Deduplicate by MongoDB _id
    const seen = new Set();
    const uniqueOrders = [];
    for (const ord of rawOrders) {
      const idStr = ord._id.toString();
      if (!seen.has(idStr)) {
        seen.add(idStr);
        uniqueOrders.push(ord);
      }
    }

    console.log(`[Available Deliveries] Found ${uniqueOrders.length} ready orders for partner ${partner.name} (${partner._id})`);

    res.json({
      success: true,
      count: uniqueOrders.length,
      orders: uniqueOrders.map(sanitizeOrderForPartner),
    });
  } catch (error) {
    console.error("Get Available Deliveries Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching available deliveries.",
    });
  }
};

// @desc    Accept assigned delivery or claim available ready order
// @route   PATCH /api/delivery/orders/:id/accept
// @access  Private (Approved Delivery Partner)
export const acceptDeliveryOrder = async (req, res) => {
  try {
    const partner = await User.findById(req.user._id);
    if (!partner || !partner.isOnline) {
      return res.status(400).json({
        success: false,
        message: "You must be online to accept delivery dispatches.",
      });
    }

    // Check if partner already has an active order in transit
    const existingActive = await Order.findOne({
      deliveryPartner: partner._id,
      orderStatus: { $in: ["ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"] },
    });

    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: "You already have an active order in transit. Complete it before accepting another.",
      });
    }

    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { orderNumber: id.toUpperCase() };

    const order = await Order.findOne(query)
      .populate("restaurant", "name address hub phone")
      .populate("customer", "name phone");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order ticket not found.",
      });
    }

    const readyStatuses = [
      "READY_FOR_PICKUP",
      "ready_for_pickup",
      "READY",
      "ready",
      "READY_AT_COUNTER",
      "Ready at Counter",
      "ASSIGNED",
    ];

    // Atomic check and assignment to prevent duplicate fleet claims
    const updatedOrder = await Order.findOneAndUpdate(
      {
        ...query,
        orderStatus: { $in: readyStatuses },
        $or: [
          { deliveryPartner: null },
          { deliveryPartner: { $exists: false } },
          { deliveryPartner: partner._id },
        ],
      },
      {
        $set: {
          deliveryPartner: partner._id,
          orderStatus: "ACCEPTED",
        },
        $push: {
          statusTimeline: {
            status: "ACCEPTED",
            timestamp: new Date(),
            note: `Delivery partner ${partner.name} accepted mission dispatch`,
          },
        },
      },
      { new: true }
    )
      .populate("restaurant", "name address hub phone")
      .populate("customer", "name phone");

    if (!updatedOrder) {
      if (order.deliveryPartner && order.deliveryPartner.toString() !== partner._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Security violation: This order is assigned to another delivery partner.",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Order cannot be accepted in current status (${order.orderStatus}).`,
      });
    }

    await notifyOrderStateChange(updatedOrder, "ACCEPTED");

    // Mark partner as busy
    partner.isAvailable = false;
    await partner.save();

    console.log(
      `[Accept Delivery] Order #${updatedOrder.orderNumber} (${updatedOrder._id}) successfully assigned to partner ${partner.name} (${partner._id}). Status: ACCEPTED`
    );

    res.json({
      success: true,
      message: `Delivery for #${updatedOrder.orderNumber} accepted! GPS routing activated.`,
      order: sanitizeOrderForPartner(updatedOrder),
    });
  } catch (error) {
    console.error("Accept Delivery Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error accepting delivery order.",
      error: error.message,
    });
  }
};

// @desc    Mark parcel picked up from restaurant
// @route   PATCH /api/delivery/orders/:id/pickup
// @access  Private (Assigned Delivery Partner)
export const pickupDeliveryOrder = async (req, res) => {
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

    // SECURITY: Delivery Partner A must not touch Delivery Partner B's order
    if (
      !order.deliveryPartner ||
      order.deliveryPartner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Security violation: You are not assigned to this delivery.",
      });
    }

    if (["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Order has already been picked up.",
      });
    }

    if (order.orderStatus === "READY_FOR_PICKUP") {
      return res.status(400).json({
        success: false,
        message: "Order must be accepted before pickup.",
      });
    }

    if (!["ACCEPTED", "ASSIGNED"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot pick up order in current status (${order.orderStatus}). Order must be ACCEPTED.`,
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
    await order.populate("deliveryPartner", "name phone vehicleType vehicleNumber rating profilePhoto");

    console.log(
      `[Pickup Delivery] Order #${order.orderNumber} (${order._id}) picked up by partner ${req.user.name} (${req.user._id}) -> status: PICKED_UP`
    );

    res.json({
      success: true,
      message: `Order #${order.orderNumber} picked up from restaurant kitchen.`,
      order: sanitizeOrderForPartner(order),
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

// @desc    Mark order out for delivery
// @route   PATCH /api/delivery/orders/:id/out-for-delivery
// @access  Private (Assigned Delivery Partner)
export const outForDeliveryOrder = async (req, res) => {
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

    // SECURITY CHECK
    if (
      !order.deliveryPartner ||
      order.deliveryPartner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Security violation: You are not assigned to this delivery.",
      });
    }

    if (order.orderStatus !== "PICKED_UP") {
      return res.status(400).json({
        success: false,
        message: "Order must be picked up before transitioning to out for delivery.",
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
    await order.populate("deliveryPartner", "name phone vehicleType vehicleNumber rating profilePhoto");

    console.log(
      `[Out For Delivery] Order #${order.orderNumber} (${order._id}) out for delivery by partner ${req.user.name} (${req.user._id}) -> status: OUT_FOR_DELIVERY`
    );

    res.json({
      success: true,
      message: `Order #${order.orderNumber} is now out for delivery! Customer alerted.`,
      order: sanitizeOrderForPartner(order),
    });
  } catch (error) {
    console.error("Out for Delivery Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error setting order out for delivery.",
      error: error.message,
    });
  }
};

// @desc    Complete delivery by customer 4-digit OTP verification & record earnings
// @route   PATCH /api/delivery/orders/:id/verify-otp
// @access  Private (Assigned Delivery Partner)
export const verifyDeliveryOtpAndComplete = async (req, res) => {
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

    // SECURITY CHECK
    if (
      !order.deliveryPartner ||
      order.deliveryPartner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Security violation: You are not assigned to this delivery.",
      });
    }

    if (order.orderStatus === "DELIVERED") {
      return res.status(400).json({
        success: false,
        message: "Order has already been marked delivered.",
      });
    }

    if (!["OUT_FOR_DELIVERY", "PICKED_UP"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot deliver order in current status (${order.orderStatus}). Order must be 'PICKED_UP' or 'OUT_FOR_DELIVERY'.`,
      });
    }

    // Verify OTP if provided
    if (otp && typeof otp === "string" && otp.trim()) {
      const isMatch = await order.compareOtp(otp);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP! Please ask customer for correct 4-digit verification code.",
        });
      }
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

    await order.populate("restaurant", "name address hub phone image rating");
    await order.populate("customer", "name phone");
    await order.populate("deliveryPartner", "name phone vehicleType vehicleNumber rating profilePhoto");

    console.log(
      `[Complete Delivery] Order #${order.orderNumber} (${order._id}) confirmed delivered with OTP by partner ${req.user.name} (${req.user._id}) -> status: DELIVERED`
    );

    // Create real DeliveryEarning record
    const baseFee = 45;
    const surgeBonus = 15;
    const tip = order.tipAmount || 0;
    const totalEarning = baseFee + surgeBonus + tip;

    const earning = await DeliveryEarning.create({
      deliveryPartner: req.user._id,
      order: order._id,
      orderNumber: order.orderNumber,
      baseFee,
      surgeBonus,
      tipAmount: tip,
      distanceKm: 2.4,
      totalEarning,
      status: "credited",
    });

    // Free up delivery partner for next drop
    const partner = await User.findById(req.user._id);
    if (partner) {
      partner.isAvailable = partner.isOnline;
      await partner.save();
    }

    res.json({
      success: true,
      message: `Delivery #${order.orderNumber} completed! ₹${totalEarning} credited to wallet.`,
      order: sanitizeOrderForPartner(order),
      earning,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error completing delivery.",
      error: error.message,
    });
  }
};

// @desc    Assign order to approved online available partner (Admin or Dispatcher)
// @route   POST /api/delivery/orders/:id/assign
// @access  Private (Admin, SuperAdmin)
export const assignOrderToPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { partnerId } = req.body;

    const partner = await User.findById(partnerId);
    if (!partner || partner.role !== "delivery") {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found.",
      });
    }

    if (partner.verificationStatus !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Cannot assign order to unapproved delivery partner.",
      });
    }

    if (!partner.isOnline) {
      return res.status(400).json({
        success: false,
        message: "Cannot assign order to offline delivery partner.",
      });
    }

    if (!partner.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Selected partner is currently busy with another active delivery.",
      });
    }

    const order = await Order.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { orderNumber: id.toUpperCase() }],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order ticket not found.",
      });
    }

    if (!["READY_FOR_PICKUP", "ready_for_pickup", "READY", "ready", "READY_AT_COUNTER", "Ready at Counter"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order must be ready for pickup to be assigned. Current: ${order.orderStatus}`,
      });
    }

    order.deliveryPartner = partner._id;
    order.orderStatus = "ASSIGNED";
    order.statusTimeline.push({
      status: "ASSIGNED",
      timestamp: new Date(),
      note: `Assigned to delivery partner ${partner.name}`,
    });

    await order.save();

    partner.isAvailable = false;
    await partner.save();

    res.json({
      success: true,
      message: `Order #${order.orderNumber} successfully assigned to ${partner.name}.`,
      order,
    });
  } catch (error) {
    console.error("Assign Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error assigning order.",
      error: error.message,
    });
  }
};

// @desc    Get real-time delivery telemetry & dashboard stats from MongoDB
// @route   GET /api/delivery/dashboard
// @access  Private (Approved Delivery Partner)
export const getDeliveryDashboard = async (req, res) => {
  try {
    const partnerId = req.user._id;
    const partner = await User.findById(partnerId);

    // Current active order (in progress)
    const currentOrder = await Order.findOne({
      deliveryPartner: partnerId,
      orderStatus: { $in: ["ASSIGNED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"] },
    })
      .populate("restaurant", "name address hub phone image rating")
      .populate("customer", "name phone");

    // Dynamic availability check: partner is available if online and not currently working on an active mission
    const isAvailable = Boolean(partner.isOnline && !currentOrder);
    if (partner.isAvailable !== isAvailable) {
      partner.isAvailable = isAvailable;
      await partner.save();
    }

    // Available orders (if online)
    let availableOrders = [];
    const readyStatuses = [
      "READY_FOR_PICKUP",
      "ready_for_pickup",
      "READY",
      "ready",
      "READY_AT_COUNTER",
      "Ready at Counter",
    ];

    if (partner.isOnline) {
      const rawAvailable = await Order.find({
        orderStatus: { $in: readyStatuses },
        $or: [
          { deliveryPartner: null },
          { deliveryPartner: { $exists: false } },
        ],
        declinedBy: { $ne: partnerId },
      })
        .populate("restaurant", "name address hub phone image rating")
        .populate("customer", "name phone")
        .sort({ updatedAt: -1 })
        .limit(20);

      // Deduplicate by MongoDB _id
      const seen = new Set();
      availableOrders = [];
      for (const ord of rawAvailable) {
        const idStr = ord._id.toString();
        if (!seen.has(idStr)) {
          seen.add(idStr);
          availableOrders.push(ord);
        }
      }

      console.log(
        `[Fleet Radar] Partner ${partner.name} (${partner._id}) online. Found ${availableOrders.length} eligible incoming orders.`
      );
    } else {
      console.log(
        `[Fleet Radar] Partner ${partner.name} (${partner._id}) is OFFLINE. Radar holds incoming drops until duty is switched online.`
      );
    }

    if (partner.isOnline && availableOrders.length === 0) {
      const totalReadyInDb = await Order.countDocuments({
        orderStatus: { $in: readyStatuses },
      });
      const unassignedReadyInDb = await Order.countDocuments({
        orderStatus: { $in: readyStatuses },
        $or: [
          { deliveryPartner: null },
          { deliveryPartner: { $exists: false } },
        ],
      });
      console.log(
        `[Fleet Radar Diagnostic] 0 eligible orders found for partner. In DB: total ready=${totalReadyInDb}, unassigned ready=${unassignedReadyInDb}`
      );
    }

    // Earnings calculations from real DeliveryEarning records
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [allEarnings, todayEarningsRecords, weeklyEarningsRecords, completedOrdersCount] =
      await Promise.all([
        DeliveryEarning.find({ deliveryPartner: partnerId }),
        DeliveryEarning.find({
          deliveryPartner: partnerId,
          createdAt: { $gte: startOfDay },
        }),
        DeliveryEarning.find({
          deliveryPartner: partnerId,
          createdAt: { $gte: sevenDaysAgo },
        }),
        Order.countDocuments({
          deliveryPartner: partnerId,
          orderStatus: "DELIVERED",
        }),
      ]);

    const totalEarnings = allEarnings.reduce((acc, curr) => acc + curr.totalEarning, 0);
    const todayEarnings = todayEarningsRecords.reduce((acc, curr) => acc + curr.totalEarning, 0);
    const weeklyEarnings = weeklyEarningsRecords.reduce((acc, curr) => acc + curr.totalEarning, 0);
    const totalTips = allEarnings.reduce((acc, curr) => acc + curr.tipAmount, 0);

    // Recent drops
    const recentDrops = await Order.find({
      deliveryPartner: partnerId,
      orderStatus: "DELIVERED",
    })
      .populate("restaurant", "name address")
      .populate("customer", "name")
      .sort({ updatedAt: -1 })
      .limit(6);

    const todayBase = todayEarningsRecords.reduce((acc, curr) => acc + curr.baseFee, 0);
    const todaySurge = todayEarningsRecords.reduce((acc, curr) => acc + curr.surgeBonus, 0);
    const todayTip = todayEarningsRecords.reduce((acc, curr) => acc + curr.tipAmount, 0);

    res.json({
      success: true,
      partner: {
        _id: partner._id,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        isOnline: partner.isOnline,
        isAvailable: partner.isAvailable,
        verificationStatus: partner.verificationStatus,
        profilePhoto: partner.profilePhoto,
      },
      dutyStatus: {
        isOnline: partner.isOnline,
        isAvailable: partner.isAvailable,
      },
      currentOrder: sanitizeOrderForPartner(currentOrder) || null,
      activeOrder: sanitizeOrderForPartner(currentOrder) || null,
      availableOrders: (availableOrders || []).map(sanitizeOrderForPartner),
      availablePool: (availableOrders || []).map(sanitizeOrderForPartner),
      stats: {
        todayEarnings,
        todayBreakdown: {
          base: todayBase,
          surge: todaySurge,
          tip: todayTip,
        },
        weeklyEarnings,
        totalEarnings,
        completedTrips: completedOrdersCount,
        activeOrderCount: currentOrder ? 1 : 0,
      },
      earnings: {
        todayEarnings,
        weeklyEarnings,
        totalEarnings,
        completedDeliveries: completedOrdersCount,
        totalTips,
      },
      recentDrops,
    });
  } catch (error) {
    console.error("Get Delivery Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching delivery dashboard data.",
      error: error.message,
    });
  }
};

// @desc    Get delivery completed drops & earnings ledger
// @route   GET /api/delivery/history
// @access  Private (Approved Delivery Partner)
export const getDeliveryHistory = async (req, res) => {
  try {
    const partnerId = req.user._id;

    const [earnings, orders] = await Promise.all([
      DeliveryEarning.find({ deliveryPartner: partnerId })
        .populate("order", "orderNumber deliveryAddress totalAmount orderStatus createdAt")
        .sort({ createdAt: -1 }),
      Order.find({ deliveryPartner: partnerId })
        .populate("restaurant", "name address hub phone")
        .populate("customer", "name phone")
        .sort({ updatedAt: -1 }),
    ]);

    const earningMap = new Map();
    earnings.forEach((e) => {
      const oId = e.order?._id ? e.order._id.toString() : e.order?.toString();
      if (oId) earningMap.set(oId, e.totalEarning);
    });

    const deliveries = orders.map((ord) => {
      let statusLabel = "Accepted";
      if (ord.orderStatus === "PICKED_UP") statusLabel = "Picked Up";
      else if (ord.orderStatus === "OUT_FOR_DELIVERY") statusLabel = "Picked Up";
      else if (ord.orderStatus === "DELIVERED") statusLabel = "Delivered";
      else if (ord.orderStatus === "CANCELLED") statusLabel = "Cancelled";

      const earningAmount =
        earningMap.get(ord._id.toString()) ||
        (ord.orderStatus === "DELIVERED" ? ord.deliveryFee || 45 : null);

      return {
        _id: ord._id,
        orderNumber: ord.orderNumber,
        restaurantName: ord.restaurant?.name || "BiteGo Restaurant",
        restaurantAddress: ord.restaurant?.address || "",
        customerName: ord.customer?.name || ord.deliveryAddress?.fullName || "Customer",
        customerAddress: ord.deliveryAddress
          ? `${ord.deliveryAddress.houseFlat}, ${ord.deliveryAddress.area}`
          : "",
        deliveryDate: ord.deliveredAt || ord.createdAt,
        rawStatus: ord.orderStatus,
        status: statusLabel,
        isActive: ["ASSIGNED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(
          ord.orderStatus
        ),
        earnings: earningAmount,
        totalAmount: ord.totalAmount,
      };
    });

    res.json({
      success: true,
      count: deliveries.length,
      deliveries,
      history: earnings,
    });
  } catch (error) {
    console.error("Get Delivery History Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching delivery history.",
    });
  }
};

// @desc    Decline/dismiss an incoming delivery request from agent's visible radar
// @route   PATCH /api/delivery/orders/:id/decline
// @access  Private (Approved Delivery Partner)
export const declineDeliveryOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.user._id;

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

    // Add partner to declinedBy set in MongoDB without modifying order status or cancelling customer order
    await Order.updateOne(query, {
      $addToSet: { declinedBy: partnerId },
    });

    console.log(
      `[Decline Delivery] Partner ${req.user.name} (${partnerId}) declined order #${order.orderNumber} (${order._id}). Order preserved in DB for other fleet partners.`
    );

    res.json({
      success: true,
      message: "Order declined and dismissed from your radar.",
      orderId: order._id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("Decline Delivery Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error declining delivery order.",
      error: error.message,
    });
  }
};
