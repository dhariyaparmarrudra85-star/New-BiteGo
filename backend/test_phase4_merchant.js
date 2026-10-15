/**
 * BiteGo Phase 4: Complete Merchant Functionality Comprehensive Test Suite
 * Tests:
 * 1. Merchant Application Submission (/become-merchant)
 * 2. Unapproved Merchant Access Gate (Pending status blocks operational access)
 * 3. Admin Application Review, Document Inspection & Rejection Flow
 * 4. Admin Approval & Automatic Restaurant Initialization
 * 5. Approved Merchant Restaurant Profile Management & Store Status Toggle
 * 6. Menu Management: Add, Edit, Delete, Toggle Availability, Veg/Non-Veg
 * 7. Live Customer Order Flow targeting Merchant's Restaurant
 * 8. Kitchen Pipeline Lifecycle (PLACED -> CONFIRMED -> PREPARING -> READY_FOR_PICKUP)
 * 9. Delivery Restriction Enforcement (Merchant CANNOT mark DELIVERED)
 * 10. Multi-Merchant Security & Data Isolation (Merchant A vs Merchant B)
 * 11. Real MongoDB Dashboard Telemetry (Today's orders, revenue, top dishes)
 */

import assert from "node:assert";

const BASE_URL = "http://localhost:5000/api";

