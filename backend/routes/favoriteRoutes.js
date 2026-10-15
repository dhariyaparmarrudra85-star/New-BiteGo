import express from "express";
import {
  getFavorites,
  toggleFavorite,
} from "../controllers/favoriteController.js";
import { verifyJWT } from "../middleware/auth.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getFavorites);
router.post("/", toggleFavorite);
router.post("/toggle", toggleFavorite);

export default router;
