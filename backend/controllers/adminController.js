import MerchantApplication from "../models/MerchantApplication.js";
import DeliveryApplication from "../models/DeliveryApplication.js";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import AuditLog from "../models/AuditLog.js";
import Order from "../models/Order.js";
import { notifyOrderStateChange } from "../utils/notificationService.js";

const logAudit = async (req, action, targetUser, details = {}) => {
  try {
    const targetName =
      targetUser?.name ||
      details?.restaurantName ||
      details?.fullName ||
      details?.target ||
      "Platform";

    await AuditLog.create({
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      action,
      target: targetName,
      targetUser: targetUser?._id || null,
      targetUserName: targetUser?.name || targetName,
      targetUserRole: targetUser?.role || "",
      details,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
};

// @desc    Get all merchant onboarding applications
// @route   GET /api/admin/merchant-applications
// @access  Private (Admin & Super Admin)
export const getMerchantApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const applications = await MerchantApplication.find(filter)
      .populate("userId", "name email phone verificationStatus isActive")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get Merchant Applications Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching merchant applications.",
    });
  }
};

// @desc    Approve merchant application
// @route   PATCH /api/admin/merchants/:id/approve
// @access  Private (Admin & Super Admin)
export const approveMerchant = async (req, res) => {
  try {
    let application = await MerchantApplication.findById(req.params.id);
    if (!application) {
      application = await MerchantApplication.findOne({ userId: req.params.id });
    }
    if (!application) {
      const rest = await Restaurant.findById(req.params.id);
      if (rest) {
        const ownerId = rest.merchantUser || rest.owner;
        if (ownerId) {
          application = await MerchantApplication.findOne({ userId: ownerId });
        }
      }
    }

    if (!application) {
      // Fallback: check if target is directly a User or a Restaurant
      const rest = await Restaurant.findById(req.params.id);
      const targetUserId = rest?.merchantUser || rest?.owner || req.params.id;
      const targetUser = await User.findById(targetUserId);

      if (targetUser) {
        targetUser.role = "merchant";
        targetUser.verificationStatus = "approved";
        targetUser.isActive = true;
        targetUser.rejectionReason = null;
        await targetUser.save();

        if (rest) {
          rest.isOpen = true;
          await rest.save();
        }

        await logAudit(req, "Admin approved Merchant", targetUser, {
          userId: targetUser._id,
          restaurantId: rest?._id,
        });

        return res.json({
          success: true,
          message: `Merchant ${targetUser.name} approved successfully.`,
          user: targetUser,
          restaurant: rest,
        });
      }

      return res.status(404).json({
        success: false,
        message: "Merchant application or account not found.",
      });
    }

    application.status = "approved";
    application.rejectionReason = null;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    // Update User record
    const targetUser = await User.findByIdAndUpdate(
      application.userId,
      {
        role: "merchant",
        verificationStatus: "approved",
        rejectionReason: null,
      },
      { new: true }
    );

    // Ensure Restaurant exists and is linked to approved merchant
    let restaurant = await Restaurant.findOne({
      $or: [{ merchantUser: application.userId }, { owner: application.userId }],
    });
    if (!restaurant) {
      const baseSlug = application.restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const existingSlug = await Restaurant.findOne({ slug: baseSlug });
      const slug = existingSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

      restaurant = await Restaurant.create({
        name: application.restaurantName,
        slug,
        address: application.address,
        hub: application.hub || "Bodakdev Hub",
        cuisine: [application.category],
        description: application.description || "Authentic culinary creations crafted with passion.",
        image: application.photo || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
        merchantUser: application.userId,
        isOpen: true,
      });
    } else {
      restaurant.isOpen = true;
      await restaurant.save();
    }

    await logAudit(req, "Admin approved Merchant", targetUser, {
      applicationId: application._id,
      restaurantName: application.restaurantName,
      restaurantId: restaurant._id,
    });

    res.json({
      success: true,
      message: `Merchant application for ${application.restaurantName} approved successfully.`,
      application,
      restaurant,
    });
  } catch (error) {
    console.error("Approve Merchant Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error approving merchant.",
    });
  }
};

