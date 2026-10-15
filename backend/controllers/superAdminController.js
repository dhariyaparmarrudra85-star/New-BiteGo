import User from "../models/User.js";
import MerchantApplication from "../models/MerchantApplication.js";
import DeliveryApplication from "../models/DeliveryApplication.js";
import AuditLog from "../models/AuditLog.js";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import PlatformSetting from "../models/PlatformSetting.js";

// Helper to log audit actions
const logAudit = async (req, action, targetUserOrName, details = {}) => {
  try {
    const isUserObj =
      targetUserOrName &&
      typeof targetUserOrName === "object" &&
      targetUserOrName._id;
    const targetUserId = isUserObj ? targetUserOrName._id : null;
    const targetName = isUserObj
      ? targetUserOrName.name || targetUserOrName.email
      : typeof targetUserOrName === "string"
      ? targetUserOrName
      : details.target || "Platform";
    const targetRole = isUserObj ? targetUserOrName.role : "";

    await AuditLog.create({
      performedBy: req.user._id,
      performedByName: req.user.name || "Super Admin",
      performedByRole: req.user.role || "superadmin",
      action,
      target: targetName,
      targetUser: targetUserId,
      targetUserName: targetName,
      targetUserRole: targetRole,
      details,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
};

// @desc    Get Platform-Wide Analytics Overview
// @route   GET /api/superadmin/overview
// @access  Private (Super Admin Only)
export const getPlatformOverview = async (req, res) => {
  try {
    const [
      totalCustomers,
      totalMerchants,
      totalDelivery,
      totalAdmins,
      pendingMerchantApps,
      pendingDeliveryApps,
      totalOrders,
      completedOrders,
      cancelledOrders,
      revenueAggregation,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "merchant" }),
      User.countDocuments({ role: "delivery" }),
      User.countDocuments({ role: "admin" }),
      MerchantApplication.countDocuments({ status: "pending" }),
      DeliveryApplication.countDocuments({ status: "pending" }),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: "DELIVERED" }),
      Order.countDocuments({ orderStatus: "CANCELLED" }),
      Order.aggregate([
        { $match: { orderStatus: "DELIVERED" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("performedBy", "name email role"),
    ]);

    const activeMerchants = await User.countDocuments({
      role: "merchant",
      verificationStatus: "approved",
      isActive: true,
    });

    const activeDelivery = await User.countDocuments({
      role: "delivery",
      verificationStatus: "approved",
      isActive: true,
    });

    const totalRevenue =
      revenueAggregation.length > 0
        ? parseFloat(revenueAggregation[0].total.toFixed(2))
        : 0;

    // Platform settings take rate
    const settings = await PlatformSetting.getSettings();
    const commissionPercent = settings.platformCommission || 18.0;
    const netYield = Number(((totalRevenue * commissionPercent) / 100).toFixed(2));

    res.json({
      success: true,
      stats: {
        totalCustomers,
        totalMerchants,
        activeMerchants,
        totalDelivery,
        activeDelivery,
        totalAdmins,
        pendingMerchantApps,
        pendingDeliveryApps,
        pendingApplications: pendingMerchantApps + pendingDeliveryApps,
        totalOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        revenue: totalRevenue,
        netYield,
      },
      counts: {
        customers: totalCustomers,
        merchants: totalMerchants,
        deliveryPartners: totalDelivery,
        admins: totalAdmins,
        pendingApplications: pendingMerchantApps + pendingDeliveryApps,
        orders: totalOrders,
        completedOrders,
        cancelledOrders,
        revenue: totalRevenue,
      },
      platformActivity: recentActivity,
    });
  } catch (error) {
    console.error("Super Admin Overview Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching platform overview.",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN MANAGEMENT (Super Admin Only)
// ==========================================

// @desc    Get all Admin accounts
// @route   GET /api/superadmin/admins
// @access  Private (Super Admin Only)
export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: admins.length,
      admins,
    });
  } catch (error) {
    console.error("Get Admins Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching admin accounts.",
    });
  }
};

