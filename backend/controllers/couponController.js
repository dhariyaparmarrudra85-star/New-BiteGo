import Coupon from "../models/Coupon.js";

// @desc    Validate coupon code and return discount
// @route   POST /api/coupons/validate
// @access  Public
export const validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal, orderAmount } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a coupon code.",
      });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired coupon code.",
      });
    }

    // Check expiry
    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({
        success: false,
        message: "This coupon code has expired.",
      });
    }

    // Check minimum order amount
    const total = Number(cartTotal ?? orderAmount) || 0;
    if (total < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon.`,
      });
    }

    // Check usage limits
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "This coupon code has reached its maximum redemption limit.",
      });
    }

    // Calculate discount securely on backend
    let discount = 0;
    if (coupon.discountType === "fixed") {
      discount = coupon.discountAmount;
    } else if (coupon.discountType === "percentage") {
      discount = (total * coupon.discountAmount) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }

    discount = Math.min(discount, total);

    res.json({
      success: true,
      message: `Coupon '${coupon.code}' applied successfully!`,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountAmount: Number(discount.toFixed(2)),
        description: coupon.description,
      },
    });
  } catch (error) {
    console.error("Coupon Validate Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error validating coupon.",
      error: error.message,
    });
  }
};

// @desc    Get all active coupons
// @route   GET /api/coupons/active
// @access  Public
export const getActiveCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gt: new Date() },
    }).sort({ minOrderAmount: 1 });

    res.json({
      success: true,
      coupons,
    });
  } catch (error) {
    console.error("Get Active Coupons Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching active coupons.",
      error: error.message,
    });
  }
};
