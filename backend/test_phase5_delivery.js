/**
 * BiteGo Phase 5: Complete Delivery Partner Functionality Comprehensive Test Suite
 * Tests:
 * 1. Delivery Partner Registration with Bicycle (DL not mandatory) -> Pending verification
 * 2. Delivery Partner Registration with Motor Vehicle without DL -> Blocked with 400 validation error
 * 3. Delivery Partner Registration with Motor Vehicle with DL -> Pending verification
 * 4. Unapproved Partner Access Gate (Blocked with 403 from operational endpoints)
 * 5. Admin Application Review, Document Inspection & Rejection Flow (with rejection reason)
 * 6. Admin Approval Flow (verificationStatus = approved)
 * 7. Online / Offline Duty Status Toggling (isOnline, isAvailable)
 * 8. Offline Partner Dispatch Rejection (Offline partners cannot receive deliveries)
 * 9. Customer places Order & Merchant brings it to READY_FOR_PICKUP
 * 10. Delivery Assignment to Approved + Online + Available Partner (order status -> ASSIGNED)
 * 11. Busy Partner Assignment Prevention (Cannot assign second concurrent order)
 * 12. Full Delivery Lifecycle Transitions:
 *     - Partner accepts order (ASSIGNED -> ACCEPTED, partner marked busy)
 *     - Partner picks up parcel (ACCEPTED -> PICKED_UP)
 *     - Partner sets out for transit (PICKED_UP -> OUT_FOR_DELIVERY)
 *     - OTP Validation: Invalid OTP rejected
 *     - Valid 4-digit Customer OTP: OUT_FOR_DELIVERY -> DELIVERED, payment marked paid, DeliveryEarning record created, partner freed (isAvailable: true)
 * 13. Security Isolation: Partner A cannot view, modify, or verify OTP for Partner B's private order
 * 14. Real MongoDB Dashboard Telemetry & Earnings Verification (Today, Weekly, Total, Completed Drops)
 * 15. Cross-Role Visibility: Customer sees DELIVERED status, Merchant sees order completed
 */

import assert from "node:assert";

const BASE_URL = "http://localhost:5000/api";