// @desc    Reject merchant application
// @route   PATCH /api/admin/merchants/:id/reject
// @access  Private (Admin & Super Admin)
export const rejectMerchant = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rejection reason.",
      });
    }

    let application = await MerchantApplication.findById(req.params.id);
    if (!application) {
      application = await MerchantApplication.findOne({ userId: req.params.id });
    }
    if (!application) {
      const rest = await Restaurant.findById(req.params.id);
      if (rest) {
        const ownerId = rest.merchantUser || rest.owner;
        if (ownerId) {
          application = await MerchantApplication.findOne({ userId: ownerId });
        }
      }
    }

    if (!application) {
      const rest = await Restaurant.findById(req.params.id);
      const targetUserId = rest?.merchantUser || rest?.owner || req.params.id;
      const targetUser = await User.findById(targetUserId);

      if (targetUser) {
        targetUser.verificationStatus = "rejected";
        targetUser.rejectionReason = reason;
        targetUser.isActive = false;
        await targetUser.save();

        if (rest) {
          rest.isOpen = false;
          await rest.save();
        }

        await logAudit(req, "Admin rejected Merchant", targetUser, {
          userId: targetUser._id,
          reason,
        });

        return res.json({
          success: true,
          message: `Merchant ${targetUser.name} has been rejected.`,
          user: targetUser,
        });
      }

      return res.status(404).json({
        success: false,
        message: "Merchant application or account not found.",
      });
    }

    application.status = "rejected";
    application.rejectionReason = reason;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    // Update User record
    const targetUser = await User.findByIdAndUpdate(
      application.userId,
      {
        verificationStatus: "rejected",
        rejectionReason: reason,
        isActive: false,
      },
      { new: true }
    );

    await Restaurant.updateMany(
      { $or: [{ merchantUser: application.userId }, { owner: application.userId }] },
      { isOpen: false }
    );

    await logAudit(req, "Admin rejected Merchant", targetUser, {
      applicationId: application._id,
      restaurantName: application.restaurantName,
      reason,
    });

    res.json({
      success: true,
      message: `Merchant application for ${application.restaurantName} has been rejected.`,
      application,
    });
  } catch (error) {
    console.error("Reject Merchant Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error rejecting merchant.",
    });
  }
};

// @desc    Get all delivery partner applications
// @route   GET /api/admin/delivery-applications
// @access  Private (Admin & Super Admin)
export const getDeliveryApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const applications = await DeliveryApplication.find(filter)
      .populate("userId", "name email phone verificationStatus isActive")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get Delivery Applications Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching delivery applications.",
    });
  }
};

// @desc    Approve delivery application
// @route   PATCH /api/admin/delivery/:id/approve
// @access  Private (Admin & Super Admin)
export const approveDelivery = async (req, res) => {
  try {
    let application = await DeliveryApplication.findById(req.params.id);
    if (!application) {
      application = await DeliveryApplication.findOne({ userId: req.params.id });
    }

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Delivery application not found.",
      });
    }

    application.status = "approved";
    application.rejectionReason = null;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    const targetUser = await User.findByIdAndUpdate(
      application.userId,
      {
        role: "delivery",
        verificationStatus: "approved",
        rejectionReason: null,
        isOnline: true,
        isAvailable: true,
      },
      { new: true }
    );

    await logAudit(req, "Admin approved Delivery Partner", targetUser, {
      applicationId: application._id,
      fullName: application.fullName,
      vehicleType: application.vehicleType,
    });

    res.json({
      success: true,
      message: `Delivery application for ${application.fullName} approved successfully.`,
      application,
    });
  } catch (error) {
    console.error("Approve Delivery Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error approving delivery partner.",
    });
  }
};

