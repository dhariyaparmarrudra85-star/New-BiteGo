import express from "express";
import {
  applyDelivery,
  getMyApplication,
  toggleDutyStatus,
  getAvailableDeliveries,
  acceptDeliveryOrder,
  pickupDeliveryOrder,
  outForDeliveryOrder,
  verifyDeliveryOtpAndComplete,
  assignOrderToPartner,
  getDeliveryDashboard,
  getDeliveryHistory,
  declineDeliveryOrder,
} from "../controllers/deliveryController.js";
import {
  verifyJWT,
  authorizeRoles,
  requireApproved,
} from "../middleware/auth.js";

const router = express.Router();

// Delivery partner application (Authenticated User)
router.post("/apply", verifyJWT, applyDelivery);
router.get("/application", verifyJWT, getMyApplication);

// Delivery partner middleware: delivery role + approved status
const deliveryAuth = [
  verifyJWT,
  authorizeRoles("delivery", "admin", "superadmin"),
  requireApproved,
];

// Operational Delivery Partner endpoints
router.get("/status", deliveryAuth, (req, res) => res.json({ success: true, isOnline: req.user.isOnline, isAvailable: req.user.isAvailable }));
router.patch("/status", deliveryAuth, toggleDutyStatus);
router.patch("/duty", deliveryAuth, toggleDutyStatus);
router.get("/dashboard", deliveryAuth, getDeliveryDashboard);
router.get("/available", deliveryAuth, getAvailableDeliveries);
router.get("/orders/available", deliveryAuth, getAvailableDeliveries);
router.get("/history", deliveryAuth, getDeliveryHistory);

// Order Lifecycle Actions
router.patch("/orders/:id/accept", deliveryAuth, acceptDeliveryOrder);
router.patch("/orders/:id/decline", deliveryAuth, declineDeliveryOrder);
router.post("/orders/:id/decline", deliveryAuth, declineDeliveryOrder);
router.patch("/orders/:id/pickup", deliveryAuth, pickupDeliveryOrder);
router.patch("/orders/:id/out-for-delivery", deliveryAuth, outForDeliveryOrder);
router.patch("/orders/:id/verify-otp", deliveryAuth, verifyDeliveryOtpAndComplete);
router.post("/orders/:id/verify-otp", deliveryAuth, verifyDeliveryOtpAndComplete);

// Admin / Dispatcher Assignment
router.post(
  "/orders/:id/assign",
  verifyJWT,
  authorizeRoles("admin", "superadmin"),
  assignOrderToPartner
);

export default router;
