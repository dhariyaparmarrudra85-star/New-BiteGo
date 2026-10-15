import jwt from "jsonwebtoken";
import User from "../models/User.js";
import mongoose from "mongoose";

// Generate JWT token helper
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || "bitego_secure_jwt_secret_key",
    { expiresIn: "7d" }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  console.log(`[Registration] Request received for email: ${req.body.email}`);
  try {
    const { name, email, password, phone, role = "customer" } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      console.log(`[Registration] Validation failed: Missing required fields for email: ${email}`);
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password.",
      });
    }

    // SECURITY RULE 6: Disallow public registration of admin or superadmin
    if (role === "admin" || role === "superadmin") {
      console.log(`[Registration] Validation failed: Invalid role attempt for email: ${email}`);
      return res.status(403).json({
        success: false,
        message:
          "Administrative roles cannot be created via public registration.",
      });
    }

    // Validate role is one of the allowed registration roles
    if (!["customer", "merchant", "delivery"].includes(role)) {
      console.log(`[Registration] Validation failed: Invalid role specified for email: ${email}`);
      return res.status(400).json({
        success: false,
        message: "Invalid role specified.",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`[Registration] Validation failed: Duplicate email: ${email}`);
      return res.status(400).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }
    
    console.log(`[Registration] Validation passed for email: ${email}`);
    
    // Check MongoDB connection state
    const readyState = mongoose.connection.readyState;
    console.log(`[Registration] MongoDB connection state: ${readyState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
    
    if (readyState !== 1) {
      console.error(`[Registration] Database save failed: MongoDB is not connected.`);
      return res.status(500).json({
        success: false,
        message: "Server error: Database not connected.",
      });
    }

    // New merchants and delivery partners are set to pending verification
    const verificationStatus =
      role === "customer" ? "approved" : "pending";

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || "",
      role,
      verificationStatus,
    });
    
    const savedUser = await newUser.save();
    
    if (savedUser) {
      console.log(`[Registration] Database save succeeded. Newly created user ID: ${savedUser._id}`);
      console.log(`[Registration] API response status: 201 Created`);
      const token = generateToken(savedUser._id, savedUser.role);
      res.status(201).json({
        success: true,
        message: "Registration successful. Please login.",
        token,
        user: {
          _id: savedUser._id,
          id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email,
          phone: savedUser.phone,
          role: savedUser.role,
          verificationStatus: savedUser.verificationStatus,
        },
      });
    } else {
      console.error(`[Registration] Database save failed for unknown reason.`);
      res.status(500).json({
        success: false,
        message: "Server error during registration.",
      });
    }
  } catch (error) {
    console.error("[Registration] Database save failed with error:", error);
    console.log(`[Registration] API response status: 500 Internal Server Error`);
    res.status(500).json({
      success: false,
      message: "Server error during registration.",
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    // Find user with password field included
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check if account is suspended
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been suspended. Please contact BiteGo administration.",
      });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verificationStatus: user.verificationStatus,
        rejectionReason: user.rejectionReason,
        isActive: user.isActive,
        isOnline: user.isOnline,
        isAvailable: user.isAvailable,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login.",
      error: error.message,
    });
  }
};

// @desc    Get current authenticated user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verificationStatus: user.verificationStatus,
        rejectionReason: user.rejectionReason,
        isActive: user.isActive,
        isOnline: user.isOnline,
        isAvailable: user.isAvailable,
        address: user.address,
        city: user.city,
      },
    });
  } catch (error) {
    console.error("GetMe Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user information.",
    });
  }
};

// @desc    Logout user / clear session cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.json({
    success: true,
    message: "Logged out successfully.",
  });
};