// @desc    Reject delivery application
// @route   PATCH /api/admin/delivery/:id/reject
// @access  Private (Admin & Super Admin)
export const rejectDelivery = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rejection reason.",
      });
    }

    let application = await DeliveryApplication.findById(req.params.id);
    if (!application) {
      application = await DeliveryApplication.findOne({ userId: req.params.id });
    }

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Delivery application not found.",
      });
    }

    application.status = "rejected";
    application.rejectionReason = reason;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    const targetUser = await User.findByIdAndUpdate(
      application.userId,
      {
        verificationStatus: "rejected",
        rejectionReason: reason,
      },
      { new: true }
    );

    await logAudit(req, "Admin rejected Delivery Partner", targetUser, {
      applicationId: application._id,
      fullName: application.fullName,
      reason,
    });

    res.json({
      success: true,
      message: `Delivery application for ${application.fullName} has been rejected.`,
      application,
    });
  } catch (error) {
    console.error("Reject Delivery Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error rejecting delivery partner.",
    });
  }
};

// @desc    Get normal users (customer, merchant, delivery)
// @route   GET /api/admin/users
// @access  Private (Admin & Super Admin)
export const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = {};

    // Normal admins cannot view or manage superadmin
    if (req.user.role === "admin") {
      query.role = { $nin: ["superadmin", "admin"] };
    }

    if (role && role !== "all") {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching users.",
    });
  }
};

// @desc    Suspend or activate user account (Rule 4 & 5)
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin & Super Admin)
export const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // SECURITY RULE 5: Admin cannot modify Super Admin
    if (targetUser.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Security Violation: Super Admin accounts cannot be modified.",
      });
    }

    // Normal Admin cannot modify another Admin
    if (req.user.role === "admin" && targetUser.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can modify administrative accounts.",
      });
    }

    targetUser.isActive = isActive;
    if (!isActive && targetUser.role === "delivery") {
      targetUser.isOnline = false;
      targetUser.isAvailable = false;
    }
    await targetUser.save();

    if (!isActive && targetUser.role === "merchant") {
      await Restaurant.updateOne({ merchantUser: targetUser._id }, { isOpen: false });
    }

    await logAudit(
      req,
      isActive ? "USER_ACTIVATED" : "USER_SUSPENDED",
      targetUser,
      { newStatus: isActive }
    );

    res.json({
      success: true,
      message: `User ${targetUser.name} has been ${
        isActive ? "activated" : "suspended"
      }.`,
      user: targetUser,
    });
  } catch (error) {
    console.error("Update User Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating user status.",
      error: error.message,
    });
  }
};

// @desc    Get real platform statistics from MongoDB
// @route   GET /api/admin/overview & GET /api/admin/stats
// @access  Private (Admin & Super Admin)
export const getAdminOverview = async (req, res) => {
  try {
    const [
      customers,
      merchants,
      deliveryPartners,
      pendingMerchantApplications,
      pendingDeliveryApplications,
      orders,
      completedOrders,
      cancelledOrders,
      revenueResult,
      activeRestaurants,
    ] = await Promise.all([
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "merchant" }),
      User.countDocuments({ role: "delivery" }),
      MerchantApplication.countDocuments({ status: "pending" }),
      DeliveryApplication.countDocuments({ status: "pending" }),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: "DELIVERED" }),
      Order.countDocuments({ orderStatus: "CANCELLED" }),
      Order.aggregate([
        { $match: { orderStatus: "DELIVERED" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Restaurant.countDocuments({ isOpen: true }),
    ]);

    const revenue =
      revenueResult.length > 0 ? parseFloat(revenueResult[0].total.toFixed(2)) : 0;

    res.json({
      success: true,
      stats: {
        customers,
        merchants,
        deliveryPartners,
        pendingMerchantApplications,
        pendingDeliveryApplications,
        orders,
        completedOrders,
        cancelledOrders,
        revenue,
        activeRestaurants,
      },
      counts: {
        customers,
        merchants,
        deliveryPartners,
        pendingMerchantApplications,
        pendingDeliveryApplications,
        orders,
        completedOrders,
        cancelledOrders,
        revenue,
      },
    });
  } catch (error) {
    console.error("Get Admin Overview Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error calculating platform overview statistics.",
      error: error.message,
    });
  }
};

