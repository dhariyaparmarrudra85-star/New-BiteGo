import express from "express";
import { getCart, syncCart, clearCart } from "../controllers/cartController.js";
import { verifyJWT } from "../middleware/auth.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getCart);
router.post("/", syncCart);
router.delete("/", clearCart);

export default router;
