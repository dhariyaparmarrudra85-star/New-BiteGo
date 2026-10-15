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

async function runRadarTest() {
  console.log("==================================================================");
  console.log(" BITEGO TEST: INCOMING RADAR DECLINE, ACCEPT, DEDUP & ISOLATION");
  console.log("==================================================================\n");

  const timestamp = Date.now();
  const state = {};

  // 1. Authenticate SuperAdmin
  const saLogin = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "superadmin@bitego.com", password: "SuperAdmin@123" }),
  });
  assert.strictEqual(saLogin.status, 200, "SuperAdmin login succeeds");
  state.saToken = saLogin.data.token;
  console.log("✓ Step 1: SuperAdmin authenticated");

  // 2. Register Customer
  const custEmail = `radar_cust_${timestamp}@bitego.com`;
  const regCust = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Diya Shah",
      email: custEmail,
      password: "Password@123",
      role: "customer",
      phone: "+91 9666611111",
    }),
  });
  state.custToken = regCust.data.token;
  console.log(`✓ Step 2: Customer registered: ${custEmail}`);

  // 3. Register & Approve Merchant
  const merchEmail = `radar_merch_${timestamp}@bitego.com`;
  const regMerch = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Chef Radheshyam",
      email: merchEmail,
      password: "Password@123",
      role: "merchant",
      phone: "+91 9666622222",
    }),
  });
  const applyMerch = await api("/merchant/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${regMerch.data.token}` },
    body: JSON.stringify({
      restaurantName: `Radar Kitchen Hub ${timestamp}`,
      ownerName: "Chef Radheshyam",
      phone: "+91 9666622222",
      address: "Sindhu Bhavan Road, Bodakdev",
      category: "Gujarati Thali",
      fssaiNumber: `FSSAI-${timestamp.toString().slice(-10)}`,
      gstin: "24ABCDE3333F1Z3",
    }),
  });
  const appMerch = await api(`/superadmin/merchants/${applyMerch.data.application._id}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.saToken}` },
  });
  state.restId = appMerch.data.restaurant?._id || appMerch.data.application?.restaurantId;

  const addDish1 = await api("/merchant/menu", {
    method: "POST",
    headers: { Authorization: `Bearer ${regMerch.data.token}` },
    body: JSON.stringify({
      name: "Kathiyawadi Sev Tameta Thali",
      price: 250,
      category: "Main Course",
      isVeg: true,
      inStock: true,
      isAvailable: true,
      description: "Traditional spicy curry with bajra rotla",
    }),
  });
  state.dish1Id = addDish1.data.item._id;

  const addDish2 = await api("/merchant/menu", {
    method: "POST",
    headers: { Authorization: `Bearer ${regMerch.data.token}` },
    body: JSON.stringify({
      name: "Surati Undhiyu Feast",
      price: 320,
      category: "Main Course",
      isVeg: true,
      inStock: true,
      isAvailable: true,
      description: "Mixed winter vegetable slow cooked in clay pot",
    }),
  });
  state.dish2Id = addDish2.data.item._id;
  console.log("✓ Step 3: Merchant and Menu dishes ready");

  // 4. Register & Approve Pilot 1 (Arjun)
  const p1Email = `pilot_arjun_${timestamp}@bitego.com`;
  const regP1 = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Pilot Arjun",
      email: p1Email,
      password: "Password@123",
      role: "delivery",
      phone: "+91 9666633333",
    }),
  });
  const applyP1 = await api("/delivery/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${regP1.data.token}` },
    body: JSON.stringify({
      fullName: "Pilot Arjun",
      phone: "+91 9666633333",
      dob: "1995-02-14",
      address: "Bodakdev Grid Hub, SG Highway",
      vehicleType: "Bike",
      vehicleNumber: "GJ-01-AR-1111",
      drivingLicenseNumber: `DL-GJ-${timestamp.toString().slice(-6)}`,
    }),
  });
  await api(`/superadmin/delivery/${applyP1.data.application._id}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.saToken}` },
  });
  state.p1Token = regP1.data.token;
  await api("/delivery/duty", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.p1Token}` },
    body: JSON.stringify({ isOnline: true }),
  });
  console.log(`✓ Step 4: Pilot 1 (Arjun) approved & Online: ${p1Email}`);

  // 5. Register & Approve Pilot 2 (Bharat)
  const p2Email = `pilot_bharat_${timestamp}@bitego.com`;
  const regP2 = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Pilot Bharat",
      email: p2Email,
      password: "Password@123",
      role: "delivery",
      phone: "+91 9666644444",
    }),
  });
  const applyP2 = await api("/delivery/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${regP2.data.token}` },
    body: JSON.stringify({
      fullName: "Pilot Bharat",
      phone: "+91 9666644444",
      dob: "1994-07-19",
      address: "Sindhu Bhavan Hub",
      vehicleType: "Scooter",
      vehicleNumber: "GJ-01-BH-2222",
      drivingLicenseNumber: `DL-GJ-${(timestamp + 1).toString().slice(-6)}`,
    }),
  });
  await api(`/superadmin/delivery/${applyP2.data.application._id}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.saToken}` },
  });
  state.p2Token = regP2.data.token;
  await api("/delivery/duty", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.p2Token}` },
    body: JSON.stringify({ isOnline: true }),
  });
  console.log(`✓ Step 5: Pilot 2 (Bharat) approved & Online: ${p2Email}`);

  // 6. Customer places Order A and Order B
  const orderARes = await api("/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.custToken}` },
    body: JSON.stringify({
      restaurantId: state.restId,
      items: [{ menuItemId: state.dish1Id, quantity: 1, price: 250, name: "Kathiyawadi Sev Tameta Thali" }],
      deliveryAddress: {
        street: "A-101 Titanium City",
        city: "Ahmedabad",
        state: "Gujarat",
        zipCode: "380015",
        coordinates: [72.5074, 23.0125],
      },
      paymentMethod: "COD",
    }),
  });
  state.orderAId = orderARes.data.order._id;
  const orderA_Otp = orderARes.data.order.orderOtp;

  const orderBRes = await api("/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.custToken}` },
    body: JSON.stringify({
      restaurantId: state.restId,
      items: [{ menuItemId: state.dish2Id, quantity: 1, price: 320, name: "Surati Undhiyu Feast" }],
      deliveryAddress: {
        street: "B-202 Titanium Square",
        city: "Ahmedabad",
        state: "Gujarat",
        zipCode: "380054",
        coordinates: [72.5074, 23.0125],
      },
      paymentMethod: "COD",
    }),
  });
  state.orderBId = orderBRes.data.order._id;

  // Merchant marks both READY_FOR_PICKUP
  await api(`/merchant/orders/${state.orderAId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${regMerch.data.token}` },
    body: JSON.stringify({ status: "READY_FOR_PICKUP" }),
  });
  await api(`/merchant/orders/${state.orderBId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${regMerch.data.token}` },
    body: JSON.stringify({ status: "READY_FOR_PICKUP" }),
  });
  console.log(`✓ Step 6: Customer placed Order A (${state.orderAId}) & Order B (${state.orderBId}), merchant marked READY_FOR_PICKUP`);

  // 7. Check Radar for Pilot 1 and Pilot 2
  const p1Dash1 = await api("/delivery/dashboard", { headers: { Authorization: `Bearer ${state.p1Token}` } });
  assert.strictEqual(p1Dash1.status, 200);
  const p1Pool1 = p1Dash1.data.availablePool || [];
  assert(p1Pool1.some(o => o._id === state.orderAId), "Pilot 1 sees Order A on radar");
  assert(p1Pool1.some(o => o._id === state.orderBId), "Pilot 1 sees Order B on radar");

  // Verify deduplication: no duplicate order IDs in availablePool
  const p1Ids = p1Pool1.map(o => o._id);
  const uniqueP1Ids = new Set(p1Ids);
  assert.strictEqual(p1Ids.length, uniqueP1Ids.size, "Available orders must not contain duplicate items");

  const p2Dash1 = await api("/delivery/dashboard", { headers: { Authorization: `Bearer ${state.p2Token}` } });
  assert.strictEqual(p2Dash1.status, 200);
  const p2Pool1 = p2Dash1.data.availablePool || [];
  assert(p2Pool1.some(o => o._id === state.orderAId), "Pilot 2 sees Order A on radar");
  assert(p2Pool1.some(o => o._id === state.orderBId), "Pilot 2 sees Order B on radar");
  console.log("✓ Step 7: Both pilots see incoming orders on radar without duplicates");

  // 8. Pilot 1 DECLINES Order A
  const declineRes = await api(`/delivery/orders/${state.orderAId}/decline`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.p1Token}` },
  });
  assert.strictEqual(declineRes.status, 200, "Decline order succeeds");
  console.log("✓ Step 8: Pilot 1 declined Order A");

  // 9. Verify Order A is removed from Pilot 1's radar
  const p1Dash2 = await api("/delivery/dashboard", { headers: { Authorization: `Bearer ${state.p1Token}` } });
  const p1Pool2 = p1Dash2.data.availablePool || [];
  assert(!p1Pool2.some(o => o._id === state.orderAId), "Order A must be dismissed/removed from Pilot 1's radar");
  assert(p1Pool2.some(o => o._id === state.orderBId), "Order B remains visible on Pilot 1's radar");
  console.log("✓ Step 9: Order A disappeared from Pilot 1's radar");

  // 10. Verify Order A is STILL IN MONGODB and NOT CANCELLED
  const orderAInDb = await Order.findById(state.orderAId);
  assert(orderAInDb, "Order A remains in MongoDB");
  assert.strictEqual(orderAInDb.orderStatus, "READY_FOR_PICKUP", "Order A status is NOT cancelled");
  assert(orderAInDb.declinedBy.length > 0, "declinedBy tracks Pilot 1");
  console.log("✓ Step 10: Order A remains intact in MongoDB with status READY_FOR_PICKUP");

  // 11. Verify Pilot 2 STILL SEES Order A (isolation check)
  const p2Dash2 = await api("/delivery/dashboard", { headers: { Authorization: `Bearer ${state.p2Token}` } });
  const p2Pool2 = p2Dash2.data.availablePool || [];
  assert(p2Pool2.some(o => o._id === state.orderAId), "Pilot 2 STILL sees Order A on their radar!");
  assert(p2Pool2.some(o => o._id === state.orderBId), "Pilot 2 STILL sees Order B on their radar!");
  console.log("✓ Step 11: Security Isolation verified - Pilot 2 can still receive and see Order A");

  // 12. Pilot 2 ACCEPTS Order A
  const acceptResA = await api(`/delivery/orders/${state.orderAId}/accept`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.p2Token}` },
  });
  assert.strictEqual(acceptResA.status, 200, "Pilot 2 accepted Order A");

  // Verify Pilot 2's dashboard: Order A moved to Active Delivery & removed from radar
  const p2Dash3 = await api("/delivery/dashboard", { headers: { Authorization: `Bearer ${state.p2Token}` } });
  assert(p2Dash3.data.activeOrder, "Pilot 2 has activeOrder");
  assert.strictEqual(p2Dash3.data.activeOrder._id, state.orderAId, "Pilot 2's activeOrder is Order A");
  const p2Pool3 = p2Dash3.data.availablePool || [];
  assert(!p2Pool3.some(o => o._id === state.orderAId), "Accepted Order A removed from incoming radar");
  console.log("✓ Step 12: Order A moved to Pilot 2's Active Delivery & removed from radar");

  // 13. Pilot 1 ACCEPTS Order B
  const acceptResB = await api(`/delivery/orders/${state.orderBId}/accept`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.p1Token}` },
  });
  assert.strictEqual(acceptResB.status, 200, "Pilot 1 accepted Order B");

  const p1Dash3 = await api("/delivery/dashboard", { headers: { Authorization: `Bearer ${state.p1Token}` } });
  assert.strictEqual(p1Dash3.data.activeOrder?._id, state.orderBId, "Pilot 1's activeOrder is Order B");
  console.log("✓ Step 13: Order B moved to Pilot 1's Active Delivery");

  // 14. Duplicate Acceptance Prevention Check
  const dupAccept = await api(`/delivery/orders/${state.orderAId}/accept`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.p1Token}` },
  });
  assert([400, 403].includes(dupAccept.status), "Pilot 1 cannot accept Order A already accepted by Pilot 2");
  console.log("✓ Step 14: Duplicate acceptance prevented by backend atomic lock");

  // 15. Verify Customer Tracking Still Works
  const custTrackA = await api(`/orders/${state.orderAId}`, {
    headers: { Authorization: `Bearer ${state.custToken}` },
  });
  assert.strictEqual(custTrackA.status, 200);
  assert(["ACCEPTED", "ASSIGNED"].includes(custTrackA.data.order.orderStatus));
  assert.strictEqual(custTrackA.data.order.deliveryPartner.name, "Pilot Bharat");
  console.log("✓ Step 15: Customer tracking shows Pilot Bharat assigned to Order A");

  // 16. Refresh Simulation (Querying again persists correctly)
  const p1Refresh = await api("/delivery/dashboard", { headers: { Authorization: `Bearer ${state.p1Token}` } });
  assert.strictEqual(p1Refresh.data.activeOrder?._id, state.orderBId);
  const p2Refresh = await api("/delivery/dashboard", { headers: { Authorization: `Bearer ${state.p2Token}` } });
  assert.strictEqual(p2Refresh.data.activeOrder?._id, state.orderAId);
  console.log("✓ Step 16: Full refresh simulation confirms state persisted in MongoDB");

  // 17. Complete Order A with OTP
  await api(`/delivery/orders/${state.orderAId}/pickup`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.p2Token}` },
  });
  await api(`/delivery/orders/${state.orderAId}/out-for-delivery`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.p2Token}` },
  });
  const completeA = await api(`/delivery/orders/${state.orderAId}/verify-otp`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.p2Token}` },
    body: JSON.stringify({ otp: orderA_Otp }),
  });
  assert.strictEqual(completeA.status, 200, "Order A delivered successfully");
  assert.strictEqual(completeA.data.order.orderStatus, "DELIVERED");
  console.log("✓ Step 17: Order A delivered and completed with OTP");

  console.log("\n==================================================================");
  console.log(" ALL 17 RADAR WORKFLOW CHECKS PASSED PERFECTLY! ");
  console.log("==================================================================\n");
}

await mongoose.connect(process.env.MONGODB_URI);
try {
  await runRadarTest();
} finally {
  await mongoose.disconnect();
}