// @desc    Get approved and registered merchants with restaurant link
// @route   GET /api/admin/merchants
// @access  Private (Admin & Super Admin)
export const getApprovedMerchants = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const query = { role: "merchant" };

    if (isActive !== undefined && isActive !== "all") {
      query.isActive = isActive === "true";
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const merchants = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const merchantIds = merchants.map((m) => m._id);
    const restaurants = await Restaurant.find({ merchantUser: { $in: merchantIds } });
    const restaurantMap = {};
    restaurants.forEach((r) => {
      restaurantMap[r.merchantUser.toString()] = r;
    });

    const enriched = merchants.map((m) => ({
      ...m,
      restaurant: restaurantMap[m._id.toString()] || null,
    }));

    res.json({
      success: true,
      count: enriched.length,
      merchants: enriched,
    });
  } catch (error) {
    console.error("Get Approved Merchants Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching merchants list.",
    });
  }
};

// Helper to safely format address object or string into a clean string
const formatAddressString = (addr) => {
  if (!addr) return "Bodakdev, Ahmedabad";
  if (typeof addr === "string") return addr;
  if (typeof addr === "object") {
    const parts = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Bodakdev, Ahmedabad";
  }
  return String(addr);
};

// @desc    Get all restaurants & merchant applications for Admin management
// @route   GET /api/admin/restaurants
// @access  Private (Admin & Super Admin)
export const getAdminRestaurants = async (req, res) => {
  try {
    const { search, status } = req.query;

    const [restaurants, applications] = await Promise.all([
      Restaurant.find()
        .populate("merchantUser", "name email phone isActive verificationStatus")
        .populate("owner", "name email phone isActive verificationStatus")
        .lean(),
      MerchantApplication.find()
        .populate("userId", "name email phone isActive verificationStatus")
        .lean(),
    ]);

    const restaurantByMerchant = {};
    restaurants.forEach((r) => {
      const ownerId = (r.merchantUser?._id || r.owner?._id || r.merchantUser || r.owner)?.toString();
      if (ownerId) {
        restaurantByMerchant[ownerId] = r;
      }
    });

    const appByMerchant = {};
    applications.forEach((a) => {
      const userId = (a.userId?._id || a.userId)?.toString();
      if (userId) {
        appByMerchant[userId] = a;
      }
    });

    const combined = [];

    // 1. Process restaurants
    restaurants.forEach((rest) => {
      const merchant = rest.merchantUser || rest.owner;
      const merchantId = (merchant?._id || merchant)?.toString();
      const app = merchantId ? appByMerchant[merchantId] : null;
      let verStatus = merchant?.verificationStatus || (app?.status) || "approved";
      let isSuspended = merchant ? !merchant.isActive : false;

      combined.push({
        _id: rest._id,
        restaurantId: rest._id,
        name: rest.name,
        image: rest.image || rest.logo || "",
        owner: merchant?.name || app?.ownerName || app?.fullName || "Merchant Owner",
        ownerEmail: merchant?.email || app?.email || "N/A",
        ownerPhone: merchant?.phone || app?.phone || "N/A",
        cuisine: Array.isArray(rest.cuisine) ? rest.cuisine.join(", ") : rest.cuisine || "Various",
        address: formatAddressString(rest.address),
        hub: rest.hub || "Bodakdev Hub",
        city: rest.city || "Ahmedabad",
        isOpen: Boolean(rest.isOpen),
        verificationStatus: verStatus,
        isSuspended,
        merchantUserId: merchant?._id || rest.merchantUser || rest.owner,
        applicationId: app?._id,
        createdAt: rest.createdAt,
      });
    });

    // 2. Process applications without created restaurants yet
    applications.forEach((app) => {
      const merchantId = (app.userId?._id || app.userId)?.toString();
      const hasRest = merchantId && restaurantByMerchant[merchantId];
      if (!hasRest) {
        combined.push({
          _id: app._id,
          applicationId: app._id,
          name: app.restaurantName || "Pending Restaurant",
          image: app.photo || "",
          owner: app.fullName || app.ownerName || app.userId?.name || "Applicant",
          ownerEmail: app.email || app.userId?.email || "N/A",
          ownerPhone: app.phone || app.userId?.phone || "N/A",
          cuisine: app.category || "Various",
          address: formatAddressString(app.address),
          hub: app.hub || "Bodakdev Hub",
          city: "Ahmedabad",
          isOpen: false,
          verificationStatus: app.status || "pending",
          isSuspended: false,
          merchantUserId: app.userId?._id || app.userId,
          createdAt: app.createdAt,
        });
      }
    });

    // Filter by status
    let filtered = combined;
    if (status && status !== "all") {
      if (status === "suspended") {
        filtered = filtered.filter((r) => r.isSuspended);
      } else if (status === "active") {
        filtered = filtered.filter((r) => r.isOpen && !r.isSuspended && r.verificationStatus === "approved");
      } else if (status === "inactive") {
        filtered = filtered.filter((r) => !r.isOpen && !r.isSuspended && r.verificationStatus === "approved");
      } else {
        filtered = filtered.filter((r) => r.verificationStatus === status && !r.isSuspended);
      }
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.name && r.name.toLowerCase().includes(q)) ||
          (r.owner && r.owner.toLowerCase().includes(q)) ||
          (r.ownerEmail && r.ownerEmail.toLowerCase().includes(q)) ||
          (r.ownerPhone && r.ownerPhone.toLowerCase().includes(q)) ||
          (r.address && r.address.toLowerCase().includes(q)) ||
          (r.cuisine && r.cuisine.toLowerCase().includes(q)) ||
          (r.hub && r.hub.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      count: filtered.length,
      restaurants: filtered,
    });
  } catch (error) {
    console.error("Get Admin Restaurants Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching restaurants.",
    });
  }
};

