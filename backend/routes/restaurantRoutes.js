import express from "express";
import {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantMenu,
  getTrendingDishes,
  getCategories,
  getCategoryDishes,
  searchRestaurantsAndDishes,
} from "../controllers/restaurantController.js";

const router = express.Router();

router.get("/trending-dishes", getTrendingDishes);
router.get("/categories", getCategories);
router.get("/category/:category", getCategoryDishes);
router.get("/search", searchRestaurantsAndDishes);
router.get("/", getAllRestaurants);
router.get("/:id", getRestaurantById);
router.get("/:id/menu", getRestaurantMenu);

export default router;
