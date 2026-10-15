import assert from "node:assert";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./models/Order.js";

dotenv.config();

const BASE_URL = "http://localhost:5000/api";

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { rawText: text };
  }

  return { status: res.status, ok: res.ok, data };
}

async function runTest() {
  console.log("==================================================================");
  console.log(" BITEGO TEST: READY AT COUNTER -> FLEET DELIVERY RADAR WORKFLOW");
  console.log("==================================================================\n");

  const timestamp = Date.now();
  const state = {};

  // 1. Log in SuperAdmin to set up verified merchant & delivery partner
  const saLogin = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "superadmin@bitego.com", password: "SuperAdmin@123" }),
  });
  assert.strictEqual(saLogin.status, 200, "Super Admin login succeeds");
  state.superadminToken = saLogin.data.token;
  console.log("✓ SuperAdmin authenticated");

  // 2. Register Customer
  const custEmail = `cust_radar_${timestamp}@bitego.com`;
  const regCust = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Rohan Patel",
      email: custEmail,
      password: "Password@123",
      role: "customer",
      phone: "+91 9888811111",
    }),
  });
  assert([200, 201].includes(regCust.status), "Customer registered");
  state.customerToken = regCust.data.token;
  state.customerId = regCust.data.user._id || regCust.data.user.id;
  console.log(`✓ Customer registered (${custEmail})`);

  // 3. Register Merchant
  const merchEmail = `merch_radar_${timestamp}@bitego.com`;
  const regMerch = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Chef Vikram",
      email: merchEmail,
      password: "Password@123",
      role: "merchant",
      phone: "+91 9888822222",
    }),
  });
  assert([200, 201].includes(regMerch.status), "Merchant registered");
  state.merchantToken = regMerch.data.token;
  state.merchantUserId = regMerch.data.user._id || regMerch.data.user.id;

  // Apply Merchant
  const applyMerch = await api("/merchant/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({
      restaurantName: `Saffron Spice Kitchen ${timestamp}`,
      ownerName: "Chef Vikram",
      phone: "+91 9888822222",
      address: "Ground Floor, Sindhu Bhavan Road, Bodakdev",
      category: "North Indian",
      fssaiNumber: `FSSAI-${timestamp.toString().slice(-10)}`,
      gstin: "24ABCDE1234F1Z5",
    }),
  });
  assert.strictEqual(applyMerch.status, 201, "Merchant application submitted");
  state.merchantAppId = applyMerch.data.application._id;

  // Approve Merchant by SuperAdmin
  const approveMerch = await api(`/superadmin/merchants/${state.merchantAppId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(approveMerch.status, 200, "Merchant approved");
  state.restaurantId = approveMerch.data.restaurant?._id || approveMerch.data.application?.restaurantId;

  // If restaurantId not directly returned, query restaurants
  if (!state.restaurantId) {
    const myRest = await api("/merchant/profile", {
      headers: { Authorization: `Bearer ${state.merchantToken}` },
    });
    state.restaurantId = myRest.data.restaurant._id;
  }
  console.log(`✓ Merchant approved & linked to restaurant: ${state.restaurantId}`);

  // Create dish
  const addDish = await api("/merchant/menu", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({
      name: "Paneer Butter Masala Special",
      price: 360,
      category: "Main Course",
      isVeg: true,
      inStock: true,
      isAvailable: true,
      description: "Rich tomato gravy with fresh paneer cubes",
    }),
  });
  assert.strictEqual(addDish.status, 201, "Menu dish created");
  state.dishId = addDish.data.item._id;
  console.log(`✓ Menu dish created: ${addDish.data.item.name} (${state.dishId})`);

  // 4. Register Delivery Partner (Courier Pilot)
  const delivEmail = `deliv_radar_${timestamp}@bitego.com`;
  const regDeliv = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Rider Amit",
      email: delivEmail,
      password: "Password@123",
      role: "delivery",
      phone: "+91 9888833333",
    }),
  });
  assert([200, 201].includes(regDeliv.status), "Delivery partner registered");
  state.deliveryToken = regDeliv.data.token;
  state.deliveryUserId = regDeliv.data.user._id || regDeliv.data.user.id;

  const applyDeliv = await api("/delivery/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
    body: JSON.stringify({
      fullName: "Rider Amit",
      phone: "+91 9888833333",
      dob: "1997-08-15",
      address: "Bodakdev Grid Hub, SG Highway",
      vehicleType: "Bike",
      vehicleNumber: "GJ-01-BK-9999",
      drivingLicenseNumber: `DL-GJ-${timestamp.toString().slice(-6)}`,
    }),
  });
  assert.strictEqual(applyDeliv.status, 201, "Delivery application submitted");
  state.deliveryAppId = applyDeliv.data.application._id;

  const approveDeliv = await api(`/superadmin/delivery/${state.deliveryAppId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(approveDeliv.status, 200, "Delivery partner approved");
  console.log(`✓ Delivery partner approved (${delivEmail})`);

  // Ensure delivery partner is Online
  const dutyRes = await api("/delivery/duty", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
    body: JSON.stringify({ isOnline: true }),
  });
  assert.strictEqual(dutyRes.status, 200, "Delivery partner duty set to ONLINE");
  assert.strictEqual(dutyRes.data.isOnline, true, "Delivery partner isOnline is true");
  assert.strictEqual(dutyRes.data.isAvailable, true, "Delivery partner isAvailable is true");
  console.log("✓ Delivery partner is ONLINE & AVAILABLE");

  // --------------------------------------------------------------------------
  // STEP 1 & 2: Customer places an order & saved in MongoDB
  // --------------------------------------------------------------------------
  console.log("\n--- STEP 1 & 2: Customer places an order ---");
  const createOrder = await api("/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.customerToken}` },
    body: JSON.stringify({
      restaurantId: state.restaurantId,
      items: [
        {
          menuItemId: state.dishId,
          name: "Paneer Butter Masala Special",
          price: 360,
          quantity: 2,
        },
      ],
      deliveryAddress: {
        fullName: "Rohan Patel",
        phone: "+91 9888811111",
        houseFlat: "Flat 502, Orchid Harmony",
        area: "Bodakdev",
        city: "Ahmedabad",
        pincode: "380054",
      },
      paymentMethod: "UPI",
    }),
  });
  assert.strictEqual(createOrder.status, 201, "Order creation succeeded");
  state.orderId = createOrder.data.order._id;
  state.orderNumber = createOrder.data.order.orderNumber;
  console.log(`✓ Order placed: #${state.orderNumber} (ID: ${state.orderId})`);
  assert.strictEqual(createOrder.data.order.orderStatus, "PLACED", "Status is PLACED");

  // Verify MongoDB document
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "BiteGo" });
  const OrderModel = Order;
  const dbOrderPlaced = await OrderModel.findById(state.orderId);
  assert(dbOrderPlaced, "Order exists in MongoDB");
  assert.strictEqual(dbOrderPlaced.orderStatus, "PLACED", "MongoDB status is PLACED");
  console.log(`✓ Step 2 verified: Order saved in MongoDB with status PLACED`);

  // --------------------------------------------------------------------------
  // STEP 3: Restaurant sees the order
  // --------------------------------------------------------------------------
  console.log("\n--- STEP 3: Restaurant sees the order ---");
  const merchOrders = await api("/merchant/orders", {
    headers: { Authorization: `Bearer ${state.merchantToken}` },
  });
  assert.strictEqual(merchOrders.status, 200, "Merchant orders fetched");
  const foundInMerch = merchOrders.data.orders.find((o) => o._id === state.orderId);
  assert(foundInMerch, "Order visible in Restaurant ticket queue");
  console.log(`✓ Step 3 verified: Order visible in Restaurant queue`);

  // --------------------------------------------------------------------------
  // STEP 4: Restaurant accepts the order (CONFIRMED)
  // --------------------------------------------------------------------------
  console.log("\n--- STEP 4: Restaurant accepts the order ---");
  const acceptRes = await api(`/merchant/orders/${state.orderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({ status: "CONFIRMED", note: "Kitchen accepted ticket" }),
  });
  assert.strictEqual(acceptRes.status, 200, "Restaurant accepted order");
  assert.strictEqual(acceptRes.data.order.orderStatus, "CONFIRMED");
  console.log(`✓ Step 4 verified: Order confirmed`);

  // --------------------------------------------------------------------------
  // STEP 5: Restaurant prepares the order (PREPARING)
  // --------------------------------------------------------------------------
  console.log("\n--- STEP 5: Restaurant prepares the order ---");
  const prepRes = await api(`/merchant/orders/${state.orderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({ status: "PREPARING", note: "Chef cooking curry in kitchen" }),
  });
  assert.strictEqual(prepRes.status, 200, "Restaurant moved to PREPARING");
  assert.strictEqual(prepRes.data.order.orderStatus, "PREPARING");
  console.log(`✓ Step 5 verified: Order preparing in kitchen`);

  // --------------------------------------------------------------------------
  // STEP 6 & 7: Restaurant clicks "Ready at Counter" (READY_FOR_PICKUP)
  // --------------------------------------------------------------------------
  console.log("\n--- STEP 6 & 7: Restaurant clicks Ready at Counter ---");
  const readyRes = await api(`/merchant/orders/${state.orderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({
      status: "READY_FOR_PICKUP",
      note: "Kitchen marked order ready at dispatch counter",
    }),
  });
  assert.strictEqual(readyRes.status, 200, "Merchant marked order Ready at Counter");
  assert.strictEqual(readyRes.data.order.orderStatus, "READY_FOR_PICKUP");
  console.log(`✓ Step 6 verified: API returned 200 with status READY_FOR_PICKUP`);

  // Verify MongoDB contains the expected ready status
  const dbOrderReady = await OrderModel.findById(state.orderId);
  assert.strictEqual(dbOrderReady.orderStatus, "READY_FOR_PICKUP", "MongoDB status is READY_FOR_PICKUP");
  console.log(`✓ Step 7 verified: MongoDB contains exact status READY_FOR_PICKUP`);

  // --------------------------------------------------------------------------
  // STEP 8 & 9: Verify Fleet Radar API and Portal return that order
  // --------------------------------------------------------------------------
  console.log("\n--- STEP 8 & 9: Verify Fleet Radar API & Available Pool ---");
  
  // Test 8a: GET /api/delivery/available
  const fleetAvailRes = await api("/delivery/available", {
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
  });
  assert.strictEqual(fleetAvailRes.status, 200, "GET /delivery/available succeeds");
  const matchInAvail = fleetAvailRes.data.orders.find((o) => o._id === state.orderId);
  assert(matchInAvail, "Order appears in /delivery/available list");
  console.log(`✓ Step 8a verified: Order #${state.orderNumber} returned in /delivery/available`);

  // Test 8b: GET /api/delivery/dashboard (used directly by Fleet Dashboard Delivery Radar)
  const fleetDashRes = await api("/delivery/dashboard", {
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
  });
  assert.strictEqual(fleetDashRes.status, 200, "GET /delivery/dashboard succeeds");
  assert(Array.isArray(fleetDashRes.data.availablePool), "availablePool array exists");
  const matchInPool = fleetDashRes.data.availablePool.find((o) => o._id === state.orderId);
  assert(matchInPool, "Order appears in Fleet Radar's availablePool");
  console.log(`✓ Step 8b verified: Order #${state.orderNumber} returned in /delivery/dashboard availablePool`);

  // Verify details in Radar order card
  assert(matchInPool.restaurant?.name, "Restaurant name present");
  assert(matchInPool.deliveryAddress?.houseFlat, "Drop-off house/flat present");
  console.log(`✓ Step 9 verified: Order details present in Fleet Radar:`);
  console.log(`    Order Number: #${matchInPool.orderNumber || state.orderNumber}`);
  console.log(`    Restaurant:   ${matchInPool.restaurant?.name}`);
  console.log(`    Pickup Loc:   ${matchInPool.restaurant?.address}`);
  console.log(`    Drop Address: ${matchInPool.deliveryAddress?.houseFlat}, ${matchInPool.deliveryAddress?.area}`);
  console.log(`    Customer:     ${matchInPool.customer?.name}`);

  // --------------------------------------------------------------------------
  // STEP 10: Accept the delivery job as an eligible delivery agent
  // --------------------------------------------------------------------------
  console.log("\n--- STEP 10: Delivery agent accepts the job ---");
  const acceptJobRes = await api(`/delivery/orders/${state.orderId}/accept`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
  });
  assert.strictEqual(acceptJobRes.status, 200, "Delivery partner accepted mission");
  assert.strictEqual(acceptJobRes.data.order.orderStatus, "ACCEPTED");
  assert.strictEqual(acceptJobRes.data.order.deliveryPartner.toString(), state.deliveryUserId.toString());
  console.log(`✓ Step 10 verified: Delivery job accepted. Status is ACCEPTED, assigned to ${state.deliveryUserId}`);

  // --------------------------------------------------------------------------
  // STEP 11: Verify order becomes assigned and appears in that agent's pickup list
  // --------------------------------------------------------------------------
  console.log("\n--- STEP 11: Verify assigned active mission & radar exclusion ---");
  const fleetDashAfterAccept = await api("/delivery/dashboard", {
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
  });
  assert.strictEqual(fleetDashAfterAccept.status, 200);
  assert(fleetDashAfterAccept.data.activeOrder, "activeOrder exists on agent dashboard");
  assert.strictEqual(fleetDashAfterAccept.data.activeOrder._id, state.orderId, "activeOrder matches test order ID");
  assert.strictEqual(fleetDashAfterAccept.data.activeOrder.orderStatus, "ACCEPTED");
  console.log(`✓ Step 11a verified: Order #${state.orderNumber} is in courier's Active Mission cockpit`);

  // Verify it is NO LONGER in the available pool (unassigned queue)
  const poolCheck = fleetDashAfterAccept.data.availablePool.find((o) => o._id === state.orderId);
  assert(!poolCheck, "Claimed order is removed from available pool");
  console.log(`✓ Step 11b verified: Claimed order is cleanly removed from available radar broadcast queue`);

  await mongoose.disconnect();
  console.log("\n==================================================================");
  console.log(" ALL 11 WORKFLOW STEPS PASSED WITH 100% SUCCESS!");
  console.log("==================================================================\n");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
