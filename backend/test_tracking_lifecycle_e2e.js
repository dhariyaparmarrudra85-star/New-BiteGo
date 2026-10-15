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

// Mirror the frontend getStageStatus logic from OrderLifecycle.jsx
function computeFrontendStageStatus(orderStatus) {
  const STAGES = [
    { id: 1, label: "Order Placed" },
    { id: 2, label: "Payment Confirmed" },
    { id: 3, label: "Kitchen Accepted" },
    { id: 4, label: "Preparing Meal" },
    { id: 5, label: "Ready for Pickup" },
    { id: 6, label: "Delivery Agent Assigned" },
    { id: 7, label: "Picked Up from Kitchen" },
    { id: 8, label: "Out for Delivery" },
    { id: 9, label: "Delivered" },
  ];

  const norm = (orderStatus || "").toUpperCase();

  if (norm === "DELIVERED") {
    return STAGES.map(s => ({ id: s.id, label: s.label, status: "completed" }));
  }

  const activeStageIndexMap = {
    "PLACED": 1,
    "CONFIRMED": 3,
    "PREPARING": 4,
    "READY_FOR_PICKUP": 5,
    "ASSIGNED": 7,
    "ACCEPTED": 7,
    "PICKED_UP": 8,
    "OUT_FOR_DELIVERY": 8,
  };

  const activeStage = activeStageIndexMap[norm] || 1;

  return STAGES.map(s => {
    let status = "pending";
    if (s.id < activeStage) status = "completed";
    else if (s.id === activeStage) status = "active";
    return { id: s.id, label: s.label, status };
  });
}

