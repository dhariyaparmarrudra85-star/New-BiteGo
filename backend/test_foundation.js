import dotenv from "dotenv";
dotenv.config();

const BASE_URL = "http://localhost:5000";

async function runTests() {
  console.log("================================================================");
  console.log(" BITEGO FOUNDATION VERIFICATION & REPAIR TEST SUITE");
  console.log("================================================================\n");

  let passes = 0;
  let failures = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passes++;
    } else {
      console.error(`  [FAIL] ${testName} ${details ? "- " + details : ""}`);
      failures++;
    }
  }

  // 1. Health check
  console.log("1. Base Health Check");
  const healthRes = await fetch(`${BASE_URL}/`);
  const health = await healthRes.json();
  assert(health.status === "Healthy", "Backend is healthy and reachable");

  // 2. Authentication across 5 roles
  console.log("\n2. Authentication & JWT Validation for All 5 Roles");
  const logins = {
    customer: { email: "customer@bitego.com", pass: "Customer@123" },
    merchant: { email: "merchant@darkroast.com", pass: "Merchant@123" },
    delivery: { email: "delivery@bitego.com", pass: "Delivery@123" },
    admin: { email: "admin@bitego.com", pass: "Admin@123" },
    superadmin: { email: "superadmin@bitego.com", pass: "SuperAdmin@123" },
  };

  const tokens = {};
  for (const [roleKey, creds] of Object.entries(logins)) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: creds.email, password: creds.pass }),
    });
    const data = await res.json();
    assert(data.success && data.token, `Login for ${roleKey} (${creds.email}) succeeded`);
    tokens[roleKey] = data.token;
  }

  // Register fresh pending merchant to test verification gate
  const pendingEmail = `pending_${Date.now()}@restaurant.com`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Pending Chef",
      email: pendingEmail,
      password: "Merchant@123",
      phone: "+91 99999 88888",
      role: "merchant",
    }),
  });
  const regData = await regRes.json();
  assert(regData.success && regData.user?.verificationStatus === "pending", "New merchant registers with verificationStatus=pending");
  const pendingMerchantToken = regData.token;

  // 3. Security & Role Authorization Gates
  console.log("\n3. Security & Role Authorization (401, 403, Pending)");
  // 3a. Unauthorized without token
  const noTokenRes = await fetch(`${BASE_URL}/api/orders`);
  assert(noTokenRes.status === 401, "Requests without token receive 401 Unauthorized");

  // 3b. Customer forbidden from admin endpoints
  const custForbiddenRes = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${tokens.customer}` },
  });
  assert(custForbiddenRes.status === 403, "Customer access to /api/admin receives 403 Forbidden");

  // 3c. Pending merchant blocked by requireApproved
  const pendingRes = await fetch(`${BASE_URL}/api/merchant/orders`, {
    headers: { Authorization: `Bearer ${pendingMerchantToken}` },
  });
  const pendingData = await pendingRes.json();
  assert(
    pendingRes.status === 403 && pendingData.verificationStatus === "pending",
    "Pending merchant blocked from approved merchant routes with verificationStatus=pending"
  );

  // 4. Coupons & Offers API (Fix for Offers 404)
  console.log("\n4. Coupons & Offers API Verification");
  const couponsRootRes = await fetch(`${BASE_URL}/api/coupons`);
  const couponsRootData = await couponsRootRes.json();
  assert(
    couponsRootRes.ok && Array.isArray(couponsRootData.coupons),
    "GET /api/coupons returns 200 with active coupons (Fixed Offers 404)"
  );

  const couponsActiveRes = await fetch(`${BASE_URL}/api/coupons/active`);
  const couponsActiveData = await couponsActiveRes.json();
  assert(
    couponsActiveRes.ok && couponsActiveData.coupons?.length > 0,
    "GET /api/coupons/active returns active coupons list"
  );

  // Validate coupon
  const validateRes = await fetch(`${BASE_URL}/api/coupons/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "BITEGO50", cartTotal: 500 }),
  });
  const validateData = await validateRes.json();
  assert(
    validateData.success && validateData.coupon?.discountAmount > 0,
    "POST /api/coupons/validate calculates correct discount"
  );

  // 5. Restaurants & Menus
  console.log("\n5. Restaurants & Menus Browsing");
  const restRes = await fetch(`${BASE_URL}/api/restaurants`);
  const restData = await restRes.json();
  assert(restData.success && restData.restaurants?.length > 0, "GET /api/restaurants returns restaurants");
  const sampleRestaurant = restData.restaurants[0];

  const menuRes = await fetch(`${BASE_URL}/api/restaurants/${sampleRestaurant._id}/menu`);
  const menuData = await menuRes.json();
  assert(menuData.success && menuData.menu?.length > 0, "GET /api/restaurants/:id/menu returns category menu");

  // 6. Favorites Flow (Fix for Favorites 400)
  console.log("\n6. Favorites Flow Verification (Fixed 400 bug)");
  // 6a. Toggle favorite ON
  const favOnRes = await fetch(`${BASE_URL}/api/favorites/toggle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.customer}`,
    },
    body: JSON.stringify({ targetType: "restaurant", targetId: sampleRestaurant._id }),
  });
  const favOnData = await favOnRes.json();
  assert(favOnData.success && favOnData.isFavorite === true, "POST /api/favorites/toggle adds restaurant to favorites");

  // 6b. Verify favorite is persisted
  const getFavRes = await fetch(`${BASE_URL}/api/favorites`, {
    headers: { Authorization: `Bearer ${tokens.customer}` },
  });
  const getFavData = await getFavRes.json();
  const isFound = getFavData.favorites?.some(
    (f) => (f.restaurant?._id || f.restaurant)?.toString() === sampleRestaurant._id.toString()
  );
  assert(isFound, "GET /api/favorites contains newly favorited restaurant");

  // 6c. Toggle favorite OFF
  const favOffRes = await fetch(`${BASE_URL}/api/favorites/toggle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.customer}`,
    },
    body: JSON.stringify({ targetType: "restaurant", targetId: sampleRestaurant._id }),
  });
  const favOffData = await favOffRes.json();
  assert(favOffData.success && favOffData.isFavorite === false, "POST /api/favorites/toggle removes restaurant from favorites");

  // 7. Address Management (Both via /api/users/addresses and nested under /api/users)
  console.log("\n7. Address Management CRUD");
  // Create Address
  const newAddrPayload = {
    fullName: "Rudra Parmar",
    phone: "+91 98765 43210",
    houseFlat: "Flat 702, Tower C",
    area: "Bodakdev",
    landmark: "Near Pakwan Cross Road",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380054",
    type: "Home",
    isDefault: true,
  };
  const createAddrRes = await fetch(`${BASE_URL}/api/users/addresses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.customer}`,
    },
    body: JSON.stringify(newAddrPayload),
  });
  const createAddrData = await createAddrRes.json();
  assert(createAddrData.success && createAddrData.address?._id, "POST /api/users/addresses creates delivery address");
  const createdAddressId = createAddrData.address?._id;

  // Get addresses
  const getAddrsRes = await fetch(`${BASE_URL}/api/users/addresses`, {
    headers: { Authorization: `Bearer ${tokens.customer}` },
  });
  const getAddrsData = await getAddrsRes.json();
  assert(getAddrsData.success && getAddrsData.addresses?.length > 0, "GET /api/users/addresses lists saved addresses");

  // Update address
  const updateAddrRes = await fetch(`${BASE_URL}/api/users/addresses/${createdAddressId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.customer}`,
    },
    body: JSON.stringify({ houseFlat: "Penthouse 1201" }),
  });
  const updateAddrData = await updateAddrRes.json();
  assert(updateAddrData.success && updateAddrData.address?.houseFlat === "Penthouse 1201", "PUT /api/users/addresses/:id updates address");

  // 8. Super Admin Real Analytics (Fixed hardcoded 4892 stats)
  console.log("\n8. Super Admin Real Dynamic Analytics (No Hardcoded 4892)");
  const saOverviewRes = await fetch(`${BASE_URL}/api/superadmin/overview`, {
    headers: { Authorization: `Bearer ${tokens.superadmin}` },
  });
  const saOverviewData = await saOverviewRes.json();
  assert(
    saOverviewData.success &&
      typeof saOverviewData.stats?.totalOrders === "number" &&
      typeof saOverviewData.stats?.totalRevenue === "number" &&
      typeof saOverviewData.stats?.completedOrders === "number",
    `GET /api/superadmin/overview returns dynamic database metrics (Orders: ${saOverviewData.stats?.totalOrders}, Rev: ₹${saOverviewData.stats?.totalRevenue})`
  );

  // 9. Customer Order Lifecycle
  console.log("\n9. Customer Order Creation & Cancellation");
  const menuItem = menuData.items?.[0] || menuData.menu?.[0]?.items?.[0];
  assert(menuItem, `Retrieved menu item: ${menuItem?.name} (₹${menuItem?.price})`);

  const orderPayload = {
    restaurantId: sampleRestaurant._id,
    items: [
      {
        menuItemId: menuItem._id,
        name: menuItem.name,
        quantity: 2,
      },
    ],
    addressId: createdAddressId,
    deliveryInstructions: "Leave with security desk",
    couponCode: "BITEGO50",
    paymentMethod: "UPI",
    tipAmount: 30,
  };

  const createOrderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.customer}`,
    },
    body: JSON.stringify(orderPayload),
  });
  const createOrderData = await createOrderRes.json();
  assert(
    createOrderData.success && createOrderData.order?.orderNumber,
    `Order created: ${createOrderData.order?.orderNumber} (OTP: ${createOrderData.order?.orderOtp}, Total: ₹${createOrderData.order?.totalAmount})`
  );
  const orderId = createOrderData.order?._id;

  // Single order tracking query
  const getOrderRes = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${tokens.customer}` },
  });
  const getOrderData = await getOrderRes.json();
  assert(getOrderData.success && getOrderData.order?.orderStatus === "PLACED", "GET /api/orders/:id retrieves order details");

  // Cancel order before preparation
  const cancelRes = await fetch(`${BASE_URL}/api/orders/${orderId}/cancel`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.customer}`,
    },
    body: JSON.stringify({ reason: "Testing customer order cancellation flow" }),
  });
  const cancelData = await cancelRes.json();
  assert(cancelData.success && cancelData.order?.orderStatus === "CANCELLED", "PATCH /api/orders/:id/cancel cancels order successfully");

  // Clean up created address
  await fetch(`${BASE_URL}/api/users/addresses/${createdAddressId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tokens.customer}` },
  });

  console.log("\n================================================================");
  console.log(` SUMMARY: ${passes} PASSED, ${failures} FAILED`);
  console.log("================================================================");

  if (failures > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
