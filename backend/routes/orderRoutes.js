import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  reviewOrder,
  reorderOrder,
  processOrderPayment,
  updateOrderStatus,
  acceptDelivery,
  pickupDelivery,
  outForDelivery,
  verifyDeliveryOtp,
} from "../controllers/orderController.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.use(verifyJWT);

// Customer endpoints
router.post("/", createOrder);
router.get("/", getMyOrders);
router.get("/my-orders", getMyOrders);
router.get("/:id", getOrderById);
router.patch("/:id/cancel", cancelOrder);
router.post("/:id/pay", processOrderPayment);
router.post("/:id/review", reviewOrder);
router.post("/:id/reorder", reorderOrder);

// Portal status transitions (Merchant / Courier / Admin)
router.patch(
  "/:id/status",
  authorizeRoles("merchant", "delivery", "admin", "superadmin"),
  updateOrderStatus
);

// Delivery specific actions
router.patch(
  "/:id/accept-delivery",
  authorizeRoles("delivery", "admin", "superadmin"),
  acceptDelivery
);

router.patch(
  "/:id/pickup",
  authorizeRoles("delivery", "admin", "superadmin"),
  pickupDelivery
);

router.patch(
  "/:id/out-for-delivery",
  authorizeRoles("delivery", "admin", "superadmin"),
  outForDelivery
);

router.patch(
  "/:id/verify-otp",
  authorizeRoles("delivery", "admin", "superadmin"),
  verifyDeliveryOtp
);
router.post(
  "/:id/verify-otp",
  authorizeRoles("delivery", "admin", "superadmin"),
  verifyDeliveryOtp
);

export default router;