// @desc    Get single Admin account
// @route   GET /api/superadmin/admins/:id
// @access  Private (Super Admin Only)
export const getAdminById = async (req, res) => {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: "admin" }).select(
      "-password"
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    res.json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("Get Admin By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching admin details.",
    });
  }
};

// @desc    Create a new operational Admin account (Rule: Only Super Admin can create Admin)
// @route   POST /api/superadmin/admins
// @access  Private (Super Admin Only)
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required to create an Admin.",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const newAdmin = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || "",
      role: "admin",
      verificationStatus: "approved",
      isActive: true,
    });

    await logAudit(req, "Super Admin created Admin", newAdmin, {
      adminEmail: newAdmin.email,
    });

    res.status(201).json({
      success: true,
      message: `Admin account for ${newAdmin.name} created successfully.`,
      admin: {
        _id: newAdmin._id,
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        role: newAdmin.role,
        isActive: newAdmin.isActive,
        createdAt: newAdmin.createdAt,
      },
    });
  } catch (error) {
    console.error("Create Admin Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating admin account.",
      error: error.message,
    });
  }
};

// @desc    Edit Admin account details
// @route   PATCH /api/superadmin/admins/:id & PUT /api/superadmin/admins/:id
// @access  Private (Super Admin Only)
export const updateAdmin = async (req, res) => {
  try {
    const { name, phone, isActive, password } = req.body;

    const admin = await User.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    // Protection: cannot modify a superadmin via admin endpoint
    if (admin.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Security Violation: Super Admin cannot be modified via admin endpoint.",
      });
    }

    if (name) admin.name = name;
    if (phone !== undefined) admin.phone = phone;
    if (isActive !== undefined) admin.isActive = isActive;
    if (password && password.trim()) admin.password = password;

    await admin.save();

    await logAudit(req, "Super Admin edited Admin", admin, {
      updatedFields: { name, phone, isActive, passwordUpdated: !!password },
    });

    res.json({
      success: true,
      message: `Admin account for ${admin.name} updated successfully.`,
      admin: {
        _id: admin._id,
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        isActive: admin.isActive,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update Admin Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating admin account.",
    });
  }
};

// @desc    Disable or Reactivate Admin account
// @route   PATCH /api/superadmin/admins/:id/status
// @access  Private (Super Admin Only)
export const updateAdminStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const admin = await User.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    if (admin.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Security Violation: Super Admin status cannot be altered.",
      });
    }

    admin.isActive = isActive;
    await admin.save();

    await logAudit(
      req,
      isActive ? "Super Admin reactivated Admin" : "Super Admin disabled Admin",
      admin,
      { newStatus: isActive }
    );

    res.json({
      success: true,
      message: `Admin ${admin.name} has been ${isActive ? "reactivated" : "disabled"}.`,
      admin,
    });
  } catch (error) {
    console.error("Update Admin Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error toggling admin status.",
    });
  }
};

// @desc    Delete an Admin account
// @route   DELETE /api/superadmin/admins/:id
// @access  Private (Super Admin Only)
export const deleteAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    if (admin.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Security Violation: Super Admin accounts cannot be deleted.",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    await logAudit(req, "Super Admin deleted Admin", admin, {
      deletedAdminEmail: admin.email,
    });

    res.json({
      success: true,
      message: `Admin account for ${admin.name} has been deleted.`,
    });
  } catch (error) {
    console.error("Delete Admin Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting admin account.",
    });
  }
};

// ==========================================
// USER MANAGEMENT (All 5 Roles)
// ==========================================

// @desc    Get all users across all roles with search & filter
// @route   GET /api/superadmin/users
// @access  Private (Super Admin Only)
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, status } = req.query;
    const query = {};

    if (role && role !== "all") {
      query.role = role;
    }

    if (status === "active") query.isActive = true;
    if (status === "suspended") query.isActive = false;

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
    console.error("Get All Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user list.",
    });
  }
};

