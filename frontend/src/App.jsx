import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Core Customer & Auth Pages
import Home from "./pages/Home";
import Restaurants from "./pages/Restaurants";
import CategoryDishes from "./pages/CategoryDishes";
import Offers from "./pages/Offers";
import Orders from "./pages/Orders";
import RestaurantDetail from "./pages/RestaurantDetail";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BecomeMerchant from "./pages/BecomeMerchant";
import BecomeDeliveryPartner from "./pages/BecomeDeliveryPartner";
import VerificationPending from "./pages/VerificationPending";
import VerificationRejected from "./pages/VerificationRejected";
import Unauthorized from "./pages/Unauthorized";

// Merchant Portal Pages
import MerchantDashboard from "./pages/MerchantDashboard";
import MerchantOrders from "./pages/MerchantOrders";
import MerchantMenuManagement from "./pages/MerchantMenuManagement";
import MerchantEarnings from "./pages/MerchantEarnings";
import MerchantProfile from "./pages/MerchantProfile";

// Fleet Portal Pages
import FleetDashboard from "./pages/FleetDashboard";
import ActiveDelivery from "./pages/ActiveDelivery";
import FleetAvailableOrders from "./pages/FleetAvailableOrders";
import FleetDeliveries from "./pages/FleetDeliveries";
import FleetEarnings from "./pages/FleetEarnings";
import FleetProfile from "./pages/FleetProfile";

// Admin & Super Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminRestaurants from "./pages/AdminRestaurants";
import AdminOrders from "./pages/AdminOrders";
import AdminDeliveryAgents from "./pages/AdminDeliveryAgents";
import AdminProfile from "./pages/AdminProfile";
import AdminApplications from "./pages/AdminApplications";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public / Customer Portal */}
            <Route path="/" element={<Home />} />
            <Route path="/category/:category" element={<CategoryDishes />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/restaurant/:restaurantId" element={<RestaurantDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:orderId" element={<Orders />} />
            <Route path="/orders/:id" element={<Orders />} />
            <Route path="/profile" element={<Profile />} />

          {/* Authentication & Onboarding */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/become-merchant" element={<BecomeMerchant />} />
          <Route path="/become-delivery-partner" element={<BecomeDeliveryPartner />} />

          {/* Verification Status & Authorization Screens */}
          <Route path="/verification-pending" element={<VerificationPending />} />
          <Route path="/verification-rejected" element={<VerificationRejected />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Merchant Portal (Protected: Merchant + Approved Only) */}
          <Route
            path="/merchant"
            element={
              <ProtectedRoute allowedRoles={["merchant"]}>
                <MerchantDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/dashboard"
            element={
              <ProtectedRoute allowedRoles={["merchant"]}>
                <MerchantDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/orders"
            element={
              <ProtectedRoute allowedRoles={["merchant"]}>
                <MerchantOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/menu"
            element={
              <ProtectedRoute allowedRoles={["merchant"]}>
                <MerchantMenuManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/menu-management"
            element={
              <ProtectedRoute allowedRoles={["merchant"]}>
                <MerchantMenuManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/earnings"
            element={
              <ProtectedRoute allowedRoles={["merchant"]}>
                <MerchantEarnings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/profile"
            element={
              <ProtectedRoute allowedRoles={["merchant"]}>
                <MerchantProfile />
              </ProtectedRoute>
            }
          />
          <Route path="/partner" element={<Navigate to="/merchant" replace />} />

          {/* Fleet Portal (Protected: Delivery + Approved Only) */}
          <Route
            path="/fleet"
            element={
              <ProtectedRoute allowedRoles={["delivery"]}>
                <FleetDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fleet/dashboard"
            element={
              <ProtectedRoute allowedRoles={["delivery"]}>
                <FleetDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fleet/active-delivery"
            element={
              <ProtectedRoute allowedRoles={["delivery"]}>
                <ActiveDelivery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fleet/active"
            element={
              <ProtectedRoute allowedRoles={["delivery"]}>
                <ActiveDelivery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fleet/available-orders"
            element={
              <ProtectedRoute allowedRoles={["delivery"]}>
                <FleetAvailableOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fleet/available"
            element={
              <ProtectedRoute allowedRoles={["delivery"]}>
                <FleetAvailableOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fleet/my-deliveries"
            element={
              <ProtectedRoute allowedRoles={["delivery"]}>
                <FleetDeliveries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fleet/history"
            element={
              <ProtectedRoute allowedRoles={["delivery"]}>
                <FleetDeliveries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fleet/earnings"
            element={
              <ProtectedRoute allowedRoles={["delivery"]}>
                <FleetEarnings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fleet/profile"
            element={
              <ProtectedRoute allowedRoles={["delivery"]}>
                <FleetProfile />
              </ProtectedRoute>
            }
          />
          <Route path="/rider" element={<Navigate to="/fleet" replace />} />

          {/* Operational Admin Portal (Protected: Admin & Super Admin) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/restaurants"
            element={
              <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                <AdminRestaurants />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/restaurants-and-approvals"
            element={
              <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                <AdminRestaurants />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/delivery-agents"
            element={
              <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                <AdminDeliveryAgents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/delivery-partners"
            element={
              <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                <AdminDeliveryAgents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                <AdminRestaurants />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/merchants"
            element={
              <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                <AdminRestaurants />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                <AdminProfile />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Management Console (Protected: Super Admin ONLY) */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute allowedRoles={["superadmin"]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);
}

export default App;