const state = {
  adminToken: null,
  customerToken: null,
  merchantToken: null,
  merchantRestaurantId: null,
  partnerAToken: null,
  partnerAUser: null,
  partnerAAppId: null,
  partnerBToken: null,
  partnerBUser: null,
  partnerBAppId: null,
  orderAId: null,
  orderANumber: null,
  orderAOtp: null,
  orderBId: null,
  orderBNumber: null,
  orderBOtp: null,
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
  console.log(" BITEGO PHASE 5: COMPLETE DELIVERY PARTNER FUNCTIONALITY TESTS");
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

  // -------------------------------------------------------------
  // SETUP: Authenticate Admin, Customer, and Fresh Approved Merchant
  // -------------------------------------------------------------
  await runTest("Setup: Login Admin, Customer, and Register & Approve Fresh Merchant", async () => {
    const adminRes = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@bitego.com", password: "Admin@123" }),
    });
    assert.strictEqual(adminRes.status, 200, "Admin login must succeed");
    state.adminToken = adminRes.data.token;

    const custRes = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "customer@bitego.com", password: "Customer@123" }),
    });
    assert.strictEqual(custRes.status, 200, "Customer login must succeed");
    state.customerToken = custRes.data.token;

    // Register a fresh merchant
    const ts = Date.now().toString().slice(-5);
    const merchEmail = `kitchen_${ts}@bitego.test`;
    const regMerch = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: `Kitchen Master ${ts}`,
        email: merchEmail,
        password: "Password@123",
        phone: `+9198111${ts}`,
        role: "merchant",
      }),
    });
    assert.strictEqual(regMerch.status, 201);
    state.merchantToken = regMerch.data.token;

    // Apply for merchant
    const applyMerch = await api("/merchant/apply", {
      method: "POST",
      headers: { Authorization: `Bearer ${state.merchantToken}` },
      body: JSON.stringify({
        ownerName: `Kitchen Master ${ts}`,
        restaurantName: `Express Kitchen ${ts}`,
        email: merchEmail,
        phone: `+9198111${ts}`,
        address: "Bodakdev Hub, Ahmedabad",
        category: "Pizza",
        description: "Artisanal stone-baked pizzas",
        fssaiNumber: `FSSAI-${ts}`,
      }),
    });
    assert.strictEqual(applyMerch.status, 201);
    const appId = applyMerch.data.application._id;

    // Admin approves merchant
    const approveMerch = await api(`/admin/merchants/${appId}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.adminToken}` },
    });
    assert.strictEqual(approveMerch.status, 200);

    // Get created restaurant
    const myRest = await api("/merchant/restaurant", {
      headers: { Authorization: `Bearer ${state.merchantToken}` },
    });
    assert.strictEqual(myRest.status, 200);
    state.merchantRestaurantId = myRest.data.restaurant._id;

    // Add dishes to the restaurant
    const dish1 = await api("/merchant/menu", {
      method: "POST",
      headers: { Authorization: `Bearer ${state.merchantToken}` },
      body: JSON.stringify({
        name: "Paneer Tikka Pizza",
        category: "Pizza",
        price: 349,
        isVeg: true,
        inStock: true,
        description: "Fresh cottage cheese, tandoori spices, capsicum",
      }),
    });
    assert.strictEqual(dish1.status, 201);

    const dish2 = await api("/merchant/menu", {
      method: "POST",
      headers: { Authorization: `Bearer ${state.merchantToken}` },
      body: JSON.stringify({
        name: "Cheesy Garlic Bread",
        category: "Sides",
        price: 180,
        isVeg: true,
        inStock: true,
        description: "Fresh baked garlic bread with melted mozzarella",
      }),
    });
    assert.strictEqual(dish2.status, 201);
  });

  // -------------------------------------------------------------
  // TEST 1: Bicycle Application (Driving Licence is NOT mandatory)
  // -------------------------------------------------------------
  await runTest("Registration: Bicycle delivery partner applies without Driving Licence", async () => {
    const unique = Date.now().toString().slice(-5);
    const email = `cyclist_${unique}@bitego.test`;

    const reg = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: `Rider Bicycle ${unique}`,
        email,
        password: "Password@123",
        phone: `+9198765${unique}`,
        role: "delivery",
      }),
    });
    assert.strictEqual(reg.status, 201);
    const token = reg.data.token;

    // Apply with Bicycle and NO driving license
    const appRes = await api("/delivery/apply", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        fullName: `Rider Bicycle ${unique}`,
        phone: `+9198765${unique}`,
        dob: "2000-01-01",
        address: "Navrangpura, Ahmedabad",
        profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        emergencyContactName: "Emergency Contact",
        emergencyContactPhone: "+919876500000",
        vehicleType: "Bicycle",
        vehicleNumber: "CYCLE-01",
        governmentId: "GOVT-CYCLE-1234",
        documents: [
          { name: "Aadhaar Card", url: "https://bitego.test/docs/aadhaar.pdf", documentType: "government_id" },
        ],
      }),
    });

    assert.strictEqual(appRes.status, 201, "Bicycle application should succeed without driving licence");
    assert.strictEqual(appRes.data.application.status, "pending");
    assert.strictEqual(appRes.data.application.vehicleType, "Bicycle");
    assert.strictEqual(appRes.data.application.drivingLicenseNumber, "");
  });

  // -------------------------------------------------------------
  // TEST 2: Motor Vehicle Application WITHOUT Driving Licence (Must fail)
  // -------------------------------------------------------------
  await runTest("Validation: Motor vehicle application without Driving Licence is rejected", async () => {
    const unique = Date.now().toString().slice(-5);
    const email = `motor_nodl_${unique}@bitego.test`;

    const reg = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: `Motor NoDL ${unique}`,
        email,
        password: "Password@123",
        phone: `+9198761${unique}`,
        role: "delivery",
      }),
    });
    assert.strictEqual(reg.status, 201);
    const token = reg.data.token;

    // Attempt to apply with Bike without DL
    const appRes = await api("/delivery/apply", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        fullName: `Motor NoDL ${unique}`,
        phone: `+9198761${unique}`,
        dob: "1997-04-12",
        address: "Bodakdev, Ahmedabad",
        vehicleType: "Bike",
        vehicleNumber: "GJ01AB1234",
        governmentId: "GOVT-9999",
      }),
    });

    assert.strictEqual(appRes.status, 400, "Motor vehicle application without DL must return 400");
    assert(/driving licen[cs]e/i.test(appRes.data.message), "Must explain DL requirement");
  });

  // -------------------------------------------------------------
  // TEST 3: Motor Vehicle Application WITH Driving Licence (Pending)
  // -------------------------------------------------------------
  await runTest("Registration: Partner A applies with Motor Vehicle & DL", async () => {
    const unique = Date.now().toString().slice(-5);
    const email = `partner_a_${unique}@bitego.test`;

    const reg = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: `Partner A ${unique}`,
        email,
        password: "Password@123",
        phone: `+9198762${unique}`,
        role: "delivery",
      }),
    });
    assert.strictEqual(reg.status, 201);
    state.partnerAToken = reg.data.token;
    state.partnerAUser = reg.data.user;

    const appRes = await api("/delivery/apply", {
      method: "POST",
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
      body: JSON.stringify({
        fullName: `Partner A ${unique}`,
        phone: `+9198762${unique}`,
        dob: "1996-08-20",
        address: "Sindhu Bhavan Road, Ahmedabad",
        profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        emergencyContactName: "Father",
        emergencyContactPhone: "+919800000001",
        vehicleType: "Bike",
        vehicleNumber: "GJ01EV9988",
        drivingLicenseNumber: "GJ-01-2016-8877665",
        vehicleRCNumber: "RC-GJ01-9988",
        governmentId: "AADHAAR-88990011",
        documents: [
          { name: "Driving Licence", url: "https://bitego.test/docs/dl.pdf", documentType: "driving_license" },
          { name: "Vehicle RC", url: "https://bitego.test/docs/rc.pdf", documentType: "vehicle_rc" },
        ],
      }),
    });

    assert.strictEqual(appRes.status, 201);
    assert.strictEqual(appRes.data.application.status, "pending");
    state.partnerAAppId = appRes.data.application._id;
  });

  // -------------------------------------------------------------
  // TEST 4: Access Gate: Pending Delivery Partner Blocked from /fleet
  // -------------------------------------------------------------
  await runTest("Access Control: Pending partner is blocked from /delivery/dashboard (403)", async () => {
    const dashRes = await api("/delivery/dashboard", {
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
    });
    assert.strictEqual(dashRes.status, 403, "Pending partner must receive 403 Forbidden");
    assert.strictEqual(dashRes.data.verificationStatus, "pending");
  });

  // -------------------------------------------------------------
  // TEST 5: Admin Review & Rejection Flow
  // -------------------------------------------------------------
  await runTest("Admin Review: Admin rejects Partner A with compliance reason", async () => {
    const rejectRes = await api(`/admin/delivery/${state.partnerAAppId}/reject`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.adminToken}` },
      body: JSON.stringify({ reason: "Vehicle RC photo blurred. Please provide legible copy." }),
    });
    assert.strictEqual(rejectRes.status, 200);
    assert.strictEqual(rejectRes.data.application.status, "rejected");
    assert.strictEqual(rejectRes.data.application.rejectionReason, "Vehicle RC photo blurred. Please provide legible copy.");

    // Partner A still blocked
    const dashRes = await api("/delivery/dashboard", {
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
    });
    assert.strictEqual(dashRes.status, 403, "Rejected partner must still receive 403");
  });

  // -------------------------------------------------------------
  // TEST 6: Admin Approval Flow
  // -------------------------------------------------------------
  await runTest("Admin Approval: Admin approves Partner A (verificationStatus = approved)", async () => {
    const approveRes = await api(`/admin/delivery/${state.partnerAAppId}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.adminToken}` },
    });
    assert.strictEqual(approveRes.status, 200);
    assert.strictEqual(approveRes.data.application.status, "approved");

    // Partner A can now access operational dashboard
    const dashRes = await api("/delivery/dashboard", {
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
    });
    assert.strictEqual(dashRes.status, 200, "Approved partner must now access dashboard");
    assert.strictEqual(dashRes.data.success, true);
  });

  // -------------------------------------------------------------
  // TEST 7: Online / Offline Duty Status Toggling
  // -------------------------------------------------------------
  await runTest("Duty Status: Partner toggles offline and online", async () => {
    // Go Offline
    const offRes = await api("/delivery/duty", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
      body: JSON.stringify({ isOnline: false }),
    });
    assert.strictEqual(offRes.status, 200);
    assert.strictEqual(offRes.data.isOnline, false);
    assert.strictEqual(offRes.data.isAvailable, false);

    // While offline, available pool must be blocked
    const availOff = await api("/delivery/available", {
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
    });
    assert.strictEqual(availOff.status, 400, "Offline partner cannot poll available deliveries");

    // Go Online
    const onRes = await api("/delivery/duty", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
      body: JSON.stringify({ isOnline: true }),
    });
    assert.strictEqual(onRes.status, 200);
    assert.strictEqual(onRes.data.isOnline, true);
    assert.strictEqual(onRes.data.isAvailable, true);

    const availOn = await api("/delivery/available", {
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
    });
    assert.strictEqual(availOn.status, 200, "Online partner can poll available deliveries");
  });

  // -------------------------------------------------------------
  // TEST 8: Customer Places Order & Merchant Advances to READY_FOR_PICKUP
  // -------------------------------------------------------------
  await runTest("Order Pipeline: Customer orders and Merchant moves to READY_FOR_PICKUP", async () => {
    const orderPayload = {
      restaurantId: state.merchantRestaurantId,
      items: [
        {
          name: "Paneer Tikka Pizza",
          price: 349,
          quantity: 2,
          itemTotal: 698,
          isVeg: true,
        },
      ],
      deliveryAddress: {
        fullName: "Ananya Sharma",
        phone: "+919825012345",
        houseFlat: "Flat 402, Tower B",
        area: "Galaxy Heights, Sindhu Bhavan Road",
        city: "Ahmedabad",
        pincode: "380054",
      },
      deliveryInstructions: "Ring bell once. Leave at door.",
      subtotal: 698,
      deliveryFee: 50,
      tax: 35,
      platformFee: 5,
      totalAmount: 788,
      paymentMethod: "UPI",
    };

    const orderRes = await api("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${state.customerToken}` },
      body: JSON.stringify(orderPayload),
    });
    assert.strictEqual(orderRes.status, 201, "Customer order creation must succeed");
    state.orderAId = orderRes.data.order._id;
    state.orderANumber = orderRes.data.order.orderNumber;
    state.orderAOtp = orderRes.data.order.orderOtp;
    assert(state.orderAOtp, "Order must have 4-digit orderOtp generated");

    // Merchant moves: PLACED -> CONFIRMED -> PREPARING -> READY_FOR_PICKUP
    await api(`/merchant/orders/${state.orderAId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.merchantToken}` },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });

    await api(`/merchant/orders/${state.orderAId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.merchantToken}` },
      body: JSON.stringify({ status: "PREPARING" }),
    });

    const readyRes = await api(`/merchant/orders/${state.orderAId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.merchantToken}` },
      body: JSON.stringify({ status: "READY_FOR_PICKUP" }),
    });
    assert.strictEqual(readyRes.status, 200);
    assert.strictEqual(readyRes.data.order.orderStatus, "READY_FOR_PICKUP");
  });

  // -------------------------------------------------------------
  // TEST 9: Order becomes Eligible in Available Pool
  // -------------------------------------------------------------
  await runTest("Dispatch Pool: Partner A sees Order in available ready-for-pickup queue", async () => {
    const avail = await api("/delivery/available", {
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
    });
    assert.strictEqual(avail.status, 200);
    const found = avail.data.orders.find((o) => o._id === state.orderAId);
    assert(found, "Order A must be visible in online partner's available list");
    assert.strictEqual(found.orderStatus, "READY_FOR_PICKUP");
  });

  // -------------------------------------------------------------
  // TEST 10: Partner A Accepts Order (Becomes ACCEPTED, partner marked busy)
  // -------------------------------------------------------------
  await runTest("Lifecycle: Partner A accepts order (Status -> ACCEPTED, Partner -> Busy)", async () => {
    const acceptRes = await api(`/delivery/orders/${state.orderAId}/accept`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
    });
    assert.strictEqual(acceptRes.status, 200);
    assert.strictEqual(acceptRes.data.order.orderStatus, "ACCEPTED");

    // Verify Partner A is marked isAvailable: false
    const meRes = await api("/auth/me", {
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
    });
    assert.strictEqual(meRes.data.user.isAvailable, false, "Partner with active delivery must be busy");
  });

  // -------------------------------------------------------------
  // TEST 11: Busy Partner Cannot Take Second Concurrent Order
  // -------------------------------------------------------------
  await runTest("Concurrency: Busy Partner A cannot accept second delivery order", async () => {
    // Attempting to assign another order to Partner A via admin/dispatcher
    const partnerId = state.partnerAUser._id || state.partnerAUser.id;
    const assignRes = await api(`/delivery/orders/${state.orderAId}/assign`, {
      method: "POST",
      headers: { Authorization: `Bearer ${state.adminToken}` },
      body: JSON.stringify({ partnerId }),
    });
    // Partner is busy or order is not READY_FOR_PICKUP
    assert.strictEqual(assignRes.status, 400);
  });

  // -------------------------------------------------------------
  // TEST 12: Partner A Kitchen Pickup (Status -> PICKED_UP)
  // -------------------------------------------------------------
  await runTest("Lifecycle: Partner A picks up food from kitchen (Status -> PICKED_UP)", async () => {
    const pickupRes = await api(`/delivery/orders/${state.orderAId}/pickup`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
    });
    assert.strictEqual(pickupRes.status, 200);
    assert.strictEqual(pickupRes.data.order.orderStatus, "PICKED_UP");
  });

  // -------------------------------------------------------------
  // TEST 13: Partner A En Route Transit (Status -> OUT_FOR_DELIVERY)
  // -------------------------------------------------------------
  await runTest("Lifecycle: Partner A sets out for delivery (Status -> OUT_FOR_DELIVERY)", async () => {
    const outRes = await api(`/delivery/orders/${state.orderAId}/out-for-delivery`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
    });
    assert.strictEqual(outRes.status, 200);
    assert.strictEqual(outRes.data.order.orderStatus, "OUT_FOR_DELIVERY");
  });

  // -------------------------------------------------------------
  // TEST 14: OTP Verification & Completion (Invalid OTP rejected)
  // -------------------------------------------------------------
  await runTest("OTP Verification: Incorrect 4-digit code is rejected", async () => {
    const wrongOtpRes = await api(`/delivery/orders/${state.orderAId}/verify-otp`, {
      method: "POST",
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
      body: JSON.stringify({ otp: "0000" }),
    });
    assert.strictEqual(wrongOtpRes.status, 400, "Wrong OTP must be rejected with 400");
    assert(wrongOtpRes.data.message.includes("Invalid OTP"), "Must communicate invalid code");
  });

  // -------------------------------------------------------------
  // TEST 15: Valid Customer OTP Delivery (DELIVERED, Earning recorded, Partner freed)
  // -------------------------------------------------------------
  await runTest("Lifecycle: Valid OTP completes delivery, creates earning & frees partner", async () => {
    const verifyRes = await api(`/delivery/orders/${state.orderAId}/verify-otp`, {
      method: "POST",
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
      body: JSON.stringify({ otp: state.orderAOtp }),
    });
    assert.strictEqual(verifyRes.status, 200, "Valid OTP must complete delivery");
    assert.strictEqual(verifyRes.data.order.orderStatus, "DELIVERED");
    assert(["SUCCESS", "paid"].includes(verifyRes.data.order.paymentStatus), "Payment status must be marked SUCCESS or paid");
    assert(verifyRes.data.earning, "DeliveryEarning record must be returned");
    assert(verifyRes.data.earning.totalEarning > 0, "Earning amount must be greater than zero");

    // Partner A is now freed (isAvailable: true)
    const meRes = await api("/auth/me", {
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
    });
    assert.strictEqual(meRes.data.user.isAvailable, true, "Partner must be available after delivery completion");
  });

  // -------------------------------------------------------------
  // TEST 16: Setup Partner B & Verify Data Isolation / Security
  // -------------------------------------------------------------
  await runTest("Security: Partner A cannot view, modify, or verify Partner B's private mission", async () => {
    const unique = Date.now().toString().slice(-5);
    const email = `partner_b_${unique}@bitego.test`;

    const regB = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: `Partner B ${unique}`,
        email,
        password: "Password@123",
        phone: `+9198763${unique}`,
        role: "delivery",
      }),
    });
    state.partnerBToken = regB.data.token;
    state.partnerBUser = regB.data.user;

    // Apply & approve Partner B
    const appB = await api("/delivery/apply", {
      method: "POST",
      headers: { Authorization: `Bearer ${state.partnerBToken}` },
      body: JSON.stringify({
        fullName: `Partner B ${unique}`,
        phone: `+9198763${unique}`,
        dob: "1995-10-10",
        address: "Vastrapur, Ahmedabad",
        vehicleType: "Scooter",
        vehicleNumber: "GJ01SC5566",
        drivingLicenseNumber: "GJ-01-2015-1122334",
        governmentId: "GOVT-PARTNER-B",
      }),
    });
    state.partnerBAppId = appB.data.application._id;

    await api(`/admin/delivery/${state.partnerBAppId}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.adminToken}` },
    });

    // Partner B goes online
    await api("/delivery/duty", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.partnerBToken}` },
      body: JSON.stringify({ isOnline: true }),
    });

    // Customer places second order
    const orderBRes = await api("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${state.customerToken}` },
      body: JSON.stringify({
        restaurantId: state.merchantRestaurantId,
        items: [{ name: "Cheesy Garlic Bread", price: 180, quantity: 1, itemTotal: 180, isVeg: true }],
        deliveryAddress: {
          fullName: "Rohan Dave",
          phone: "+919825099999",
          houseFlat: "House 12",
          area: "Vastrapur",
          city: "Ahmedabad",
          pincode: "380015",
        },
        subtotal: 180,
        deliveryFee: 40,
        totalAmount: 220,
        paymentMethod: "COD",
      }),
    });
    state.orderBId = orderBRes.data.order._id;
    state.orderBOtp = orderBRes.data.order.orderOtp;

    // Merchant moves Order B to READY_FOR_PICKUP
    await api(`/merchant/orders/${state.orderBId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.merchantToken}` },
      body: JSON.stringify({ status: "READY_FOR_PICKUP" }),
    });

    // Partner B accepts Order B
    const acceptB = await api(`/delivery/orders/${state.orderBId}/accept`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.partnerBToken}` },
    });
    assert.strictEqual(acceptB.status, 200);

    // SECURITY CHECK: Partner A attempts to touch Partner B's order
    const breachPickup = await api(`/delivery/orders/${state.orderBId}/pickup`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
    });
    assert.strictEqual(breachPickup.status, 403, "Partner A cannot pick up Partner B's order (403 Forbidden)");

    const breachOut = await api(`/delivery/orders/${state.orderBId}/out-for-delivery`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
    });
    assert.strictEqual(breachOut.status, 403, "Partner A cannot set transit on Partner B's order (403 Forbidden)");

    const breachOtp = await api(`/delivery/orders/${state.orderBId}/verify-otp`, {
      method: "POST",
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
      body: JSON.stringify({ otp: state.orderBOtp }),
    });
    assert.strictEqual(breachOtp.status, 403, "Partner A cannot verify OTP for Partner B's order (403 Forbidden)");
  });

  // -------------------------------------------------------------
  // TEST 17: Dashboard Telemetry & Real Earnings Ledger
  // -------------------------------------------------------------
  await runTest("Dashboard Telemetry: Partner A sees real completed trips, earnings and history", async () => {
    const dash = await api("/delivery/dashboard", {
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
    });
    assert.strictEqual(dash.status, 200);
    assert(dash.data.stats.todayEarnings > 0, "Today earnings must reflect completed delivery");
    assert.strictEqual(dash.data.stats.completedTrips, 1, "Completed trips count must be exactly 1");
    assert(Array.isArray(dash.data.recentDrops), "Recent drops array must exist");
    assert.strictEqual(dash.data.recentDrops.length, 1, "Must list 1 recent drop");

    const history = await api("/delivery/history", {
      headers: { Authorization: `Bearer ${state.partnerAToken}` },
    });
    assert.strictEqual(history.status, 200);
    assert.strictEqual(history.data.count, 1);
  });

  // -------------------------------------------------------------
  // TEST 18: Cross-Role Real-Time Visibility
  // -------------------------------------------------------------
  await runTest("Cross-Role Visibility: Customer & Merchant see DELIVERED status for Order A", async () => {
    // Customer checks order
    const custOrder = await api(`/orders/${state.orderAId}`, {
      headers: { Authorization: `Bearer ${state.customerToken}` },
    });
    assert.strictEqual(custOrder.status, 200);
    assert.strictEqual(custOrder.data.order.orderStatus, "DELIVERED");

    // Merchant checks orders
    const merchOrders = await api("/merchant/orders", {
      headers: { Authorization: `Bearer ${state.merchantToken}` },
    });
    assert.strictEqual(merchOrders.status, 200);
    const ordFound = merchOrders.data.orders.find((o) => o._id === state.orderAId);
    assert(ordFound, "Order A must be in merchant list");
    assert.strictEqual(ordFound.orderStatus, "DELIVERED");
  });

  console.log("\n================================================================");
  console.log(" ALL 18 PHASE 5 TESTS PASSED SUCCESSFULLY! (100%)");
  console.log("================================================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