// @desc    Get user by ID with full details
// @route   GET /api/superadmin/users/:id
// @access  Private (Super Admin Only)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    let extraData = {};
    if (user.role === "merchant") {
      extraData.restaurant = await Restaurant.findOne({ merchantUser: user._id });
      extraData.application = await MerchantApplication.findOne({ userId: user._id });
    } else if (user.role === "delivery") {
      extraData.application = await DeliveryApplication.findOne({ userId: user._id });
    } else if (user.role === "customer") {
      extraData.orders = await Order.find({ customer: user._id })
        .sort({ createdAt: -1 })
        .limit(10);
    }

    res.json({
      success: true,
      user,
      ...extraData,
    });
  } catch (error) {
    console.error("Get User By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user details.",
    });
  }
};

// @desc    Suspend or Reactivate user account (Super Admin)
// @route   PATCH /api/superadmin/users/:id/status
// @access  Private (Super Admin Only)
export const updateUserStatusSuper = async (req, res) => {
  try {
    const { isActive } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Protection: Super Admin cannot suspend self or other superadmin
    if (targetUser.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Security Violation: Super Admin accounts cannot be suspended.",
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
      isActive ? "Super Admin reactivated User" : "Super Admin suspended User",
      targetUser,
      { newStatus: isActive, role: targetUser.role }
    );

    res.json({
      success: true,
      message: `User ${targetUser.name} has been ${
        isActive ? "reactivated" : "suspended"
      }.`,
      user: targetUser,
    });
  } catch (error) {
    console.error("Super Admin User Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating user status.",
    });
  }
};

// ==========================================
// MERCHANT MANAGEMENT (Super Admin)
// ==========================================

// @desc    Get all merchants with application & restaurant details
// @route   GET /api/superadmin/merchants
// @access  Private (Super Admin Only)
export const getAllMerchantsSuper = async (req, res) => {
  try {
    const { search, status, isActive } = req.query;
    const query = { role: "merchant" };

    if (status && status !== "all") query.verificationStatus = status;
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

    const merchants = await User.find(query).select("-password").sort({ createdAt: -1 }).lean();
    const merchantIds = merchants.map((m) => m._id);

    const [restaurants, applications] = await Promise.all([
      Restaurant.find({ merchantUser: { $in: merchantIds } }).lean(),
      MerchantApplication.find({ userId: { $in: merchantIds } }).lean(),
    ]);

    const restMap = {};
    restaurants.forEach((r) => {
      restMap[r.merchantUser.toString()] = r;
    });

    const appMap = {};
    applications.forEach((a) => {
      appMap[a.userId.toString()] = a;
    });

    const enriched = merchants.map((m) => ({
      ...m,
      restaurant: restMap[m._id.toString()] || null,
      application: appMap[m._id.toString()] || null,
    }));

    res.json({
      success: true,
      count: enriched.length,
      merchants: enriched,
    });
  } catch (error) {
    console.error("Super Admin Get Merchants Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching merchants list.",
    });
  }
};

// @desc    Approve merchant application (Super Admin)
// @route   PATCH /api/superadmin/merchants/:id/approve
// @access  Private (Super Admin Only)
export const approveMerchantSuper = async (req, res) => {
  try {
    const application = await MerchantApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Merchant application not found.",
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
        role: "merchant",
        verificationStatus: "approved",
        rejectionReason: null,
      },
      { new: true }
    );

    let restaurant = await Restaurant.findOne({ merchantUser: application.userId });
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
        image:
          application.photo ||
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
        merchantUser: application.userId,
        isOpen: true,
      });
    }

    await logAudit(req, "Super Admin approved Merchant", targetUser, {
      applicationId: application._id,
      restaurantName: application.restaurantName,
    });

    res.json({
      success: true,
      message: `Merchant application for ${application.restaurantName} approved by Super Admin.`,
      application,
      restaurant,
    });
  } catch (error) {
    console.error("Super Admin Approve Merchant Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error approving merchant.",
    });
  }
};

