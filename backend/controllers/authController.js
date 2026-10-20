import jwt from "jsonwebtoken";
import User from "../models/User.js";
import OtpVerification from "../models/OtpVerification.js";
import {
  normalizePhoneNumber,
  generateSecureOtp,
  hashOtp,
  verifyOtpHash,
  dispatchSmsOtp,
  getSmsProviderInfo,
} from "../utils/smsService.js";
import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client();

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

// @desc    Send 6-digit OTP verification code via SMS
// @route   POST /api/auth/otp/send
// @access  Public
export const sendPhoneOtp = async (req, res) => {
  try {
    const { phone, countryCode = "+91" } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Please enter your phone number.",
      });
    }

    let normalizedPhone;
    try {
      normalizedPhone = normalizePhoneNumber(phone, countryCode);
    } catch (normErr) {
      return res.status(400).json({
        success: false,
        message: normErr.message,
      });
    }

    // 1. Check Resend Cooldown (60 seconds)
    const recentOtp = await OtpVerification.findOne({
      phoneNumber: normalizedPhone,
      verified: false,
      resendAvailableAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (recentOtp) {
      const waitSeconds = Math.ceil(
        (new Date(recentOtp.resendAvailableAt).getTime() - Date.now()) / 1000
      );
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
        retryAfter: waitSeconds,
      });
    }

    // 2. Abuse Prevention: Max 5 OTP requests per hour per phone
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyCount = await OtpVerification.countDocuments({
      phoneNumber: normalizedPhone,
      createdAt: { $gte: oneHourAgo },
    });

    if (hourlyCount >= 5) {
      return res.status(429).json({
        success: false,
        message:
          "Too many OTP requests for this phone number. Please try again after an hour.",
      });
    }

    // 3. Verify SMS Provider Availability BEFORE creating verification records
    const providerInfo = getSmsProviderInfo();
    if (!providerInfo.isConfigured) {
      return res.status(503).json({
        success: false,
        code: "SMS_NOT_CONFIGURED",
        message:
          "SMS verification is currently unavailable. Please sign in with your email and password, or contact support.",
      });
    }

    // 4. Generate 6-digit OTP and secure hash
    const otp = generateSecureOtp();
    const otpHash = hashOtp(otp);

    // 5. Save to Database (5 min expiry, 60s cooldown)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const resendAvailableAt = new Date(Date.now() + 60 * 1000);

    const otpRecord = await OtpVerification.create({
      phoneNumber: normalizedPhone,
      otpHash,
      expiresAt,
      resendAvailableAt,
      ip: req.ip || "",
    });

    // 6. Dispatch SMS via Provider (Twilio, MSG91, or Dev Sandbox)
    let dispatchResult;
    try {
      dispatchResult = await dispatchSmsOtp({
        phoneNumber: normalizedPhone,
        otp,
      });
    } catch (dispatchErr) {
      // Clean up the un-dispatched OTP record so the user is not locked out
      await OtpVerification.findByIdAndDelete(otpRecord._id);
      const statusCode = dispatchErr.statusCode || 502;
      return res.status(statusCode).json({
        success: false,
        code: dispatchErr.code || "SMS_DISPATCH_FAILED",
        message: dispatchErr.message || "Failed to dispatch verification code. Please try again or use email login.",
      });
    }

    // Mask phone for response: +91 98765 43210 -> +91 XXXXXXX210
    const maskedPhone =
      normalizedPhone.slice(0, 3) +
      " " +
      "X".repeat(Math.max(0, normalizedPhone.length - 6)) +
      normalizedPhone.slice(-3);

    const responsePayload = {
      success: true,
      message: `Verification code sent to ${maskedPhone}.`,
      phoneNumber: normalizedPhone,
      resendAvailableIn: 60,
      provider: dispatchResult.provider,
    };

    // In non-production mode, if Twilio is not configured, supply dev test code hint
    if (
      process.env.NODE_ENV !== "production" &&
      !process.env.TWILIO_ACCOUNT_SID &&
      !process.env.MSG91_AUTH_KEY
    ) {
      responsePayload.devSandboxNote =
        "Dev Sandbox: Live SMS provider not set. Use the generated OTP or 123456.";
    }

    res.json(responsePayload);
  } catch (error) {
    console.error("[OTP Send Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send verification code. Please try again.",
    });
  }
};

