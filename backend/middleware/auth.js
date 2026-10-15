import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verify JWT token and attach active user to req.user
export const verifyJWT = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header: Bearer <token>
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Authentication token is missing.",
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "bitego_secure_jwt_secret_key"
    );

    // Fetch user from DB (never blindly trust token payload)
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed. User no longer exists.",
      });
    }

    // Check account active status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended by an administrator.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid or malformed authentication token.",
    });
  }
};

// Check if user has one of the allowed roles
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

// Ensure merchant or delivery partner has approved verification status
export const requireApproved = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  // Admin and Superadmin bypass merchant/delivery verification
  if (req.user.role === "admin" || req.user.role === "superadmin") {
    return next();
  }

  if (
    req.user.role === "merchant" ||
    req.user.role === "delivery"
  ) {
    if (req.user.verificationStatus === "pending") {
      return res.status(403).json({
        success: false,
        verificationStatus: "pending",
        message: "Your application is currently pending admin verification.",
      });
    }

    if (req.user.verificationStatus === "rejected") {
      return res.status(403).json({
        success: false,
        verificationStatus: "rejected",
        rejectionReason: req.user.rejectionReason,
        message: `Your application was rejected. Reason: ${
          req.user.rejectionReason || "Criteria not met"
        }`,
      });
    }
  }

  next();
};