// @desc    Toggle restaurant suspension / active availability
// @route   PATCH /api/admin/restaurants/:id/status
// @access  Private (Admin & Super Admin)
export const toggleRestaurantAdminStatus = async (req, res) => {
  try {
    const { isOpen, isSuspended, isActive } = req.body;
    const rest = await Restaurant.findById(req.params.id);

    if (!rest) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    if (isOpen !== undefined) {
      rest.isOpen = Boolean(isOpen);
    }

    // Support both isSuspended and isActive
    const suspendFlag =
      isSuspended !== undefined
        ? Boolean(isSuspended)
        : isActive !== undefined
        ? !isActive
        : undefined;

    if (suspendFlag !== undefined) {
      const ownerId = rest.merchantUser || rest.owner;
      if (ownerId) {
        await User.findByIdAndUpdate(ownerId, { isActive: !suspendFlag });
      }
      if (suspendFlag) {
        rest.isOpen = false;
      }
    }

    await rest.save();

    await logAudit(
      req,
      suspendFlag !== undefined
        ? suspendFlag
          ? "RESTAURANT_SUSPENDED"
          : "RESTAURANT_REACTIVATED"
        : rest.isOpen
        ? "RESTAURANT_ACTIVATED"
        : "RESTAURANT_DEACTIVATED",
      null,
      {
        restaurantId: rest._id,
        name: rest.name,
        isOpen: rest.isOpen,
        isSuspended: suspendFlag,
      }
    );

    res.json({
      success: true,
      message: `Restaurant status updated successfully.`,
      restaurant: rest,
    });
  } catch (error) {
    console.error("Toggle Restaurant Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating restaurant status.",
    });
  }
};