// @desc    Verify phone OTP & Authenticate/Register Customer
// @route   POST /api/auth/otp/verify
// @access  Public
export const verifyPhoneOtp = async (req, res) => {
  try {
    const { phone, otp, countryCode = "+91" } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and verification code are required.",
      });
    }

    let normalizedPhone;
    try {
      normalizedPhone = normalizePhoneNumber(phone, countryCode);
    } catch (normErr) {
      return res.status(400).json({
        success: false,
        message: normErr.message,
      });
    }

    const cleanOtp = String(otp).trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit verification code.",
      });
    }

    // 1. Find active OTP record
    const otpRecord = await OtpVerification.findOne({
      phoneNumber: normalizedPhone,
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message:
          "Verification code has expired or was not requested. Please request a new code.",
      });
    }

    // 2. Check failed attempts limit (max 3)
    if (otpRecord.attempts >= 3) {
      await OtpVerification.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message:
          "Too many failed verification attempts. This code is now invalid. Please request a new code.",
      });
    }

    // 3. Verify OTP Hash (Timing-safe)
    const isDevSandboxMatch =
      process.env.NODE_ENV !== "production" &&
      !process.env.TWILIO_ACCOUNT_SID &&
      !process.env.MSG91_AUTH_KEY &&
      cleanOtp === "123456";

    const isMatch = verifyOtpHash(cleanOtp, otpRecord.otpHash) || isDevSandboxMatch;

    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 3 - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${remaining} attempt${
          remaining === 1 ? "" : "s"
        } remaining.`,
      });
    }

    // 4. Mark OTP as verified (prevent replay)
    otpRecord.verified = true;
    await otpRecord.save();

    // 5. Find or Create User Account
    // Check by normalized phoneNumber or existing phone string
    let user = await User.findOne({
      $or: [
        { phoneNumber: normalizedPhone },
        { phone: normalizedPhone },
        { phone: phone.trim() },
      ],
    });

    let isNewUser = false;

    if (user) {
      // Check active status
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Your account has been suspended by an administrator.",
        });
      }

      // Update phone verification flag
      user.phoneVerified = true;
      user.phoneNumber = normalizedPhone;
      if (!user.authProviders.includes("phone")) {
        user.authProviders.push("phone");
      }
      await user.save();
    } else {
      // New User Onboarding -> Always Customer Role!
      isNewUser = true;
      user = await User.create({
        name: `Foodie ${normalizedPhone.slice(-4)}`,
        phone: normalizedPhone,
        phoneNumber: normalizedPhone,
        phoneVerified: true,
        role: "customer",
        verificationStatus: "approved",
        authProviders: ["phone"],
        isActive: true,
      });
    }

    // 6. Generate Session JWT
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: isNewUser
        ? "Welcome to BiteGo! Account created successfully."
        : "Welcome back! Login successful.",
      token,
      isNewUser,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email || "",
        phone: user.phone || user.phoneNumber,
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified,
        role: user.role,
        verificationStatus: user.verificationStatus,
        authProviders: user.authProviders,
      },
    });
  } catch (error) {
    console.error("[OTP Verify Error]:", error);
    res.status(500).json({
      success: false,
      message: "Server error during verification. Please try again.",
      error: error.message,
    });
  }
};

// @desc    Authenticate with Google OAuth ID Token
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res) => {
  try {
    const { idToken, credential } = req.body;
    const token = idToken || credential;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Google ID token is required.",
      });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.error("[Google Auth Error]: GOOGLE_CLIENT_ID is not configured in environment variables.");
      return res.status(500).json({
        success: false,
        message: "Google authentication is not configured on the server.",
      });
    }

    // Verify token with trusted google-auth-library
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error("[Google Auth Error]: Token verification failed:", verifyError.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired Google credentials.",
      });
    }

    if (!payload || !payload.sub) {
      return res.status(401).json({
        success: false,
        message: "Google profile identifier missing from token.",
      });
    }

    // Validate issuer
    if (
      payload.iss !== "accounts.google.com" &&
      payload.iss !== "https://accounts.google.com"
    ) {
      return res.status(401).json({
        success: false,
        message: "Google token issuer validation failed.",
      });
    }

    const googleId = payload.sub;
    const email = payload.email ? payload.email.toLowerCase() : null;
    const name = payload.name || "BiteGo Customer";
    const picture = payload.picture || "";

    // 1. Look up by Google ID
    let user = await User.findOne({ googleId });
    let isNewUser = false;

    if (!user) {
      // 2. Prevent automatic account merging based only on matching email
      if (email) {
        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
          console.warn("[Google Auth]: Account already exists with email without Google ID linkage. Aborting auto-merge.");
          return res.status(409).json({
            success: false,
            message: "An account with this email already exists. Please log in using your email and password.",
          });
        }
      }

      // 3. Create new user (ALWAYS customer role for new public signups)
      isNewUser = true;
      user = await User.create({
        name,
        email: email || undefined,
        emailVerified: Boolean(payload.email_verified),
        googleId,
        role: "customer",
        verificationStatus: "approved",
        authProviders: ["google"],
        profilePhoto: picture,
        isActive: true,
      });
      console.log(`[Google Auth]: Created new customer account.`);
    } else {
      console.log(`[Google Auth]: Found existing user with Google ID.`);
      if (picture && !user.profilePhoto) {
        user.profilePhoto = picture;
        await user.save();
      }
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended by an administrator.",
      });
    }

    const sessionToken = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: isNewUser
        ? "Welcome to BiteGo! Account created via Google."
        : "Welcome back! Signed in with Google.",
      token: sessionToken,
      isNewUser,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        verificationStatus: user.verificationStatus,
        profilePhoto: user.profilePhoto,
        authProviders: user.authProviders,
      },
    });
  } catch (error) {
    console.error("[Google Auth Error]:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during Google authentication.",
      error: error.message,
    });
  }
};


// @desc    Authenticate with Apple Sign-In Token
// @route   POST /api/auth/apple
// @access  Public
export const appleAuth = async (req, res) => {
  try {
    const { identityToken, user: appleUserData } = req.body;

    if (!identityToken) {
      return res.status(400).json({
        success: false,
        message: "Apple identity token is required.",
      });
    }

    // Check if Apple Developer credentials are configured
    if (!process.env.APPLE_CLIENT_ID) {
      return res.status(501).json({
        success: false,
        message:
          "Apple Sign-In is not currently configured on this server. Please configure APPLE_CLIENT_ID and APPLE_TEAM_ID in .env.",
      });
    }

    // Decode Apple JWT payload (standard unverified inspect or jwt.decode)
    const decoded = jwt.decode(identityToken);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({
        success: false,
        message: "Malformed Apple identity token.",
      });
    }

    const appleId = decoded.sub;
    const email = decoded.email ? decoded.email.toLowerCase() : null;
    const name =
      appleUserData?.name?.firstName && appleUserData?.name?.lastName
        ? `${appleUserData.name.firstName} ${appleUserData.name.lastName}`
        : "Apple User";

    let user = await User.findOne({ appleId });
    let isNewUser = false;

    if (!user && email) {
      user = await User.findOne({ email });
      if (user) {
        user.appleId = appleId;
        user.emailVerified = true;
        if (!user.authProviders.includes("apple")) {
          user.authProviders.push("apple");
        }
        await user.save();
      }
    }

    if (!user) {
      isNewUser = true;
      user = await User.create({
        name,
        email: email || undefined,
        emailVerified: Boolean(decoded.email_verified),
        appleId,
        role: "customer",
        verificationStatus: "approved",
        authProviders: ["apple"],
        isActive: true,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended by an administrator.",
      });
    }

    const sessionToken = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: isNewUser
        ? "Welcome to BiteGo! Account created via Apple."
        : "Welcome back! Signed in with Apple.",
      token: sessionToken,
      isNewUser,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        verificationStatus: user.verificationStatus,
        authProviders: user.authProviders,
      },
    });
  } catch (error) {
    console.error("[Apple Auth Error]:", error);
    res.status(500).json({
      success: false,
      message: "Server error during Apple authentication.",
      error: error.message,
    });
  }
};


