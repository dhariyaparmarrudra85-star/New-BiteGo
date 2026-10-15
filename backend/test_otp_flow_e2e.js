import assert from "node:assert";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
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

async function runOtpFlowTest() {
  console.log("==================================================================");
  console.log(" BITEGO TEST: SECURE DELIVERY OTP FLOW (CUSTOMER <-> FLEET)");
  console.log("==================================================================\n");

  const timestamp = Date.now();
  const state = {};

  // 1. Authenticate SuperAdmin to set up merchant & driver
  const saLogin = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "superadmin@bitego.com", password: "SuperAdmin@123" }),
  });
  assert.strictEqual(saLogin.status, 200, "SuperAdmin logged in");
  state.saToken = saLogin.data.token;
  console.log("✓ Step 1: SuperAdmin authenticated");

  // 2. Register Customer
  const custEmail = `otp_cust_${timestamp}@bitego.com`;
  const regCust = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Sneha Kapadia",
      email: custEmail,
      password: "Password@123",
      role: "customer",
      phone: "+91 9777711111",
    }),
  });
  assert([200, 201].includes(regCust.status), "Customer registered");
  state.custToken = regCust.data.token;
  console.log(`✓ Step 2: Customer registered: ${custEmail}`);

  // 3. Register & Approve Merchant
  const merchEmail = `otp_merch_${timestamp}@bitego.com`;
  const regMerch = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Chef Kunal",
      email: merchEmail,
      password: "Password@123",
      role: "merchant",
      phone: "+91 9777722222",
    }),
  });
  const applyMerch = await api("/merchant/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${regMerch.data.token}` },
    body: JSON.stringify({
      restaurantName: `OTP Tandoor House ${timestamp}`,
      ownerName: "Chef Kunal",
      phone: "+91 9777722222",
      address: "Sindhu Bhavan Road, Bodakdev",
      category: "North Indian",
      fssaiNumber: `FSSAI-${timestamp.toString().slice(-10)}`,
      gstin: "24ABCDE5555F1Z2",
    }),
  });
  const appMerch = await api(`/superadmin/merchants/${applyMerch.data.application._id}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.saToken}` },
  });
  state.restId = appMerch.data.restaurant?._id || appMerch.data.application?.restaurantId;

  const addDish = await api("/merchant/menu", {
    method: "POST",
    headers: { Authorization: `Bearer ${regMerch.data.token}` },
    body: JSON.stringify({
      name: "Tandoori Soya Chaap",
      price: 290,
      category: "Starters",
      isVeg: true,
      inStock: true,
      isAvailable: true,
      description: "Charcoal grilled marinated chaap",
    }),
  });
  state.dishId = addDish.data.item._id;
  console.log(`✓ Step 3: Merchant and Menu ready: ${state.dishId}`);

  // 4. Register & Approve Assigned Delivery Partner
  const delivEmail = `otp_pilot_${timestamp}@bitego.com`;
  const regDeliv = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Pilot Pradeep",
      email: delivEmail,
      password: "Password@123",
      role: "delivery",
      phone: "+91 9777733333",
    }),
  });
  const applyDeliv = await api("/delivery/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${regDeliv.data.token}` },
    body: JSON.stringify({
      fullName: "Pilot Pradeep",
      phone: "+91 9777733333",
      dob: "1996-03-22",
      address: "Bodakdev Grid Hub, SG Highway",
      vehicleType: "Scooter",
      vehicleNumber: "GJ-01-BK-5555",
      drivingLicenseNumber: `DL-GJ-${timestamp.toString().slice(-6)}`,
    }),
  });
  await api(`/superadmin/delivery/${applyDeliv.data.application._id}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.saToken}` },
  });
  state.delivToken = regDeliv.data.token;

  await api("/delivery/duty", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.delivToken}` },
    body: JSON.stringify({ isOnline: true }),
  });
  console.log(`✓ Step 4: Assigned Delivery Partner registered & online: ${delivEmail}`);

  // Also register an UNASSIGNED delivery partner to test security isolation
  const intruderEmail = `otp_intruder_${timestamp}@bitego.com`;
  const regIntruder = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Pilot Intruder",
      email: intruderEmail,
      password: "Password@123",
      role: "delivery",
      phone: "+91 9777744444",
    }),
  });
  const applyIntruder = await api("/delivery/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${regIntruder.data.token}` },
    body: JSON.stringify({
      fullName: "Pilot Intruder",
      phone: "+91 9777744444",
      dob: "1995-01-01",
      address: "Hub Intruder",
      vehicleType: "Scooter",
      vehicleNumber: "GJ-01-BK-4444",
      drivingLicenseNumber: `DL-GJ-${(timestamp + 1).toString().slice(-6)}`,
    }),
  });
  await api(`/superadmin/delivery/${applyIntruder.data.application._id}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.saToken}` },
  });
  state.intruderToken = regIntruder.data.token;
  console.log("✓ Step 5: Secondary Delivery Partner registered for security isolation check");

  // 6. Customer creates order
  const orderRes = await api("/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.custToken}` },
    body: JSON.stringify({
      restaurantId: state.restId,
      items: [{ menuItemId: state.dishId, quantity: 1, price: 290, name: "Tandoori Soya Chaap" }],
      deliveryAddress: {
        street: "B-501 Titanium Square",
        city: "Ahmedabad",
        state: "Gujarat",
        zipCode: "380054",
        coordinates: [72.5074, 23.0125],
      },
      paymentMethod: "COD",
    }),
  });
  assert.strictEqual(orderRes.status, 201, "Customer order created");
  state.orderId = orderRes.data.order._id;
  const customerOtp = orderRes.data.order.orderOtp;

  assert(customerOtp, "Order creation must return 4-digit orderOtp to customer");
  assert.strictEqual(typeof customerOtp, "string", "orderOtp must be string");
  assert.strictEqual(customerOtp.length, 4, "orderOtp must be 4 digits");
  assert.strictEqual(orderRes.data.order.orderOtpHash, undefined, "orderOtpHash must NOT be leaked to customer in API response");
  console.log(`✓ Step 6: Order created with 4-digit OTP: ${customerOtp}`);

  // Verify MongoDB document directly has orderOtpHash
  const dbOrder = await Order.findById(state.orderId);
  assert(dbOrder.orderOtpHash, "MongoDB order document must have orderOtpHash securely stored");
  const hashMatches = await bcrypt.compare(customerOtp, dbOrder.orderOtpHash);
  assert.strictEqual(hashMatches, true, "MongoDB orderOtpHash matches the plain orderOtp using bcrypt");
  console.log(`✓ Step 7: Verified in MongoDB: orderOtpHash is stored securely (bcrypt hash matches OTP ${customerOtp})`);

  // Merchant marks READY_FOR_PICKUP
  await api(`/merchant/orders/${state.orderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${regMerch.data.token}` },
    body: JSON.stringify({ status: "READY_FOR_PICKUP" }),
  });
  console.log("✓ Step 8: Restaurant marked READY_FOR_PICKUP");

  // 9. Delivery agent checks available deliveries
  const availableRes = await api("/delivery/available", {
    headers: { Authorization: `Bearer ${state.delivToken}` },
  });
  assert.strictEqual(availableRes.status, 200);
  const foundInAvailable = availableRes.data.orders.find(o => o._id.toString() === state.orderId.toString());
  assert(foundInAvailable, "Order appears in available deliveries");
  assert.strictEqual(foundInAvailable.orderOtp, undefined, "orderOtp must NOT be disclosed in available deliveries list");
  assert.strictEqual(foundInAvailable.orderOtpHash, undefined, "orderOtpHash must NOT be disclosed in available deliveries list");
  console.log("✓ Step 9: Fleet available deliveries API sanitizes OTP (agent cannot see customer OTP before verification)");

  // 10. Agent accepts order
  const acceptRes = await api(`/delivery/orders/${state.orderId}/accept`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.delivToken}` },
  });
  assert.strictEqual(acceptRes.status, 200);
  assert.strictEqual(acceptRes.data.order.orderOtp, undefined, "orderOtp sanitized in accept response");
  console.log("✓ Step 10: Agent accepted order (status: ACCEPTED, OTP sanitized)");

  // 11. Agent picks up order
  const pickupRes = await api(`/delivery/orders/${state.orderId}/pickup`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.delivToken}` },
  });
  assert.strictEqual(pickupRes.status, 200);
  assert.strictEqual(pickupRes.data.order.orderOtp, undefined, "orderOtp sanitized in pickup response");
  console.log("✓ Step 11: Agent picked up order (status: PICKED_UP, OTP sanitized)");

  // 12. Agent starts transit (out for delivery)
  const outRes = await api(`/delivery/orders/${state.orderId}/out-for-delivery`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.delivToken}` },
  });
  assert.strictEqual(outRes.status, 200);
  assert.strictEqual(outRes.data.order.orderOtp, undefined, "orderOtp sanitized in out-for-delivery response");
  console.log("✓ Step 12: Agent set out for delivery (status: OUT_FOR_DELIVERY, OTP sanitized)");

  // 13. Customer tracking fetch: Customer can view their own OTP
  const custTracking = await api(`/orders/${state.orderId}`, {
    headers: { Authorization: `Bearer ${state.custToken}` },
  });
  assert.strictEqual(custTracking.status, 200);
  assert.strictEqual(custTracking.data.order.orderOtp, customerOtp, "Customer tracking returns correct orderOtp");
  assert.strictEqual(custTracking.data.order.orderOtpHash, undefined, "Customer tracking does not expose orderOtpHash");
  console.log(`✓ Step 13: Customer tracking API returns OTP (${customerOtp}) with hash sanitized`);

  // 14. Negative Test: Blank or missing OTP
  const emptyOtpRes = await api(`/delivery/orders/${state.orderId}/verify-otp`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.delivToken}` },
    body: JSON.stringify({ otp: "" }),
  });
  assert.strictEqual(emptyOtpRes.status, 400, "Blank OTP is rejected with 400");
  console.log("✓ Step 14: Blank OTP rejected with 400 Bad Request");

  // 15. Negative Test: Incorrect OTP
  const wrongOtpRes = await api(`/delivery/orders/${state.orderId}/verify-otp`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.delivToken}` },
    body: JSON.stringify({ otp: "0000" }),
  });
  assert.strictEqual(wrongOtpRes.status, 400, "Wrong OTP rejected with 400");
  assert(wrongOtpRes.data.message.includes("Invalid OTP"), "Error message communicates invalid OTP");
  console.log(`✓ Step 15: Incorrect OTP rejected with message: "${wrongOtpRes.data.message}"`);

  // Verify status is STILL OUT_FOR_DELIVERY in DB
  const orderAfterWrongOtp = await Order.findById(state.orderId);
  assert.strictEqual(orderAfterWrongOtp.orderStatus, "OUT_FOR_DELIVERY", "Order status must NOT become DELIVERED on wrong OTP");
  console.log("✓ Step 16: Order status remained OUT_FOR_DELIVERY after invalid OTP attempt");

  // 17. Security Test: Unauthorized delivery partner tries to verify OTP
  const unauthorizedRes = await api(`/delivery/orders/${state.orderId}/verify-otp`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.intruderToken}` },
    body: JSON.stringify({ otp: customerOtp }),
  });
  assert.strictEqual(unauthorizedRes.status, 403, "Unassigned partner rejected with 403 Forbidden");
  console.log("✓ Step 17: Unassigned delivery partner rejected with 403 Forbidden");

  // 18. Positive Test: Assigned partner provides valid customer OTP
  const validCompleteRes = await api(`/delivery/orders/${state.orderId}/verify-otp`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.delivToken}` },
    body: JSON.stringify({ otp: customerOtp }),
  });
  assert.strictEqual(validCompleteRes.status, 200, "Valid OTP completes delivery with 200 OK");
  assert.strictEqual(validCompleteRes.data.order.orderStatus, "DELIVERED", "Order status is DELIVERED");
  assert(validCompleteRes.data.order.deliveredAt, "deliveredAt timestamp is saved");
  assert.strictEqual(validCompleteRes.data.order.paymentStatus, "SUCCESS", "paymentStatus is SUCCESS");
  assert(validCompleteRes.data.earning, "Delivery earning record created");
  console.log(`✓ Step 18: Delivery completed with valid customer OTP! Status: DELIVERED, deliveredAt: ${validCompleteRes.data.order.deliveredAt}`);

  // 19. Duplicate completion rejection
  const dupRes = await api(`/delivery/orders/${state.orderId}/verify-otp`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.delivToken}` },
    body: JSON.stringify({ otp: customerOtp }),
  });
  assert.strictEqual(dupRes.status, 400, "Already delivered order cannot be verified again");
  console.log("✓ Step 19: Duplicate OTP verification rejected");

  console.log("\n==================================================================");
  console.log(" ALL 19 OTP FLOW VERIFICATION STEPS PASSED SUCCESSFULLY! ");
  console.log("==================================================================\n");
}

await mongoose.connect(process.env.MONGODB_URI);
try {
  await runOtpFlowTest();
} finally {
  await mongoose.disconnect();
}