// @desc    Get delivery partners with vehicle & duty status
// @route   GET /api/admin/delivery-partners
// @access  Private (Admin & Super Admin)
export const getDeliveryPartners = async (req, res) => {
  try {
    const { search, isActive, status } = req.query;
    const query = { role: "delivery" };

    if (status && status !== "all") {
      query.verificationStatus = status;
    }

    if (isActive !== undefined && isActive !== "all") {
      query.isActive = isActive === "true";
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const partners = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const userIds = partners.map((p) => p._id);
    const [applications, orderStats] = await Promise.all([
      DeliveryApplication.find({ userId: { $in: userIds } }),
      Order.aggregate([
        { $match: { deliveryPartner: { $in: userIds } } },
        {
          $group: {
            _id: "$deliveryPartner",
            completedDeliveries: {
              $sum: { $cond: [{ $eq: ["$orderStatus", "DELIVERED"] }, 1, 0] },
            },
            activeDeliveries: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$orderStatus",
                      ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const appMap = {};
    applications.forEach((a) => {
      appMap[a.userId.toString()] = a;
    });

    const orderStatMap = {};
    orderStats.forEach((s) => {
      orderStatMap[s._id.toString()] = s;
    });

    const enriched = partners.map((p) => ({
      ...p,
      application: appMap[p._id.toString()] || null,
      vehicleType: appMap[p._id.toString()]?.vehicleType || "Bike",
      vehicleNumber: appMap[p._id.toString()]?.vehicleNumber || "N/A",
      completedDeliveries: orderStatMap[p._id.toString()]?.completedDeliveries || 0,
      activeDeliveries: orderStatMap[p._id.toString()]?.activeDeliveries || 0,
    }));

    res.json({
      success: true,
      count: enriched.length,
      partners: enriched,
    });
  } catch (error) {
    console.error("Get Delivery Partners Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching delivery partners.",
    });
  }
};

// @desc    Get customers with aggregated order totals
// @route   GET /api/admin/customers
// @access  Private (Admin & Super Admin)
export const getCustomers = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const query = { role: "customer" };

    if (isActive !== undefined && isActive !== "all") {
      query.isActive = isActive === "true";
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const customerIds = customers.map((c) => c._id);
    const orderAgg = await Order.aggregate([
      { $match: { customer: { $in: customerIds } } },
      {
        $group: {
          _id: "$customer",
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
        },
      },
    ]);
    const aggMap = {};
    orderAgg.forEach((a) => {
      aggMap[a._id.toString()] = a;
    });

    const enriched = customers.map((c) => ({
      ...c,
      totalOrders: aggMap[c._id.toString()]?.totalOrders || 0,
      totalSpent: parseFloat((aggMap[c._id.toString()]?.totalSpent || 0).toFixed(2)),
    }));

    res.json({
      success: true,
      count: enriched.length,
      customers: enriched,
    });
  } catch (error) {
    console.error("Get Customers Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching customers.",
    });
  }
};

// @desc    Get customer by ID with orders
// @route   GET /api/admin/customers/:id
// @access  Private (Admin & Super Admin)
export const getCustomerById = async (req, res) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: "customer" }).select(
      "-password"
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const orders = await Order.find({ customer: customer._id })
      .populate("restaurant", "name address")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      customer,
      orders,
    });
  } catch (error) {
    console.error("Get Customer By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching customer details.",
    });
  }
};

