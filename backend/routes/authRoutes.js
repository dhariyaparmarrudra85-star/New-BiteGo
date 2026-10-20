import express from "express";
import {
  register,
  login,
  logout,
  getMe,
  sendPhoneOtp,
  verifyPhoneOtp,
  googleAuth,
  appleAuth,
} from "../controllers/authController.js";
import { verifyJWT } from "../middleware/auth.js";

const router = express.Router();

// Email / Password authentication
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", verifyJWT, getMe);

// Phone OTP authentication
router.post("/otp/send", sendPhoneOtp);
router.post("/otp/verify", verifyPhoneOtp);

// Social authentication
router.post("/google", googleAuth);
router.post("/apple", appleAuth);

export default router;

