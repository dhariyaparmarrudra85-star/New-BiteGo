import express from "express";
import {
  getPlatformOverview,
  getAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  updateAdminStatus,
  deleteAdmin,
  getAllUsers,
  getUserById,
  updateUserStatusSuper,
  getAllMerchantsSuper,
  approveMerchantSuper,
  rejectMerchantSuper,
  getAllDeliveryPartnersSuper,
  approveDeliverySuper,
  rejectDeliverySuper,
  getAllOrdersSuper,
  getPlatformSettings,
  updatePlatformSettings,
  getAuditLogs,
} from "../controllers/superAdminController.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Strict security barrier: Super Admin role ONLY.
// Admin, Merchant, Delivery, and Customer are strictly forbidden.
router.use(verifyJWT, authorizeRoles("superadmin"));

// 1. Platform Overview & Metrics
router.get("/overview", getPlatformOverview);

// 2. Admin Management (Super Admin is the only creator/manager of Admins)
router.get("/admins", getAdmins);
router.get("/admins/:id", getAdminById);
router.post("/admins", createAdmin);
router.patch("/admins/:id", updateAdmin);
router.put("/admins/:id", updateAdmin);
router.patch("/admins/:id/status", updateAdminStatus);
router.delete("/admins/:id", deleteAdmin);

// 3. User Management (All 5 Roles)
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/status", updateUserStatusSuper);

// 4. Merchant Management (Super Admin Platform-Wide)
router.get("/merchants", getAllMerchantsSuper);
router.patch("/merchants/:id/approve", approveMerchantSuper);
router.patch("/merchants/:id/reject", rejectMerchantSuper);

// 5. Delivery Fleet Management (Super Admin Platform-Wide)
router.get("/delivery-partners", getAllDeliveryPartnersSuper);
router.patch("/delivery/:id/approve", approveDeliverySuper);
router.patch("/delivery/:id/reject", rejectDeliverySuper);

// 6. Orders Supervision (Super Admin Platform-Wide)
router.get("/orders", getAllOrdersSuper);

// 7. Platform Settings (Persisted in MongoDB)
router.get("/settings", getPlatformSettings);
router.put("/settings", updatePlatformSettings);
router.patch("/settings", updatePlatformSettings);

// 8. Audit Logs
router.get("/audit-logs", getAuditLogs);

export default router;