// @desc    Get all platform orders with full relational details
// @route   GET /api/admin/orders
// @access  Private (Admin & Super Admin)
export const getAdminOrders = async (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;
    const query = {};

    if (status && status !== "all") {
      query.orderStatus = status;
    }

    if (search) {
      query.$or = [{ orderNumber: { $regex: search, $options: "i" } }];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate("customer", "name email phone")
      .populate({
        path: "restaurant",
        select: "name address hub phone merchantUser",
        populate: { path: "merchantUser", select: "name email phone" },
      })
      .populate("deliveryPartner", "name phone vehicleType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    const formattedOrders = orders.map((ord) => ({
      _id: ord._id,
      orderNumber: ord.orderNumber,
      orderId: ord.orderNumber,
      customer: {
        _id: ord.customer?._id,
        name: ord.customer?.name || ord.deliveryAddress?.fullName || "Guest Customer",
        email: ord.customer?.email || "N/A",
        phone: ord.customer?.phone || ord.deliveryAddress?.phone || "N/A",
      },
      restaurant: {
        _id: ord.restaurant?._id,
        name: ord.restaurant?.name || "Kitchen Hub",
        address: ord.restaurant?.address || "Bodakdev",
      },
      merchant: {
        _id: ord.restaurant?.merchantUser?._id,
        name: ord.restaurant?.merchantUser?.name || "Restaurant Merchant",
        email: ord.restaurant?.merchantUser?.email || "N/A",
      },
      deliveryPartner: ord.deliveryPartner
        ? {
            _id: ord.deliveryPartner._id,
            name: ord.deliveryPartner.name,
            phone: ord.deliveryPartner.phone,
            vehicleType: ord.deliveryPartner.vehicleType,
          }
        : null,
      amount: ord.totalAmount,
      totalAmount: ord.totalAmount,
      paymentStatus: ord.paymentStatus,
      paymentMethod: ord.paymentMethod,
      orderStatus: ord.orderStatus,
      date: ord.createdAt,
      createdAt: ord.createdAt,
      itemsCount: ord.items?.length || 0,
      deliveryAddress: ord.deliveryAddress,
    }));

    res.json({
      success: true,
      count: formattedOrders.length,
      total,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Get Admin Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching platform orders.",
    });
  }
};

// @desc    Update order status adhering to valid sequential rules (Rule: No bypass)
// @route   PATCH /api/admin/orders/:id/status
// @access  Private (Admin & Super Admin)
export const updateAdminOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order ticket not found.",
      });
    }

    // Valid sequential order transitions
    const validTransitions = {
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

    const allowed = validTransitions[order.orderStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order state transition. Cannot move order from ${order.orderStatus} directly to ${status}. Admin must adhere to valid lifecycle progression.`,
      });
    }

    order.orderStatus = status;
    order.statusTimeline.push({
      status,
      timestamp: new Date(),
      note: `Platform Admin ${req.user.name} advanced order to ${status}`,
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
    await notifyOrderStateChange(order, status, { note: `Platform Admin ${req.user.name} advanced order to ${status}` });

    res.json({
      success: true,
      message: `Order #${order.orderNumber} status updated to ${status}.`,
      order,
    });
  } catch (error) {
    console.error("Admin Order Update Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating order.",
    });
  }
};

// @desc    Delete user account with strict Super Admin protection
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin & Super Admin)
export const deleteUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // IMPORTANT PERMISSION: Admin MUST NOT delete Super Admin
    if (targetUser.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Security Violation: Super Admin accounts cannot be deleted.",
      });
    }

    // Admin cannot delete other Admins
    if (req.user.role === "admin" && targetUser.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Security Violation: Only Super Admin can delete administrative accounts.",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    await logAudit(req, "USER_DELETED", targetUser, {
      deletedRole: targetUser.role,
      deletedEmail: targetUser.email,
    });

    res.json({
      success: true,
      message: `User ${targetUser.name} (${targetUser.email}) deleted successfully.`,
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting user account.",
    });
  }
};

// @desc    Update user role with strict Super Admin protection
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin & Super Admin)
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // IMPORTANT PERMISSION: Admin MUST NOT change Super Admin role
    if (targetUser.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Security Violation: Super Admin role cannot be modified.",
      });
    }

    // IMPORTANT PERMISSION: Admin MUST NOT promote anyone to Super Admin
    if (role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Security Violation: Admin cannot assign Super Admin role.",
      });
    }

    // Admin cannot alter other Admins
    if (req.user.role === "admin" && (targetUser.role === "admin" || role === "admin")) {
      return res.status(403).json({
        success: false,
        message: "Security Violation: Only Super Admin can manage administrative roles.",
      });
    }

    targetUser.role = role;
    await targetUser.save();

    await logAudit(req, "USER_ROLE_CHANGED", targetUser, { newRole: role });

    res.json({
      success: true,
      message: `User ${targetUser.name} role changed to ${role}.`,
      user: targetUser,
    });
  } catch (error) {
    console.error("Update Role Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating user role.",
    });
  }
};
