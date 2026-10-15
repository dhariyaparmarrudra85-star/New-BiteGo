import assert from "node:assert";

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

async function runTests() {
  console.log("==================================================================");
  console.log(" BITEGO PHASE 8: COMPLETE ORDER LIFECYCLE ACROSS ALL 5 ROLES");
  console.log("==================================================================\n");

  const timestamp = Date.now();
  const state = {};

  // --------------------------------------------------------------------------
  // STEP 1: Setup Test Accounts (Customer A, Merchant A, Delivery A, Admin A, Super Admin)
  // --------------------------------------------------------------------------
  console.log("--- STEP 1: Account Setup (5 Distinct Roles) ---");

  // 1a. Super Admin Login
  const saLogin = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "superadmin@bitego.com", password: "SuperAdmin@123" }),
  });
  assert.strictEqual(saLogin.status, 200, "Super Admin login succeeds");
  state.superadminToken = saLogin.data.token;
  console.log("  [PASS] Super Admin authenticated");

  // 1b. Admin A Login / Creation
  const adminEmail = `admin_a_${timestamp}@bitego.com`;
  const createAdminRes = await api("/superadmin/admins", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
    body: JSON.stringify({
      name: "Admin A Monitor",
      email: adminEmail,
      password: "Password@123",
      phone: "+91 9900011122",
    }),
  });
  assert.strictEqual(createAdminRes.status, 201, "Admin A created by Super Admin");
  const adminLogin = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: adminEmail, password: "Password@123" }),
  });
  assert.strictEqual(adminLogin.status, 200, "Admin A logged in");
  state.adminToken = adminLogin.data.token;
  console.log("  [PASS] Admin A created by Super Admin and logged in");

  // 1c. Customer A Registration & Login
  const customerEmail = `customer_a_${timestamp}@bitego.com`;
  const regCust = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Customer A",
      email: customerEmail,
      password: "Password@123",
      role: "customer",
      phone: "+91 9876543210",
    }),
  });
  assert.strictEqual(regCust.status, 201, "Customer A registered");
  state.customerToken = regCust.data.token;
  state.customerId = regCust.data.user._id || regCust.data.user.id;
  console.log("  [PASS] Customer A registered & authenticated");

  // 1d. Merchant A Registration, Application & Approval
  const merchantEmail = `merchant_a_${timestamp}@bitego.com`;
  const regMerch = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Merchant A",
      email: merchantEmail,
      password: "Password@123",
      role: "merchant",
      phone: "+91 9811122233",
    }),
  });
  assert.strictEqual(regMerch.status, 201, "Merchant A user registered");
  state.merchantToken = regMerch.data.token;
  state.merchantId = regMerch.data.user._id || regMerch.data.user.id;

  const applyMerch = await api("/merchant/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({
      restaurantName: `Heritage Kitchen A ${timestamp}`,
      ownerName: "Merchant A",
      category: "North Indian",
      address: "Sindhu Bhavan Marg",
      hub: "Bodakdev Hub",
      phone: "+91 9811122233",
      fssaiNumber: `FSSAI-${timestamp.toString().slice(-7)}`,
    }),
  });
  assert.strictEqual(applyMerch.status, 201, "Merchant A applied");
  state.merchantAppId = applyMerch.data.application._id;

  // Approve Merchant A via Admin
  const approveMerch = await api(`/admin/merchants/${state.merchantAppId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  assert.strictEqual(approveMerch.status, 200, "Merchant A approved by Admin A");
  state.restaurantId = approveMerch.data.restaurant._id;
  console.log("  [PASS] Merchant A onboarded, approved & linked to restaurant");

  // Merchant A adds a dish to the menu
  const addDish = await api("/merchant/menu", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({
      name: "Special Paneer Butter Masala Box",
      description: "Rich tomato gravy with fresh paneer cubes and buttery naans",
      category: "Main Course",
      price: 320,
      image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7",
      isVeg: true,
      inStock: true,
      isAvailable: true,
    }),
  });
  assert.strictEqual(addDish.status, 201, "Menu dish created for Merchant A");
  state.dishId = addDish.data.item._id;
  console.log("  [PASS] Merchant A created menu catalog items");

  // 1e. Delivery Partner A Registration, Application, Approval & Online Duty
  const deliveryEmail = `delivery_a_${timestamp}@bitego.com`;
  const regDeliv = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Delivery Pilot A",
      email: deliveryEmail,
      password: "Password@123",
      role: "delivery",
      phone: "+91 9777711223",
    }),
  });
  assert.strictEqual(regDeliv.status, 201, "Delivery A registered");
  state.deliveryToken = regDeliv.data.token;
  state.deliveryId = regDeliv.data.user._id || regDeliv.data.user.id;

  const applyDeliv = await api("/delivery/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
    body: JSON.stringify({
      fullName: "Delivery Pilot A",
      phone: "+91 9777711223",
      dob: "1997-04-12",
      address: "Bodakdev Transit Camp",
      vehicleType: "Bike",
      vehicleNumber: "GJ-01-BK-8899",
      drivingLicenseNumber: `DL-GJ-${timestamp.toString().slice(-6)}`,
    }),
  });
  assert.strictEqual(applyDeliv.status, 201, "Delivery A applied");
  state.deliveryAppId = applyDeliv.data.application._id;

  // Approve Delivery A via Admin
  const approveDeliv = await api(`/admin/delivery/${state.deliveryAppId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  assert.strictEqual(approveDeliv.status, 200, "Delivery A approved by Admin A");

  // Delivery A goes ONLINE
  const setOnline = await api("/delivery/duty", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
    body: JSON.stringify({ isOnline: true }),
  });
  assert.strictEqual(setOnline.status, 200, "Delivery A set duty status to ONLINE");
  assert.strictEqual(setOnline.data.isOnline, true, "Delivery A isOnline is true");
  console.log("  [PASS] Delivery Partner A approved and toggled ONLINE\n");

  // --------------------------------------------------------------------------
  // STEP 2: Customer Creates Order (PLACED) & Security Transitions Check
  // --------------------------------------------------------------------------
  console.log("--- STEP 2: Customer A Places Order (PLACED) ---");
  const createOrderRes = await api("/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.customerToken}` },
    body: JSON.stringify({
      restaurantId: state.restaurantId,
      items: [
        {
          menuItemId: state.dishId,
          name: "Special Paneer Butter Masala Box",
          price: 320,
          quantity: 2,
        },
      ],
      deliveryAddress: {
        fullName: "Customer A",
        phone: "+91 9876543210",
        houseFlat: "Flat 402, Shivalik Highstreet",
        area: "Vastrapur",
        landmark: "Opposite Vastrapur Lake",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "380015",
      },
      paymentMethod: "UPI",
    }),
  });
  assert.strictEqual(createOrderRes.status, 201, "Order created successfully");
  const order = createOrderRes.data.order;
  state.orderId = order._id;
  state.orderNumber = order.orderNumber;
  state.orderOtp = order.orderOtp;
  assert.strictEqual(order.orderStatus, "PLACED", "Initial status is PLACED");
  assert(order.orderOtp, "Order has 4-digit OTP generated");
  console.log(`  [PASS] Order ${state.orderNumber} placed by Customer A (OTP: ${state.orderOtp})`);

  // --------------------------------------------------------------------------
  // STEP 3: Prevention of Invalid Transitions & Role Boundaries
  // --------------------------------------------------------------------------
  console.log("\n--- STEP 3: Backend Validation & Invalid Transition Prevention ---");

  // 3a. Customer CANNOT directly mark order as DELIVERED
  const custDelivAttempt = await api(`/orders/${state.orderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.customerToken}` },
    body: JSON.stringify({ status: "DELIVERED" }),
  });
  assert.strictEqual(custDelivAttempt.status, 403, "Customer directly setting DELIVERED rejected with 403");
  console.log("  [PASS] Customer CANNOT directly set DELIVERED (403 Forbidden)");

  // 3b. Merchant CANNOT mark order as DELIVERED
  const merchDelivAttempt = await api(`/merchant/orders/${state.orderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({ status: "DELIVERED" }),
  });
  assert.strictEqual(merchDelivAttempt.status, 403, "Merchant setting DELIVERED rejected with 403");
  console.log("  [PASS] Merchant CANNOT set DELIVERED (403 Forbidden)");

  // 3c. Delivery partner CANNOT set PREPARING
  const delivPrepAttempt = await api(`/orders/${state.orderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
    body: JSON.stringify({ status: "PREPARING" }),
  });
  assert.strictEqual(delivPrepAttempt.status, 403, "Delivery partner setting PREPARING rejected with 403");
  console.log("  [PASS] Delivery Partner CANNOT set PREPARING (403 Forbidden)");

  // 3d. Delivery partner CANNOT accept before READY_FOR_PICKUP
  const prematureAccept = await api(`/delivery/orders/${state.orderId}/accept`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
  });
  assert.strictEqual(prematureAccept.status, 400, "Premature accept rejected with 400");
  console.log("  [PASS] Delivery Partner CANNOT accept order while still PLACED (400 Bad Request)");

  // 3e. Delivery partner CANNOT deliver before OUT_FOR_DELIVERY
  const prematureDeliver = await api(`/delivery/orders/${state.orderId}/verify-otp`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
    body: JSON.stringify({ otp: state.orderOtp }),
  });
  assert([400, 403].includes(prematureDeliver.status), "Premature/unassigned delivery rejected");
  console.log("  [PASS] Delivery Partner CANNOT deliver unassigned/unprepared order (Rejected with 403/400)");

  // 3f. Admin CANNOT skip lifecycle directly to DELIVERED
  const adminBypassAttempt = await api(`/admin/orders/${state.orderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({ status: "DELIVERED" }),
  });
  assert.strictEqual(adminBypassAttempt.status, 400, "Admin skipping to DELIVERED rejected with 400");
  console.log("  [PASS] Admin CANNOT bypass lifecycle directly to DELIVERED (400 Bad Request)\n");

  // --------------------------------------------------------------------------
  // STEP 4: Merchant A Confirms Order (CONFIRMED) & Starts Preparation (PREPARING)
  // --------------------------------------------------------------------------
  console.log("--- STEP 4: Merchant A Advances Kitchen Lifecycle ---");

  // 4a. Merchant views incoming order in orders list
  const merchOrdersRes = await api("/merchant/orders", {
    headers: { Authorization: `Bearer ${state.merchantToken}` },
  });
  assert.strictEqual(merchOrdersRes.status, 200, "Merchant fetched orders");
  const foundOrder = merchOrdersRes.data.orders.find((o) => o._id === state.orderId);
  assert(foundOrder, "Placed order appears in Merchant A incoming tickets");
  console.log("  [PASS] Merchant A sees incoming order on kitchen ticket board");

  // 4b. Merchant confirms order
  const confirmRes = await api(`/merchant/orders/${state.orderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({ status: "CONFIRMED", note: "Kitchen verified ticket" }),
  });
  assert.strictEqual(confirmRes.status, 200, "Order confirmed");
  assert.strictEqual(confirmRes.data.order.orderStatus, "CONFIRMED", "Order status is CONFIRMED");
  console.log("  [PASS] Merchant A confirmed order: PLACED -> CONFIRMED");

  // 4c. Merchant starts food preparation
  const prepRes = await api(`/merchant/orders/${state.orderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({ status: "PREPARING", note: "Chef cooking butter masala and fresh naans" }),
  });
  assert.strictEqual(prepRes.status, 200, "Order preparing");
  assert.strictEqual(prepRes.data.order.orderStatus, "PREPARING", "Order status is PREPARING");
  console.log("  [PASS] Merchant A moved order: CONFIRMED -> PREPARING");

  // 4d. Once preparing, Customer CANNOT cancel
  const custCancelAttempt = await api(`/orders/${state.orderId}/cancel`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.customerToken}` },
    body: JSON.stringify({ reason: "Changed my mind" }),
  });
  assert.strictEqual(custCancelAttempt.status, 400, "Customer cancel during PREPARING rejected");
  console.log("  [PASS] Customer CANNOT cancel order once kitchen preparation has begun\n");

  // --------------------------------------------------------------------------
  // STEP 5: Merchant A Marks Ready For Pickup (READY_FOR_PICKUP)
  // --------------------------------------------------------------------------
  console.log("--- STEP 5: Merchant A Marks Food Ready at Counter ---");
  const readyRes = await api(`/merchant/orders/${state.orderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({ status: "READY_FOR_PICKUP", note: "Packed with hot seal packaging" }),
  });
  assert.strictEqual(readyRes.status, 200, "Order ready for pickup");
  assert.strictEqual(readyRes.data.order.orderStatus, "READY_FOR_PICKUP", "Order status is READY_FOR_PICKUP");
  console.log("  [PASS] Merchant A moved order: PREPARING -> READY_FOR_PICKUP\n");

  // --------------------------------------------------------------------------
  // STEP 6: Delivery Partner A Dispatches, Picks Up & Heads Out
  // --------------------------------------------------------------------------
  console.log("--- STEP 6: Delivery Partner A Accepts, Collects & Dispatches ---");

  // 6a. Delivery A sees order in available pool
  const availRes = await api("/delivery/available", {
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
  });
  assert.strictEqual(availRes.status, 200, "Delivery A fetched available deliveries");
  const availOrder = availRes.data.orders.find((o) => o._id === state.orderId);
  assert(availOrder, "Ready order appears on Delivery Partner A radar");
  console.log("  [PASS] Order appears in Delivery Partner A available pool");

  // 6b. Delivery A accepts order
  const acceptRes = await api(`/delivery/orders/${state.orderId}/accept`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
  });
  assert.strictEqual(acceptRes.status, 200, "Delivery A accepted mission");
  assert.strictEqual(acceptRes.data.order.orderStatus, "ACCEPTED", "Order status is ACCEPTED");
  console.log("  [PASS] Delivery Partner A accepted mission: READY_FOR_PICKUP -> ACCEPTED");

  // Concurrency check: Courier A is now busy
  const courierBusyCheck = await api("/auth/me", {
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
  });
  assert.strictEqual(courierBusyCheck.data.user.isAvailable, false, "Courier is marked busy during mission");
  console.log("  [PASS] Courier marked busy (isAvailable: false)");

  // 6c. Delivery A picks up from restaurant counter
  const pickupRes = await api(`/delivery/orders/${state.orderId}/pickup`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
  });
  assert.strictEqual(pickupRes.status, 200, "Delivery A collected parcel");
  assert.strictEqual(pickupRes.data.order.orderStatus, "PICKED_UP", "Order status is PICKED_UP");
  console.log("  [PASS] Delivery Partner A collected parcel: ACCEPTED -> PICKED_UP");

  // 6d. Delivery A sets out for customer delivery
  const outRes = await api(`/delivery/orders/${state.orderId}/out-for-delivery`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
  });
  assert.strictEqual(outRes.status, 200, "Order is out for delivery");
  assert.strictEqual(outRes.data.order.orderStatus, "OUT_FOR_DELIVERY", "Order status is OUT_FOR_DELIVERY");
  console.log("  [PASS] Delivery Partner A heading to customer: PICKED_UP -> OUT_FOR_DELIVERY\n");

  // --------------------------------------------------------------------------
  // STEP 7: Customer Delivery Handover via OTP Verification (DELIVERED)
  // --------------------------------------------------------------------------
  console.log("--- STEP 7: Customer Handover & OTP Completion ---");

  // 7a. Incorrect OTP fails
  const wrongOtpRes = await api(`/delivery/orders/${state.orderId}/verify-otp`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
    body: JSON.stringify({ otp: "0000" }),
  });
  assert.strictEqual(wrongOtpRes.status, 400, "Wrong OTP rejected");
  console.log("  [PASS] Wrong OTP correctly rejected (400 Bad Request)");

  // 7b. Correct OTP succeeds
  const validOtpRes = await api(`/delivery/orders/${state.orderId}/verify-otp`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
    body: JSON.stringify({ otp: state.orderOtp }),
  });
  assert.strictEqual(validOtpRes.status, 200, "Correct OTP verified and delivery completed");
  assert.strictEqual(validOtpRes.data.order.orderStatus, "DELIVERED", "Order status is DELIVERED");
  assert(["SUCCESS", "paid"].includes(validOtpRes.data.order.paymentStatus), "Payment status is marked SUCCESS or paid");
  assert(validOtpRes.data.earning, "Courier earning recorded");
  console.log("  [PASS] Valid OTP verified: OUT_FOR_DELIVERY -> DELIVERED (Earning recorded)");

  // 7c. Courier A is freed up for next mission
  const courierFreeCheck = await api("/auth/me", {
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
  });
  assert.strictEqual(courierFreeCheck.data.user.isAvailable, true, "Courier is available again");
  console.log("  [PASS] Courier automatically freed up for next assignment\n");

  // --------------------------------------------------------------------------
  // STEP 8: Customer Views Order Tracking & Submits Review
  // --------------------------------------------------------------------------
  console.log("--- STEP 8: Customer Tracking & Review ---");
  const custViewRes = await api(`/orders/${state.orderId}`, {
    headers: { Authorization: `Bearer ${state.customerToken}` },
  });
  assert.strictEqual(custViewRes.status, 200, "Customer retrieved completed order");
  assert.strictEqual(custViewRes.data.order.orderStatus, "DELIVERED", "Customer sees DELIVERED status");
  assert(custViewRes.data.order.statusTimeline.length >= 6, "Full audit timeline recorded");
  console.log(`  [PASS] Customer verifies DELIVERED status with ${custViewRes.data.order.statusTimeline.length} timeline stages`);

  // Customer reviews restaurant & courier
  const reviewRes = await api(`/orders/${state.orderId}/review`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.customerToken}` },
    body: JSON.stringify({
      rating: 5,
      restaurantRating: 5,
      courierRating: 5,
      reviewText: "Excellent food, still steaming hot! Super fast delivery pilot.",
    }),
  });
  assert.strictEqual(reviewRes.status, 200, "Customer review saved");
  console.log("  [PASS] Customer submitted 5-star review for restaurant and courier\n");

  // --------------------------------------------------------------------------
  // STEP 9: Admin A & Super Admin Monitor Platform Synchronization
  // --------------------------------------------------------------------------
  console.log("--- STEP 9: Admin A & Super Admin Platform Supervision ---");

  // 9a. Admin A monitors order
  const adminOrdersRes = await api("/admin/orders", {
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  assert.strictEqual(adminOrdersRes.status, 200, "Admin A fetched platform orders");
  const adminFoundOrder = adminOrdersRes.data.orders.find(
    (o) => o._id === state.orderId || o.orderNumber === state.orderNumber
  );
  assert(adminFoundOrder, "Completed order present in Admin A ledger");
  assert.strictEqual(adminFoundOrder.orderStatus, "DELIVERED", "Admin sees DELIVERED status");
  assert(adminFoundOrder.customer.name, "Customer info populated");
  assert(adminFoundOrder.restaurant.name, "Restaurant info populated");
  assert(adminFoundOrder.deliveryPartner.name, "Courier info populated");
  console.log("  [PASS] Admin A monitors completed order with full relational metadata");

  // 9b. Super Admin monitors live telemetry
  const saOverview = await api("/superadmin/overview", {
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(saOverview.status, 200, "Super Admin fetched platform overview");
  assert(saOverview.data.stats.completedOrders > 0, "Super Admin sees completed orders count");
  assert(saOverview.data.stats.totalRevenue > 0, "Super Admin sees aggregated platform revenue");
  console.log("  [PASS] Super Admin dashboard telemetry accurately reflects completed order\n");

  // --------------------------------------------------------------------------
  // STEP 10: Customer Cancellation Flow on Eligible Order
  // --------------------------------------------------------------------------
  console.log("--- STEP 10: Customer Eligible Order Cancellation Flow ---");
  const freshOrderRes = await api("/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.customerToken}` },
    body: JSON.stringify({
      restaurantId: state.restaurantId,
      items: [
        {
          menuItemId: state.dishId,
          name: "Special Paneer Butter Masala Box",
          price: 320,
          quantity: 1,
        },
      ],
      deliveryAddress: {
        fullName: "Customer A",
        phone: "+91 9876543210",
        houseFlat: "Flat 402, Shivalik Highstreet",
        area: "Vastrapur",
        landmark: "Opposite Vastrapur Lake",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "380015",
      },
      paymentMethod: "Online",
    }),
  });
  assert.strictEqual(freshOrderRes.status, 201, "Fresh order created");
  const freshOrderId = freshOrderRes.data.order._id;
  assert.strictEqual(freshOrderRes.data.order.orderStatus, "PLACED", "Fresh order status is PLACED");

  // Customer cancels while still in PLACED state
  const cancelRes = await api(`/orders/${freshOrderId}/cancel`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.customerToken}` },
    body: JSON.stringify({ reason: "Order placed by mistake, need to change delivery address" }),
  });
  assert.strictEqual(cancelRes.status, 200, "Customer cancelled eligible order");
  assert.strictEqual(cancelRes.data.order.orderStatus, "CANCELLED", "Order status updated to CANCELLED");
  assert.strictEqual(
    cancelRes.data.order.cancellationReason,
    "Order placed by mistake, need to change delivery address",
    "Cancellation reason recorded"
  );
  console.log("  [PASS] Customer A successfully cancelled eligible PLACED order with recorded reason\n");

  console.log("==================================================================");
  console.log(" ALL PHASE 8: ORDER LIFECYCLE TESTS PASSED WITH 100% SUCCESS! ");
  console.log("==================================================================");
}

runTests().catch((err) => {
  console.error("\nTest failed with error:", err);
  process.exit(1);
});