// @desc    Reject merchant application with reason (Super Admin)
// @route   PATCH /api/superadmin/merchants/:id/reject
// @access  Private (Super Admin Only)
export const rejectMerchantSuper = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rejection reason.",
      });
    }

    const application = await MerchantApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Merchant application not found.",
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

    await logAudit(req, "Super Admin rejected Merchant", targetUser, {
      applicationId: application._id,
      reason,
    });

    res.json({
      success: true,
      message: `Merchant application for ${application.restaurantName} rejected by Super Admin.`,
      application,
    });
  } catch (error) {
    console.error("Super Admin Reject Merchant Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error rejecting merchant.",
    });
  }
};

// ==========================================
// DELIVERY FLEET MANAGEMENT (Super Admin)
// ==========================================

// @desc    Get all delivery partners (Super Admin)
// @route   GET /api/superadmin/delivery-partners
// @access  Private (Super Admin Only)
export const getAllDeliveryPartnersSuper = async (req, res) => {
  try {
    const { search, status, isActive } = req.query;
    const query = { role: "delivery" };

    if (status && status !== "all") query.verificationStatus = status;
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

    const partners = await User.find(query).select("-password").sort({ createdAt: -1 }).lean();
    const userIds = partners.map((p) => p._id);

    const applications = await DeliveryApplication.find({ userId: { $in: userIds } }).lean();
    const appMap = {};
    applications.forEach((a) => {
      appMap[a.userId.toString()] = a;
    });

    const enriched = partners.map((p) => ({
      ...p,
      application: appMap[p._id.toString()] || null,
      vehicleType: appMap[p._id.toString()]?.vehicleType || "Bike",
      vehicleNumber: appMap[p._id.toString()]?.vehicleNumber || "N/A",
    }));

    res.json({
      success: true,
      count: enriched.length,
      partners: enriched,
    });
  } catch (error) {
    console.error("Super Admin Get Delivery Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching delivery partners.",
    });
  }
};

// @desc    Approve delivery application (Super Admin)
// @route   PATCH /api/superadmin/delivery/:id/approve
// @access  Private (Super Admin Only)
export const approveDeliverySuper = async (req, res) => {
  try {
    const application = await DeliveryApplication.findById(req.params.id);
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

    await logAudit(req, "Super Admin approved Delivery Partner", targetUser, {
      applicationId: application._id,
      fullName: application.fullName,
    });

    res.json({
      success: true,
      message: `Delivery application for ${application.fullName} approved by Super Admin.`,
      application,
    });
  } catch (error) {
    console.error("Super Admin Approve Delivery Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error approving delivery partner.",
    });
  }
};

// @desc    Reject delivery application with reason (Super Admin)
// @route   PATCH /api/superadmin/delivery/:id/reject
// @access  Private (Super Admin Only)
export const rejectDeliverySuper = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rejection reason.",
      });
    }

    const application = await DeliveryApplication.findById(req.params.id);
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

    await logAudit(req, "Super Admin rejected Delivery Partner", targetUser, {
      applicationId: application._id,
      reason,
    });

    res.json({
      success: true,
      message: `Delivery application for ${application.fullName} rejected by Super Admin.`,
      application,
    });
  } catch (error) {
    console.error("Super Admin Reject Delivery Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error rejecting delivery partner.",
    });
  }
};

// ==========================================
// ORDERS SUPERVISION (Super Admin)
// ==========================================

