import express from "express";
import {
  getMerchantApplications,
  approveMerchant,
  rejectMerchant,
  getDeliveryApplications,
  approveDelivery,
  rejectDelivery,
  getUsers,
  updateUserStatus,
  getAdminOverview,
  getApprovedMerchants,
  getDeliveryPartners,
  getCustomers,
  getCustomerById,
  getAdminOrders,
  updateAdminOrderStatus,
  deleteUser,
  updateUserRole,
} from "../controllers/adminController.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// All admin routes require admin or superadmin
router.use(verifyJWT, authorizeRoles("admin", "superadmin"));

// Dashboard Statistics (Real MongoDB aggregated metrics)
router.get("/overview", getAdminOverview);
router.get("/stats", getAdminOverview);
router.get("/dashboard", getAdminOverview);

// Merchant management
router.get("/merchant-applications", getMerchantApplications);
router.patch("/merchants/:id/approve", approveMerchant);
router.patch("/merchants/:id/reject", rejectMerchant);
router.get("/merchants", getApprovedMerchants);

// Delivery management
router.get("/delivery-applications", getDeliveryApplications);
router.patch("/delivery/:id/approve", approveDelivery);
router.patch("/delivery/:id/reject", rejectDelivery);
router.patch("/delivery-partners/:id/approve", approveDelivery);
router.patch("/delivery-partners/:id/reject", rejectDelivery);
router.get("/delivery-partners", getDeliveryPartners);

// Customer management
router.get("/customers", getCustomers);
router.get("/customers/:id", getCustomerById);

// Order management
router.get("/orders", getAdminOrders);
router.patch("/orders/:id/status", updateAdminOrderStatus);

// Operational User management
router.get("/users", getUsers);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

export default router;
