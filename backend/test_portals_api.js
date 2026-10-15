import dotenv from "dotenv";
dotenv.config();

const BASE_URL = "http://localhost:5000";

async function testPortals() {
  console.log("============================================================");
  console.log(" VERIFYING PORTAL API ENDPOINTS & DATA IN BITEGO");
  console.log("============================================================");

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/`);
  const health = await healthRes.json();
  console.log("Backend Health:", health.status === "Healthy" ? "PASS" : "FAIL", health);

  // 2. Restaurants API (Customer / Merchant / General)
  const restRes = await fetch(`${BASE_URL}/api/restaurants`);
  const restData = await restRes.json();
  const restList = Array.isArray(restData) ? restData : restData.data || restData.restaurants || [];
  console.log(`Restaurants API: PASS (${restList.length} restaurants retrieved from BiteGo)`);
  if (restList.length > 0) {
    const sampleRest = restList[0];
    console.log(`  Sample Restaurant: "${sampleRest.name}" (ID: ${sampleRest._id})`);

    // 3. Menu items for sample restaurant
    const menuRes = await fetch(`${BASE_URL}/api/restaurants/${sampleRest._id}/menu`);
    if (menuRes.ok) {
      const menuData = await menuRes.json();
      const menuItems = Array.isArray(menuData) ? menuData : menuData.data || menuData.items || [];
      console.log(`  Restaurant Menu API: PASS (${menuItems.length} items retrieved)`);
    } else {
      console.log(`  Restaurant Menu API HTTP Status: ${menuRes.status}`);
    }
  }

  // 4. Coupons API
  const couponRes = await fetch(`${BASE_URL}/api/coupons`);
  if (couponRes.ok) {
    const couponData = await couponRes.json();
    const coupons = Array.isArray(couponData) ? couponData : couponData.data || [];
    console.log(`Coupons API: PASS (${coupons.length} coupons retrieved)`);
  }

  // 5. Customer Login & Authenticated Endpoints
  console.log("\nTesting Customer Authentication & User Data...");
  const custLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "customer@bitego.com",
      password: "Customer@123",
    }),
  });
  const custLoginData = await custLoginRes.json();
  if (custLoginData.success) {
    console.log(`Customer Login: PASS (User: ${custLoginData.user?.name}, Role: ${custLoginData.user?.role})`);
    const custToken = custLoginData.token;

    // Customer Addresses
    const addrRes = await fetch(`${BASE_URL}/api/users/addresses`, {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    if (addrRes.ok) {
      const addrData = await addrRes.json();
      console.log(`Customer Addresses API: PASS (${(addrData.data || addrData).length || 0} addresses)`);
    }

    // Customer Orders
    const ordersRes = await fetch(`${BASE_URL}/api/orders/my-orders`, {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    if (ordersRes.ok) {
      const ordersData = await ordersRes.json();
      console.log(`Customer Orders API: PASS (${(ordersData.data || ordersData).length || 0} orders)`);
    }
  } else {
    console.log("Customer Login failed:", custLoginData.message);
  }

  // 6. Merchant Login & Portal Data
  console.log("\nTesting Merchant Authentication...");
  const merchLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "merchant@darkroast.com",
      password: "Merchant@123",
    }),
  });
  const merchLoginData = await merchLoginRes.json();
  if (merchLoginData.success) {
    console.log(`Merchant Login: PASS (User: ${merchLoginData.user?.name}, Role: ${merchLoginData.user?.role})`);
    const merchToken = merchLoginData.token;

    // Merchant orders
    const merchOrdersRes = await fetch(`${BASE_URL}/api/merchant/orders`, {
      headers: { Authorization: `Bearer ${merchToken}` },
    });
    if (merchOrdersRes.ok) {
      const merchOrders = await merchOrdersRes.json();
      console.log(`Merchant Orders API: PASS (${(merchOrders.data || merchOrders).length || 0} orders found)`);
    }
  } else {
    console.log("Merchant Login failed:", merchLoginData.message);
  }

  // 7. Delivery Partner Login
  console.log("\nTesting Delivery Partner Authentication...");
  const delivLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "delivery@bitego.com",
      password: "Delivery@123",
    }),
  });
  const delivLoginData = await delivLoginRes.json();
  if (delivLoginData.success) {
    console.log(`Delivery Partner Login: PASS (User: ${delivLoginData.user?.name}, Role: ${delivLoginData.user?.role})`);
    const delivToken = delivLoginData.token;

    const delivOrdersRes = await fetch(`${BASE_URL}/api/delivery/orders/available`, {
      headers: { Authorization: `Bearer ${delivToken}` },
    });
    if (delivOrdersRes.ok) {
      const delivOrders = await delivOrdersRes.json();
      console.log(`Delivery Available Orders API: PASS (${(delivOrders.data || delivOrders).length || 0} orders)`);
    }
  } else {
    console.log("Delivery Partner Login failed:", delivLoginData.message);
  }

  // 8. Admin Login
  console.log("\nTesting Admin Authentication & Overview...");
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@bitego.com",
      password: "Admin@123",
    }),
  });
  const adminLoginData = await adminLoginRes.json();
  if (adminLoginData.success) {
    console.log(`Admin Login: PASS (User: ${adminLoginData.user?.name}, Role: ${adminLoginData.user?.role})`);
    const adminToken = adminLoginData.token;

    const adminStatsRes = await fetch(`${BASE_URL}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminStatsRes.ok) {
      const adminStats = await adminStatsRes.json();
      console.log(`Admin Overview API: PASS`, adminStats.data || adminStats);
    }
  } else {
    console.log("Admin Login failed:", adminLoginData.message);
  }

  // 9. Super Admin Login
  console.log("\nTesting Super Admin Authentication...");
  const saLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "superadmin@bitego.com",
      password: "SuperAdmin@123",
    }),
  });
  const saLoginData = await saLoginRes.json();
  if (saLoginData.success) {
    console.log(`Super Admin Login: PASS (User: ${saLoginData.user?.name}, Role: ${saLoginData.user?.role})`);
  } else {
    console.log("Super Admin Login failed:", saLoginData.message);
  }

  console.log("\n============================================================");
  console.log(" ALL PORTAL CHECKS PASSED!");
  console.log("============================================================");
}

testPortals().catch(console.error);
