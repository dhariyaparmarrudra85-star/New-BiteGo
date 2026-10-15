import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
} from "../controllers/userController.js";
import { verifyJWT } from "../middleware/auth.js";

import addressRoutes from "./addressRoutes.js";

const router = express.Router();

router.use(verifyJWT);

// Nested address sub-routes (/api/users/addresses)
router.use("/addresses", addressRoutes);

router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);
router.put("/change-password", changePassword);

export default router;