async function runTest() {
  console.log("==================================================================");
  console.log(" BITEGO E2E: CUSTOMER ORDER TRACKING LIFECYCLE VERIFICATION");
  console.log("==================================================================\n");

  const timestamp = Date.now();
  const state = {};

  // 1. Log in SuperAdmin
  const saLogin = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "superadmin@bitego.com", password: "SuperAdmin@123" }),
  });
  assert.strictEqual(saLogin.status, 200, "Super Admin login succeeds");
  state.superadminToken = saLogin.data.token;
  console.log("✓ SuperAdmin authenticated");

  // 2. Register Customer
  const custEmail = `cust_track_${timestamp}@bitego.com`;
  const regCust = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Ananya Sharma",
      email: custEmail,
      password: "Password@123",
      role: "customer",
      phone: "+91 9876540001",
    }),
  });
  assert([200, 201].includes(regCust.status), "Customer registered");
  state.customerToken = regCust.data.token;
  state.customerId = regCust.data.user._id || regCust.data.user.id;
  console.log(`✓ Customer registered: ${custEmail}`);

  // 3. Register & Approve Merchant
  const merchEmail = `merch_track_${timestamp}@bitego.com`;
  const regMerch = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Chef Sanjeev",
      email: merchEmail,
      password: "Password@123",
      role: "merchant",
      phone: "+91 9876540002",
    }),
  });
  assert([200, 201].includes(regMerch.status), "Merchant registered");
  state.merchantToken = regMerch.data.token;

  const applyMerch = await api("/merchant/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({
      restaurantName: `Royal Dawat Bistro ${timestamp}`,
      ownerName: "Chef Sanjeev",
      phone: "+91 9876540002",
      address: "Sindhu Bhavan Road, Bodakdev",
      category: "Mughlai & Biryani",
      fssaiNumber: `FSSAI-${timestamp.toString().slice(-10)}`,
      gstin: "24ABCDE9999F1Z1",
    }),
  });
  assert.strictEqual(applyMerch.status, 201, "Merchant applied");
  state.merchantAppId = applyMerch.data.application._id;

  const approveMerch = await api(`/superadmin/merchants/${state.merchantAppId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(approveMerch.status, 200, "Merchant approved");
  state.restaurantId = approveMerch.data.restaurant?._id || approveMerch.data.application?.restaurantId;
  if (!state.restaurantId) {
    const myRest = await api("/merchant/profile", {
      headers: { Authorization: `Bearer ${state.merchantToken}` },
    });
    state.restaurantId = myRest.data.restaurant._id;
  }
  console.log(`✓ Merchant approved & linked to restaurant: ${state.restaurantId}`);

  // Add menu item
  const addDish = await api("/merchant/menu", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({
      name: "Hyderabadi Dum Biryani",
      price: 340,
      category: "Main Course",
      isVeg: false,
      inStock: true,
      isAvailable: true,
      description: "Authentic dum-cooked basmati rice with spices",
    }),
  });
  assert.strictEqual(addDish.status, 201, "Menu dish created");
  state.dishId = addDish.data.item._id;
  console.log(`✓ Menu dish created: ${addDish.data.item.name}`);

  // 4. Register & Approve Delivery Pilot
  const delivEmail = `deliv_track_${timestamp}@bitego.com`;
  const regDeliv = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Pilot Vikram Rathore",
      email: delivEmail,
      password: "Password@123",
      role: "delivery",
      phone: "+91 9876540003",
    }),
  });
  assert([200, 201].includes(regDeliv.status), "Delivery partner registered");
  state.deliveryToken = regDeliv.data.token;
  state.deliveryUserId = regDeliv.data.user._id || regDeliv.data.user.id;

  const applyDeliv = await api("/delivery/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
    body: JSON.stringify({
      fullName: "Pilot Vikram Rathore",
      phone: "+91 9876540003",
      dob: "1995-05-12",
      address: "Bodakdev Hub, Ahmedabad",
      vehicleType: "Scooter",
      vehicleNumber: "GJ-01-EV-8888",
      drivingLicenseNumber: `DL-GJ-${timestamp.toString().slice(-6)}`,
    }),
  });
  assert.strictEqual(applyDeliv.status, 201, "Delivery application submitted");

  const approveDeliv = await api(`/superadmin/delivery/${applyDeliv.data.application._id}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(approveDeliv.status, 200, "Delivery partner approved");
  console.log(`✓ Delivery partner approved: ${delivEmail}`);

  // Ensure delivery partner is ON DUTY
  const dutyRes = await api("/delivery/duty", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
    body: JSON.stringify({ isOnline: true }),
  });
  assert.strictEqual(dutyRes.status, 200, "Delivery duty toggled online");
  console.log("✓ Delivery pilot is Online / On-Duty");

  // 5. Customer places order
  const orderRes = await api("/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.customerToken}` },
    body: JSON.stringify({
      restaurantId: state.restaurantId,
      items: [{ menuItemId: state.dishId, quantity: 1, price: 340, name: "Hyderabadi Dum Biryani" }],
      deliveryAddress: {
        street: "B-402, Titanium City Centre",
        city: "Ahmedabad",
        state: "Gujarat",
        zipCode: "380015",
        coordinates: [72.5074, 23.0125],
      },
      paymentMethod: "COD",
    }),
  });
  assert.strictEqual(orderRes.status, 201, "Customer order placed");
  state.orderId = orderRes.data.order._id;
  const deliveryOtp = orderRes.data.order.deliveryOtp || "123456";
  console.log(`✓ Order placed: ${state.orderId} (OTP: ${deliveryOtp})`);

  // Merchant marks Confirmed -> Preparing -> Ready at Counter
  await api(`/merchant/orders/${state.orderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({ status: "CONFIRMED" }),
  });
  await api(`/merchant/orders/${state.orderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({ status: "PREPARING" }),
  });
  const readyRes = await api(`/merchant/orders/${state.orderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({ status: "READY_FOR_PICKUP" }),
  });
  assert.strictEqual(readyRes.status, 200, "Merchant marked order READY_FOR_PICKUP");
  console.log("✓ Step 1: Restaurant marked READY_FOR_PICKUP");

  // Step 2: Customer checks tracking
  const custTracking1 = await api(`/orders/${state.orderId}`, {
    headers: { Authorization: `Bearer ${state.customerToken}` },
  });
  assert.strictEqual(custTracking1.status, 200, "Customer gets order");
  assert.strictEqual(custTracking1.data.order.orderStatus, "READY_FOR_PICKUP");
  const stages1 = computeFrontendStageStatus(custTracking1.data.order.orderStatus);
  const stage5 = stages1.find(s => s.id === 5);
  assert.strictEqual(stage5.status, "active", "Stage 5 (Ready for Pickup) must be active");
  console.log("✓ Step 2: Customer sees 'Ready for Pickup' as ACTIVE step");

  // Step 3 & 4: Delivery agent accepts the order
  const acceptRes = await api(`/delivery/orders/${state.orderId}/accept`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
  });
  assert.strictEqual(acceptRes.status, 200, "Fleet pilot accepted the order");
  assert(["ACCEPTED", "ASSIGNED"].includes(acceptRes.data.order.orderStatus), "Order status is ACCEPTED/ASSIGNED");
  console.log(`✓ Step 3: Delivery pilot accepted order (status: ${acceptRes.data.order.orderStatus})`);

  // Customer checks tracking after acceptance
  const custTracking2 = await api(`/orders/${state.orderId}`, {
    headers: { Authorization: `Bearer ${state.customerToken}` },
  });
  assert.strictEqual(custTracking2.status, 200);
  assert(["ASSIGNED", "ACCEPTED"].includes(custTracking2.data.order.orderStatus));
  assert(custTracking2.data.order.deliveryPartner, "deliveryPartner must be populated");
  assert.strictEqual(custTracking2.data.order.deliveryPartner.name, "Pilot Vikram Rathore");
  const stages2 = computeFrontendStageStatus(custTracking2.data.order.orderStatus);
  const stage6 = stages2.find(s => s.id === 6);
  const stage7 = stages2.find(s => s.id === 7);
  assert.strictEqual(stage6.status, "completed", "Stage 6 (Delivery Agent Assigned) must be COMPLETED");
  assert.strictEqual(stage7.status, "active", "Stage 7 (Picked Up from Kitchen) must be ACTIVE");
  console.log("✓ Step 4: Customer sees Stage 6 (Agent Assigned) COMPLETED & Stage 7 ACTIVE, pilot name populated");

  // Step 5, 6, 7: Agent clicks Pick Up Order
  const pickupRes = await api(`/delivery/orders/${state.orderId}/pickup`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
  });
  assert.strictEqual(pickupRes.status, 200, "Pick up order succeeds");
  assert.strictEqual(pickupRes.data.order.orderStatus, "PICKED_UP");
  console.log("✓ Step 5 & 6: Agent picked up order, MongoDB status changed to PICKED_UP");

  // Customer checks tracking after pickup
  const custTracking3 = await api(`/orders/${state.orderId}`, {
    headers: { Authorization: `Bearer ${state.customerToken}` },
  });
  assert.strictEqual(custTracking3.status, 200);
  assert.strictEqual(custTracking3.data.order.orderStatus, "PICKED_UP");
  const stages3 = computeFrontendStageStatus(custTracking3.data.order.orderStatus);
  const stage7After = stages3.find(s => s.id === 7);
  const stage8After = stages3.find(s => s.id === 8);
  assert.strictEqual(stage7After.status, "completed", "Stage 7 (Picked Up from Kitchen) must be COMPLETED");
  assert.strictEqual(stage8After.status, "active", "Stage 8 (Out for Delivery) must be ACTIVE");
  console.log("✓ Step 7: Customer sees Stage 7 (Picked Up) COMPLETED & Stage 8 (Out for Delivery) ACTIVE");

  // Step 8 & 9: Agent sets Out for Delivery (starts transit)
  const outRes = await api(`/delivery/orders/${state.orderId}/out-for-delivery`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
  });
  assert.strictEqual(outRes.status, 200, "Out for delivery succeeds");
  assert.strictEqual(outRes.data.order.orderStatus, "OUT_FOR_DELIVERY");
  console.log("✓ Step 8: Agent started transit journey (status: OUT_FOR_DELIVERY)");

  const custTracking4 = await api(`/orders/${state.orderId}`, {
    headers: { Authorization: `Bearer ${state.customerToken}` },
  });
  assert.strictEqual(custTracking4.status, 200);
  assert.strictEqual(custTracking4.data.order.orderStatus, "OUT_FOR_DELIVERY");
  const stages4 = computeFrontendStageStatus(custTracking4.data.order.orderStatus);
  assert.strictEqual(stages4.find(s => s.id === 8).status, "active", "Stage 8 remains ACTIVE");
  console.log("✓ Step 9: Customer sees Stage 8 (Out for Delivery) remains ACTIVE during transit");

  // Step 10 & 11: Agent completes delivery with OTP verification
  // Fetch actual OTP from order document
  const orderDoc = await Order.findById(state.orderId);
  const realOtp = orderDoc.orderOtp;
  console.log(`Using real delivery OTP from DB: ${realOtp}`);

  const completeRes = await api(`/delivery/orders/${state.orderId}/verify-otp`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
    body: JSON.stringify({ otp: realOtp }),
  });
  assert.strictEqual(completeRes.status, 200, "Delivery completed successfully");
  assert.strictEqual(completeRes.data.order.orderStatus, "DELIVERED");
  console.log("✓ Step 10: Agent verified OTP and completed delivery. Status: DELIVERED");

  // Step 11: Customer sees all 9 timeline stages completed
  const custTracking5 = await api(`/orders/${state.orderId}`, {
    headers: { Authorization: `Bearer ${state.customerToken}` },
  });
  assert.strictEqual(custTracking5.status, 200);
  assert.strictEqual(custTracking5.data.order.orderStatus, "DELIVERED");
  assert(custTracking5.data.order.deliveredAt, "deliveredAt timestamp must be recorded");
  const stages5 = computeFrontendStageStatus(custTracking5.data.order.orderStatus);
  const allCompleted = stages5.every(s => s.status === "completed");
  assert.strictEqual(allCompleted, true, "All timeline steps must be COMPLETED when DELIVERED");
  console.log("✓ Step 11: Customer sees ALL timeline stages COMPLETED (100% full bar) with deliveredAt recorded");

  // Step 12: Browser refresh simulation
  const refreshRes = await api(`/orders?status=all`, {
    headers: { Authorization: `Bearer ${state.customerToken}` },
  });
  assert.strictEqual(refreshRes.status, 200);
  const refreshedOrder = refreshRes.data.orders.find(o => o._id.toString() === state.orderId.toString());
  assert(refreshedOrder, "Refreshed orders list contains the order");
  assert.strictEqual(refreshedOrder.orderStatus, "DELIVERED");
  console.log("✓ Step 12: Customer refresh simulation confirms persistent DELIVERED status in MongoDB");

  console.log("\n==================================================================");
  console.log(" ALL 12 END-TO-END VERIFICATION CHECKS PASSED PERFECTLY! ");
  console.log("==================================================================\n");
}

await mongoose.connect(process.env.MONGODB_URI);
try {
  await runTest();
} finally {
  await mongoose.disconnect();
}
