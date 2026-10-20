import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import { seedSuperAdminAndDemoAccounts } from "./config/seedSuperAdmin.js";
import { seedCustomerData } from "./config/seedCustomerData.js";

import authRoutes from "./routes/authRoutes.js";
import merchantRoutes from "./routes/merchantRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";

import notificationRoutes from "./routes/notificationRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Database
connectDB().then(async () => {
  await seedSuperAdminAndDemoAccounts();
  await seedCustomerData();
});

// CORS Configuration & Origin Management
const isProduction = process.env.NODE_ENV === "production";

// Parse configured origins safely from environment variables (CLIENT_URL, ALLOWED_ORIGINS)
const parseConfiguredOrigins = () => {
  const sources = [process.env.CLIENT_URL, process.env.ALLOWED_ORIGINS];
  const origins = [];

  for (const raw of sources) {
    if (raw && typeof raw === "string") {
      raw
        .split(",")
        .map((s) => s.trim().replace(/\/+$/, "")) // Normalize by removing trailing slashes
        .filter((s) => s.length > 0)
        .forEach((origin) => {
          if (!origins.includes(origin)) origins.push(origin);
        });
    }
  }
  return origins;
};

const configuredOrigins = parseConfiguredOrigins();

// Local development origins enabled ONLY when NODE_ENV !== "production"
const devOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];

// In production, only permit explicitly configured origins
const allowedOrigins = isProduction
  ? configuredOrigins
  : [...new Set([...configuredOrigins, ...devOrigins])];

if (isProduction && allowedOrigins.length === 0) {
  console.warn(
    "[CORS Warning] Server running in production (NODE_ENV=production), but neither CLIENT_URL nor ALLOWED_ORIGINS is configured. Cross-origin browser requests will be blocked."
  );
} else {
  console.log(
    `[CORS] Mode: ${isProduction ? "production" : "development"}. Allowed origins:`,
    allowedOrigins.length > 0 ? allowedOrigins : "(none)"
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      // 1. Allow non-browser requests (curl, server-to-server, health monitors, same-origin)
      if (!origin) {
        return callback(null, true);
      }

      // 2. Normalize incoming origin (remove trailing slash)
      const normalized = origin.trim().replace(/\/+$/, "");

      // 3. Match against allowed origins
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }

      // 4. Reject unapproved origins without wildcard fallback
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400, // 24-hour preflight cache
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base Health Check
app.get("/", (req, res) => {
  res.json({
    name: "BiteGo Enterprise Platform API",
    status: "Healthy",
    version: "2.5.0",
    rolesSupported: ["customer", "merchant", "delivery", "admin", "superadmin"],
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/users/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/merchant", merchantRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/notifications", notificationRoutes);

// 404 Handler for Unmatched Routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling
app.use((err, req, res, next) => {
  console.error("Unhandled API Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`BiteGo Backend running on http://localhost:${PORT}`);
});