const state = {
  adminToken: null,
  customerToken: null,
  merchantAToken: null,
  merchantAUser: null,
  merchantARestaurant: null,
  merchantAAppId: null,
  merchantADishId: null,
  merchantBToken: null,
  merchantBUser: null,
  merchantBRestaurant: null,
  merchantBAppId: null,
  orderAId: null,
  orderANumber: null,
};

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { "Content-Type": "application/json", ...options.headers };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log("================================================================");
  console.log(" BITEGO PHASE 4: COMPLETE MERCHANT FUNCTIONALITY TEST SUITE");
  console.log("================================================================\n");

  const runTest = async (name, fn) => {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         ${err.message}`);
      process.exit(1);
    }
  };

  // --------------------------------------------------------------------------
  console.log("1. Base Admin & Customer Setup");
  // --------------------------------------------------------------------------
  await runTest("Admin Login (admin@bitego.com)", async () => {
    const res = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@bitego.com", password: "Admin@123" }),
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.token);
    state.adminToken = res.data.token;
  });

  await runTest("Customer Login (customer@bitego.com)", async () => {
    const res = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "customer@bitego.com", password: "Customer@123" }),
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.token);
    state.customerToken = res.data.token;
  });

  // --------------------------------------------------------------------------
  console.log("\n2. Merchant Onboarding & Application Submission (/become-merchant)");
  // --------------------------------------------------------------------------
  const ts = Date.now();
  const merchAEmail = `chef_${ts}@artisanbakery.com`;

  await runTest("Register User as Merchant", async () => {
    const regRes = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Chef Aarav Singhania",
        email: merchAEmail,
        password: "Password123!",
        phone: "+91 98980 11223",
        role: "merchant",
      }),
    });
    assert.strictEqual(regRes.status, 201);
    state.merchantAToken = regRes.data.token;
    state.merchantAUser = regRes.data.user;
    assert.strictEqual(state.merchantAUser.role, "merchant");
    assert.strictEqual(state.merchantAUser.verificationStatus, "pending");
  });

  await runTest("Submit Complete Merchant Onboarding Application", async () => {
    const appRes = await api("/merchant/apply", {
      method: "POST",
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
      body: JSON.stringify({
        restaurantName: `Aarav Artisan Boulangerie ${ts.toString().slice(-4)}`,
        ownerName: "Chef Aarav Singhania",
        phone: "+91 98980 11223",
        address: "Shop 102, SBR One, Sindhu Bhavan Road, Bodakdev",
        hub: "Bodakdev Hub",
        category: "Artisanal Breads & French Pastries",
        description: "Handcrafted sourdough loaves, butter croissants, and gourmet tarts.",
        photo: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
        fssaiNumber: "10823004928192",
        gstin: "24AABCA1234D1Z5",
        requestedCommission: 18.0,
        documents: [
          {
            name: "FSSAI License Document",
            url: "https://storage.bitego.com/docs/fssai-10823004928192.pdf",
            documentType: "fssai",
          },
          {
            name: "GST Certificate",
            url: "https://storage.bitego.com/docs/gst-certificate.pdf",
            documentType: "gst",
          },
        ],
      }),
    });
    assert.strictEqual(appRes.status, 201);
    assert.ok(appRes.data.application);
    assert.strictEqual(appRes.data.application.status, "pending");
    state.merchantAAppId = appRes.data.application._id;
  });

  await runTest("Verify Pending Merchant Cannot Access Operational Dashboard", async () => {
    const dashRes = await api("/merchant/dashboard", {
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
    });
    assert.strictEqual(dashRes.status, 403);
    assert.strictEqual(dashRes.data.verificationStatus, "pending");
  });

  // --------------------------------------------------------------------------
  console.log("\n3. Admin Application Review & Rejection Workflow");
  // --------------------------------------------------------------------------
  const rejectMerchEmail = `reject_${ts}@baddata.com`;
  let rejectAppId = null;

  await runTest("Submit Invalid/Incomplete Merchant Application for Rejection", async () => {
    const regRes = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Questionable Kitchen",
        email: rejectMerchEmail,
        password: "Password123!",
        phone: "+91 91111 22222",
        role: "merchant",
      }),
    });
    const rejToken = regRes.data.token;

    const appRes = await api("/merchant/apply", {
      method: "POST",
      headers: { Authorization: `Bearer ${rejToken}` },
      body: JSON.stringify({
        restaurantName: "Questionable Kitchen",
        ownerName: "Unverified Person",
        phone: "+91 91111 22222",
        address: "Nowhere Road",
        category: "Fast Food",
        fssaiNumber: "00000000000000",
      }),
    });
    assert.strictEqual(appRes.status, 201);
    rejectAppId = appRes.data.application._id;
  });

  await runTest("Admin Views Applications & Documents", async () => {
    const res = await api("/admin/merchant-applications", {
      headers: { Authorization: `Bearer ${state.adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.applications));
    const foundA = res.data.applications.find((a) => a._id === state.merchantAAppId);
    assert.ok(foundA, "Merchant A application listed in admin queue");
    assert.ok(foundA.documents.length >= 2, "Documents present in application");
  });

  await runTest("Admin Rejects Invalid Application with Reason", async () => {
    const rejRes = await api(`/admin/merchants/${rejectAppId}/reject`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.adminToken}` },
      body: JSON.stringify({
        reason: "Invalid FSSAI certificate number and unverified premise address.",
      }),
    });
    assert.strictEqual(rejRes.status, 200);
    assert.strictEqual(rejRes.data.application.status, "rejected");
  });

  // --------------------------------------------------------------------------
  console.log("\n4. Admin Approval & Restaurant Initialization");
  // --------------------------------------------------------------------------
  await runTest("Admin Approves Merchant A Application", async () => {
    const approveRes = await api(`/admin/merchants/${state.merchantAAppId}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.adminToken}` },
    });
    assert.strictEqual(approveRes.status, 200);
    assert.strictEqual(approveRes.data.application.status, "approved");
    assert.ok(approveRes.data.restaurant, "Restaurant auto-created on approval");
    state.merchantARestaurant = approveRes.data.restaurant;
  });

  // --------------------------------------------------------------------------
  console.log("\n5. Approved Merchant Restaurant Management");
  // --------------------------------------------------------------------------
  await runTest("Approved Merchant Fetches Own Restaurant Profile", async () => {
    const restRes = await api("/merchant/restaurant", {
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
    });
    assert.strictEqual(restRes.status, 200);
    assert.strictEqual(restRes.data.restaurant._id, state.merchantARestaurant._id);
  });

  await runTest("Merchant Updates Restaurant Profile & Details", async () => {
    const updateRes = await api("/merchant/restaurant", {
      method: "PUT",
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
      body: JSON.stringify({
        name: `Aarav Artisan Boulangerie & Cafe`,
        description: "Finest organic sourdough, flaky Viennoiseries, and specialty espresso.",
        priceForTwo: "₹500 for two",
        deliveryTime: "20-25 mins",
        isPureVeg: false,
      }),
    });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.data.restaurant.priceForTwo, "₹500 for two");
  });

  await runTest("Merchant Toggles Restaurant Open/Closed Status", async () => {
    const pauseRes = await api("/merchant/restaurant/status", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
      body: JSON.stringify({ isOpen: false }),
    });
    assert.strictEqual(pauseRes.status, 200);
    assert.strictEqual(pauseRes.data.isOpen, false);

    // Reopen store
    const openRes = await api("/merchant/restaurant/status", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
      body: JSON.stringify({ isOpen: true }),
    });
    assert.strictEqual(openRes.status, 200);
    assert.strictEqual(openRes.data.isOpen, true);
  });

  // --------------------------------------------------------------------------
  console.log("\n6. Menu Catalog Management (CRUD, Availability & Dietary)");
  // --------------------------------------------------------------------------
  await runTest("Merchant Adds Vegetarian Dish", async () => {
    const dishRes = await api("/merchant/menu", {
      method: "POST",
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
      body: JSON.stringify({
        name: "Wild Truffle Sourdough Toast",
        category: "Artisanal Breads",
        price: 380,
        isVeg: true,
        description: "Toasted country loaf, wild forest mushrooms, thyme butter glaze",
        image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
        inStock: true,
      }),
    });
    assert.strictEqual(dishRes.status, 201);
    assert.ok(dishRes.data.item);
    assert.strictEqual(dishRes.data.item.price, 380);
    assert.strictEqual(dishRes.data.item.isVeg, true);
    state.merchantADishId = dishRes.data.item._id;
  });

  await runTest("Merchant Adds Non-Vegetarian Dish", async () => {
    const dishRes = await api("/merchant/menu", {
      method: "POST",
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
      body: JSON.stringify({
        name: "Smoked Turkey & Brie Croissant",
        category: "Sandwiches",
        price: 440,
        isVeg: false,
        description: "Butter croissant, maple-smoked turkey breast, French brie, honey mustard",
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
        inStock: true,
      }),
    });
    assert.strictEqual(dishRes.status, 201);
    assert.strictEqual(dishRes.data.item.isVeg, false);
  });

  await runTest("Merchant Updates Dish Price and Description", async () => {
    const editRes = await api(`/merchant/menu/${state.merchantADishId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
      body: JSON.stringify({
        price: 410,
        description: "Toasted country sourdough loaf, wild forest mushrooms, garlic truffle butter glaze",
      }),
    });
    assert.strictEqual(editRes.status, 200);
    assert.strictEqual(editRes.data.item.price, 410);
  });

  await runTest("Merchant Toggles Dish Availability (Out of Stock / In Stock)", async () => {
    const toggleRes = await api(`/merchant/menu/${state.merchantADishId}/availability`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
      body: JSON.stringify({ inStock: false }),
    });
    assert.strictEqual(toggleRes.status, 200);
    assert.strictEqual(toggleRes.data.item.inStock, false);

    // Turn back in stock
    const restockRes = await api(`/merchant/menu/${state.merchantADishId}/availability`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
      body: JSON.stringify({ inStock: true }),
    });
    assert.strictEqual(restockRes.status, 200);
    assert.strictEqual(restockRes.data.item.inStock, true);
  });

  await runTest("Merchant Adds Temporary Dish & Deletes It", async () => {
    const tempRes = await api("/merchant/menu", {
      method: "POST",
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
      body: JSON.stringify({
        name: "Experimental Strawberry Danish",
        category: "Pastries",
        price: 260,
        isVeg: true,
      }),
    });
    assert.strictEqual(tempRes.status, 201);
    const tempId = tempRes.data.item._id;

    const delRes = await api(`/merchant/menu/${tempId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
    });
    assert.strictEqual(delRes.status, 200);
  });

  // --------------------------------------------------------------------------
  console.log("\n7. Customer Order Placement & Kitchen Lifecycle Progression");
  // --------------------------------------------------------------------------
  await runTest("Customer Places Order for Merchant A's Restaurant", async () => {
    const orderRes = await api("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${state.customerToken}` },
      body: JSON.stringify({
        restaurantId: state.merchantARestaurant._id,
        items: [
          {
            menuItemId: state.merchantADishId,
            quantity: 2,
          },
        ],
        paymentMethod: "UPI",
        deliveryInstructions: "Leave parcel with reception lobby desk",
      }),
    });
    assert.strictEqual(orderRes.status, 201);
    assert.ok(orderRes.data.order);
    state.orderAId = orderRes.data.order._id;
    state.orderANumber = orderRes.data.order.orderNumber;
    assert.strictEqual(orderRes.data.order.orderStatus, "PLACED");
  });

  await runTest("Merchant Views Incoming Orders", async () => {
    const ordersRes = await api("/merchant/orders", {
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
    });
    assert.strictEqual(ordersRes.status, 200);
    const found = ordersRes.data.orders.find((o) => o._id === state.orderAId);
    assert.ok(found, "Customer order visible in merchant queue");
    assert.strictEqual(found.orderStatus, "PLACED");
  });

  await runTest("Merchant Advances: PLACED -> CONFIRMED", async () => {
    const res = await api(`/merchant/orders/${state.orderAId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
      body: JSON.stringify({ status: "CONFIRMED", note: "Kitchen verified ticket" }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.order.orderStatus, "CONFIRMED");
  });

  await runTest("Merchant Advances: CONFIRMED -> PREPARING", async () => {
    const res = await api(`/merchant/orders/${state.orderAId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
      body: JSON.stringify({ status: "PREPARING", note: "Sourdough toast baking in stone hearth" }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.order.orderStatus, "PREPARING");
  });

  await runTest("Merchant Advances: PREPARING -> READY_FOR_PICKUP", async () => {
    const res = await api(`/merchant/orders/${state.orderAId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
      body: JSON.stringify({ status: "READY_FOR_PICKUP", note: "Boxed and at dispatch counter" }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.order.orderStatus, "READY_FOR_PICKUP");
  });

  await runTest("Security Enforcement: Merchant CANNOT Mark Order as DELIVERED", async () => {
    const res = await api(`/merchant/orders/${state.orderAId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
      body: JSON.stringify({ status: "DELIVERED" }),
    });
    assert.strictEqual(res.status, 403, "Merchant forbidden from marking order DELIVERED");
  });

  await runTest("Security Enforcement: Merchant CANNOT Mark Order as OUT_FOR_DELIVERY", async () => {
    const res = await api(`/merchant/orders/${state.orderAId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
      body: JSON.stringify({ status: "OUT_FOR_DELIVERY" }),
    });
    assert.strictEqual(res.status, 403, "Merchant forbidden from setting OUT_FOR_DELIVERY");
  });

  // --------------------------------------------------------------------------
  console.log("\n8. Multi-Merchant Security & Complete Data Isolation");
  // --------------------------------------------------------------------------
  await runTest("Login Existing Approved Merchant B (The Dark Roast Pizzeria)", async () => {
    const res = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "merchant@darkroast.com", password: "Merchant@123" }),
    });
    assert.strictEqual(res.status, 200);
    state.merchantBToken = res.data.token;
  });

  await runTest("Merchant B Orders List Does NOT Contain Merchant A's Orders", async () => {
    const res = await api("/merchant/orders", {
      headers: { Authorization: `Bearer ${state.merchantBToken}` },
    });
    assert.strictEqual(res.status, 200);
    const leak = res.data.orders.find((o) => o._id === state.orderAId);
    assert.strictEqual(leak, undefined, "Merchant A order is invisible to Merchant B");
  });

  await runTest("Merchant B CANNOT Update Merchant A's Order (403 Forbidden)", async () => {
    const res = await api(`/merchant/orders/${state.orderAId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.merchantBToken}` },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    assert.strictEqual(res.status, 403);
  });

  await runTest("Merchant B CANNOT Modify Merchant A's Menu Item (403 Forbidden)", async () => {
    const res = await api(`/merchant/menu/${state.merchantADishId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${state.merchantBToken}` },
      body: JSON.stringify({ price: 10 }),
    });
    assert.strictEqual(res.status, 403);
  });

  await runTest("Merchant B CANNOT Delete Merchant A's Menu Item (403 Forbidden)", async () => {
    const res = await api(`/merchant/menu/${state.merchantADishId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${state.merchantBToken}` },
    });
    assert.strictEqual(res.status, 403);
  });

  // --------------------------------------------------------------------------
  console.log("\n9. Real MongoDB Dashboard Telemetry & Metrics");
  // --------------------------------------------------------------------------
  await runTest("Merchant A Dashboard Telemetry Returns Live Metrics", async () => {
    const res = await api("/merchant/dashboard", {
      headers: { Authorization: `Bearer ${state.merchantAToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.metrics);
    assert.ok(res.data.metrics.todayOrders >= 1, "Today's orders counted from MongoDB");
    assert.ok(res.data.metrics.activeQueue >= 1, "Active tickets calculated from MongoDB");
    assert.ok(Array.isArray(res.data.topDishes), "Top selling dishes aggregated");
    assert.ok(res.data.recentOrders.length >= 1, "Recent tickets list populated");
    assert.strictEqual(res.data.restaurant.name, "Aarav Artisan Boulangerie & Cafe");
  });

  console.log("\n================================================================");
  console.log(" PHASE 4 VERIFICATION COMPLETE: ALL MERCHANT FEATURES PASSED");
  console.log("================================================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