// @desc    Get all platform orders with full relational details (Super Admin)
// @route   GET /api/superadmin/orders
// @access  Private (Super Admin Only)
export const getAllOrdersSuper = async (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;
    const query = {};

    if (status && status !== "all") query.orderStatus = status;
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

    const formatted = orders.map((ord) => ({
      _id: ord._id,
      orderNumber: ord.orderNumber,
      customer: ord.customer
        ? {
            _id: ord.customer._id,
            name: ord.customer.name,
            email: ord.customer.email,
            phone: ord.customer.phone,
          }
        : { name: ord.deliveryAddress?.fullName || "Guest", email: "N/A" },
      restaurant: ord.restaurant
        ? {
            _id: ord.restaurant._id,
            name: ord.restaurant.name,
            hub: ord.restaurant.hub,
          }
        : null,
      merchant: ord.restaurant?.merchantUser
        ? {
            _id: ord.restaurant.merchantUser._id,
            name: ord.restaurant.merchantUser.name,
            email: ord.restaurant.merchantUser.email,
          }
        : null,
      deliveryPartner: ord.deliveryPartner
        ? {
            _id: ord.deliveryPartner._id,
            name: ord.deliveryPartner.name,
            phone: ord.deliveryPartner.phone,
            vehicleType: ord.deliveryPartner.vehicleType,
          }
        : null,
      totalAmount: ord.totalAmount,
      amount: ord.totalAmount,
      itemsCount: ord.items?.length || 0,
      paymentMethod: ord.paymentMethod,
      paymentStatus: ord.paymentStatus,
      orderStatus: ord.orderStatus,
      statusTimeline: ord.statusTimeline,
      date: ord.createdAt,
      createdAt: ord.createdAt,
    }));

    res.json({
      success: true,
      count: formatted.length,
      total,
      orders: formatted,
    });
  } catch (error) {
    console.error("Super Admin Get Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching platform orders.",
    });
  }
};

// ==========================================
// PLATFORM SETTINGS (Stored in MongoDB)
// ==========================================

// @desc    Get Platform Settings (Stored in MongoDB)
// @route   GET /api/superadmin/settings
// @access  Private (Super Admin Only)
export const getPlatformSettings = async (req, res) => {
  try {
    const settings = await PlatformSetting.getSettings();
    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get Settings Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching platform settings.",
    });
  }
};

// @desc    Update Platform Settings (Stored in MongoDB)
// @route   PUT /api/superadmin/settings & PATCH /api/superadmin/settings
// @access  Private (Super Admin Only)
export const updatePlatformSettings = async (req, res) => {
  try {
    const {
      deliveryFee,
      taxRate,
      platformCommission,
      serviceAvailability,
      minOrderAmount,
      freeDeliveryThreshold,
      surgeMultiplier,
      cityHub,
      supportContact,
    } = req.body;

    let settings = await PlatformSetting.getSettings();

    if (deliveryFee !== undefined) settings.deliveryFee = Number(deliveryFee);
    if (taxRate !== undefined) settings.taxRate = Number(taxRate);
    if (platformCommission !== undefined) {
      settings.platformCommission = Number(platformCommission);
    }
    if (serviceAvailability !== undefined) {
      settings.serviceAvailability = Boolean(serviceAvailability);
    }
    if (minOrderAmount !== undefined) settings.minOrderAmount = Number(minOrderAmount);
    if (freeDeliveryThreshold !== undefined) {
      settings.freeDeliveryThreshold = Number(freeDeliveryThreshold);
    }
    if (surgeMultiplier !== undefined) settings.surgeMultiplier = Number(surgeMultiplier);
    if (cityHub !== undefined) settings.cityHub = cityHub;
    if (supportContact !== undefined) settings.supportContact = supportContact;

    settings.updatedBy = req.user._id;
    settings.updatedByName = req.user.name;

    await settings.save();

    await logAudit(req, "Super Admin changed settings", "Platform Settings", {
      deliveryFee: settings.deliveryFee,
      taxRate: settings.taxRate,
      platformCommission: settings.platformCommission,
      serviceAvailability: settings.serviceAvailability,
    });

    res.json({
      success: true,
      message: "Platform settings updated and persisted to MongoDB successfully.",
      settings,
    });
  } catch (error) {
    console.error("Update Settings Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error saving platform settings.",
      error: error.message,
    });
  }
};

// ==========================================
// AUDIT LOGS
// ==========================================

// @desc    Get audit logs with search and pagination
// @route   GET /api/superadmin/audit-logs
// @access  Private (Super Admin Only)
export const getAuditLogs = async (req, res) => {
  try {
    const { action, limit = 50, page = 1, search } = req.query;
    const query = {};

    if (action && action !== "all") {
      query.action = action;
    }

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: "i" } },
        { performedByName: { $regex: search, $options: "i" } },
        { target: { $regex: search, $options: "i" } },
        { targetUserName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      logs,
    });
  } catch (error) {
    console.error("Get Audit Logs Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching audit logs.",
    });
  }
};
