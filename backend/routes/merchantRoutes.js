import express from "express";
import {
  applyMerchant,
  getMyApplication,
  getMerchantRestaurant,
  updateMerchantRestaurant,
  toggleRestaurantStatus,
  getMerchantMenuItems,
  addMerchantMenuItem,
  updateMerchantMenuItem,
  deleteMerchantMenuItem,
  toggleMenuItemAvailability,
  getMerchantOrders,
  updateMerchantOrderStatus,
  getMerchantDashboard,
} from "../controllers/merchantController.js";
import {
  verifyJWT,
  authorizeRoles,
  requireApproved,
} from "../middleware/auth.js";

const router = express.Router();

// Application submission & tracking (Authenticated User)
router.post("/apply", verifyJWT, applyMerchant);
router.get("/application", verifyJWT, getMyApplication);

// Middleware for all operational merchant routes
const merchantAuth = [
  verifyJWT,
  authorizeRoles("merchant", "admin", "superadmin"),
  requireApproved,
];

// Operational Merchant Hub routes
router.get("/dashboard", merchantAuth, getMerchantDashboard);

// Restaurant Profile & Online Status
router.get("/restaurant", merchantAuth, getMerchantRestaurant);
router.put("/restaurant", merchantAuth, updateMerchantRestaurant);
router.patch("/restaurant/status", merchantAuth, toggleRestaurantStatus);

// Menu & Dish Catalog Management
router.get("/menu", merchantAuth, getMerchantMenuItems);
router.post("/menu", merchantAuth, addMerchantMenuItem);
router.put("/menu/:id", merchantAuth, updateMerchantMenuItem);
router.delete("/menu/:id", merchantAuth, deleteMerchantMenuItem);
router.patch("/menu/:id/availability", merchantAuth, toggleMenuItemAvailability);

// Kitchen Dispatch & Order Pipeline Management
router.get("/orders", merchantAuth, getMerchantOrders);
router.patch("/orders/:id/status", merchantAuth, updateMerchantOrderStatus);

export default router;
