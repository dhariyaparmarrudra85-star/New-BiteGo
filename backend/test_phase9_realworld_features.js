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
  console.log(" BITEGO PHASE 9: REAL-WORLD FOOD DELIVERY FEATURES SUITE");
  console.log("==================================================================\n");

  const timestamp = Date.now();
  const state = {};

  // --------------------------------------------------------------------------
  // STEP 0: Base Authentication Setup
  // --------------------------------------------------------------------------
  console.log("--- STEP 0: Account Setup ---");
  // Super Admin & Admin Login
  const saLogin = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "superadmin@bitego.com", password: "SuperAdmin@123" }),
  });
  assert.strictEqual(saLogin.status, 200, "Super Admin login succeeds");
  state.superadminToken = saLogin.data.token;

  const adminLogin = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@bitego.com", password: "Admin@123" }),
  });
  assert.strictEqual(adminLogin.status, 200, "Admin login succeeds");
  state.adminToken = adminLogin.data.token;

  // Customer 9
  const custEmail = `cust_p9_${timestamp}@bitego.com`;
  const regCust = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Customer Nine",
      email: custEmail,
      password: "Password@123",
      role: "customer",
    }),
  });
  assert.strictEqual(regCust.status, 201, "Customer 9 registered");
  state.customerToken = regCust.data.token;
  state.customerId = regCust.data.user._id || regCust.data.user.id;

  // Merchant 9
  const merchEmail = `merch_p9_${timestamp}@bitego.com`;
  const regMerch = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Chef Nine",
      email: merchEmail,
      password: "Password@123",
      role: "merchant",
    }),
  });
  assert.strictEqual(regMerch.status, 201, "Merchant 9 registered");
  state.merchantToken = regMerch.data.token;
  state.merchantId = regMerch.data.user._id || regMerch.data.user.id;

  // Merchant application submission (triggers Admin notification)
  const applyMerch = await api("/merchant/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({
      restaurantName: `Nine Flavors Kitchen ${timestamp}`,
      ownerName: "Chef Nine",
      category: "Continental",
      address: "S.G. Highway, Bodakdev",
      hub: "Bodakdev Hub",
      phone: "+91 9999911111",
      fssaiNumber: `FSSAI-${timestamp.toString().slice(-6)}`,
    }),
  });
  assert.strictEqual(applyMerch.status, 201, "Merchant application created");
  state.merchantAppId = applyMerch.data.application._id;

  // Admin approves merchant
  const approveMerch = await api(`/admin/merchants/${state.merchantAppId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  assert.strictEqual(approveMerch.status, 200, "Merchant approved");
  state.restaurantId = approveMerch.data.restaurant._id;

  // Add menu item
  const addDish = await api("/merchant/menu", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({
      name: "Truffle Mushroom Risotto",
      description: "Creamy arborio rice with black truffle oil and parmesan",
      category: "Continental",
      price: 390,
      isVeg: true,
      inStock: true,
      isAvailable: true,
    }),
  });
  assert.strictEqual(addDish.status, 201, "Dish added");
  state.dishId = addDish.data.item._id;

  // Delivery Partner 9
  const delivEmail = `deliv_p9_${timestamp}@bitego.com`;
  const regDeliv = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Pilot Nine",
      email: delivEmail,
      password: "Password@123",
      role: "delivery",
    }),
  });
  assert.strictEqual(regDeliv.status, 201, "Delivery 9 registered");
  state.deliveryToken = delivEmail;
  state.deliveryToken = regDeliv.data.token;
  state.deliveryId = regDeliv.data.user._id || regDeliv.data.user.id;

  const applyDeliv = await api("/delivery/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
    body: JSON.stringify({
      fullName: "Pilot Nine",
      phone: "+91 9888822222",
      dob: "1997-03-22",
      address: "Bodakdev Hub",
      vehicleType: "Bike",
      vehicleNumber: "GJ-01-NN-9999",
      drivingLicenseNumber: `DL-GJ-${timestamp.toString().slice(-6)}`,
    }),
  });
  assert.strictEqual(applyDeliv.status, 201, "Delivery application submitted");
  state.deliveryAppId = applyDeliv.data.application._id;

  await api(`/admin/delivery/${state.deliveryAppId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  await api("/delivery/duty", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
    body: JSON.stringify({ isOnline: true }),
  });
  console.log("  [PASS] Test accounts initialized with live roles\n");

  // --------------------------------------------------------------------------
  // TEST 1: Addresses Management (Add, Edit, Delete, Set Default)
  // --------------------------------------------------------------------------
  console.log("--- TEST 1: Address Management (CRUD + Default) ---");
  // 1a. Add Address 1 (Home)
  const addAddr1 = await api("/users/addresses", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.customerToken}` },
    body: JSON.stringify({
      fullName: "Customer Nine",
      phone: "+91 9999988888",
      houseFlat: "Flat 101, Galaxy Tower",
      area: "Bodakdev",
      landmark: "Near Hub",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380054",
      type: "Home",
      isDefault: true,
    }),
  });
  assert.strictEqual(addAddr1.status, 201, "Address 1 added");
  assert.strictEqual(addAddr1.data.address.isDefault, true, "First address is default");
  state.addr1Id = addAddr1.data.address._id;

  // 1b. Add Address 2 (Work)
  const addAddr2 = await api("/users/addresses", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.customerToken}` },
    body: JSON.stringify({
      fullName: "Customer Nine Work",
      phone: "+91 9999988888",
      houseFlat: "Level 4, Tech Park",
      area: "Vastrapur",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380015",
      type: "Work",
      isDefault: false,
    }),
  });
  assert.strictEqual(addAddr2.status, 201, "Address 2 added");
  state.addr2Id = addAddr2.data.address._id;

  // 1c. Set Address 2 as Default
  const setDefaultRes = await api(`/users/addresses/${state.addr2Id}/default`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.customerToken}` },
  });
  assert.strictEqual(setDefaultRes.status, 200, "Set default address succeeds");
  assert.strictEqual(setDefaultRes.data.address.isDefault, true, "Address 2 is now default");

  // Verify Address 1 is no longer default
  const listAddrRes = await api("/users/addresses", {
    headers: { Authorization: `Bearer ${state.customerToken}` },
  });
  assert.strictEqual(listAddrRes.status, 200, "List addresses succeeds");
  assert.strictEqual(listAddrRes.data.addresses.length, 2, "2 addresses saved");
  const a1 = listAddrRes.data.addresses.find((a) => a._id === state.addr1Id);
  const a2 = listAddrRes.data.addresses.find((a) => a._id === state.addr2Id);
  assert.strictEqual(a1.isDefault, false, "Address 1 default cleared");
  assert.strictEqual(a2.isDefault, true, "Address 2 default set");

  // 1d. Edit Address 1
  const editAddrRes = await api(`/users/addresses/${state.addr1Id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${state.customerToken}` },
    body: JSON.stringify({
      houseFlat: "Penthouse 1001, Galaxy Tower",
    }),
  });
  assert.strictEqual(editAddrRes.status, 200, "Address 1 updated");
  assert.strictEqual(editAddrRes.data.address.houseFlat, "Penthouse 1001, Galaxy Tower", "Edited field matches");

  // 1e. Delete Address 2
  const delAddrRes = await api(`/users/addresses/${state.addr2Id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${state.customerToken}` },
  });
  assert.strictEqual(delAddrRes.status, 200, "Address 2 deleted");
  console.log("  [PASS] Address CRUD operations verified with MongoDB persistence\n");

  // --------------------------------------------------------------------------
  // TEST 2: Favorites (Favorite, Unfavorite, List)
  // --------------------------------------------------------------------------
  console.log("--- TEST 2: Customer Favorites (Toggle & View) ---");
  // 2a. Favorite restaurant
  const favOnRes = await api("/favorites/toggle", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.customerToken}` },
    body: JSON.stringify({ restaurantId: state.restaurantId }),
  });
  assert.strictEqual(favOnRes.status, 200, "Favorite toggle ON succeeds");
  assert.strictEqual(favOnRes.data.isFavorite, true, "isFavorite is true");

  // 2b. View favorites
  const viewFavRes = await api("/favorites", {
    headers: { Authorization: `Bearer ${state.customerToken}` },
  });
  assert.strictEqual(viewFavRes.status, 200, "Get favorites succeeds");
  assert(viewFavRes.data.favorites.some((f) => f.restaurant?._id === state.restaurantId), "Restaurant found in favorites");

  // 2c. Unfavorite restaurant
  const favOffRes = await api("/favorites/toggle", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.customerToken}` },
    body: JSON.stringify({ restaurantId: state.restaurantId }),
  });
  assert.strictEqual(favOffRes.status, 200, "Favorite toggle OFF succeeds");
  assert.strictEqual(favOffRes.data.isFavorite, false, "isFavorite is false");
  console.log("  [PASS] Favorites persisted and verified in MongoDB\n");

  // --------------------------------------------------------------------------
  // TEST 3: Backend Coupon Validation & Edge Cases
  // --------------------------------------------------------------------------
  console.log("--- TEST 3: Coupon Backend Validation ---");
  // 3a. Validate active coupon BITEGO50
  const validCouponRes = await api("/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code: "BITEGO50", cartTotal: 500 }),
  });
  assert.strictEqual(validCouponRes.status, 200, "Valid coupon validation succeeds");
  assert(validCouponRes.data.coupon.discountAmount > 0, "Discount amount computed by backend");

  // 3b. Coupon below minimum order
  const minOrderFail = await api("/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code: "BITEGO50", cartTotal: 50 }),
  });
  assert.strictEqual(minOrderFail.status, 400, "Below minimum order amount rejected");

  // 3c. Invalid coupon code
  const invalidCode = await api("/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code: "NON_EXISTENT_CODE", cartTotal: 500 }),
  });
  assert.strictEqual(invalidCode.status, 404, "Invalid code returns 404");
  console.log("  [PASS] Coupon backend validation logic verified\n");

  // --------------------------------------------------------------------------
  // TEST 4: Real-World Payments (COD vs Online & Lifecycle States)
  // --------------------------------------------------------------------------
  console.log("--- TEST 4: Payment States & Server Verification ---");
  // 4a. Order 1: Cash on Delivery (COD) -> PENDING initially
  const codOrderRes = await api("/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.customerToken}` },
    body: JSON.stringify({
      restaurantId: state.restaurantId,
      items: [{ menuItemId: state.dishId, name: "Truffle Mushroom Risotto", price: 390, quantity: 1 }],
      addressId: state.addr1Id,
      paymentMethod: "COD",
    }),
  });
  assert.strictEqual(codOrderRes.status, 201, "COD Order placed");
  assert.strictEqual(codOrderRes.data.order.paymentStatus, "PENDING", "COD payment status is PENDING");
  state.codOrderId = codOrderRes.data.order._id;
  state.codOtp = codOrderRes.data.order.orderOtp;

  // 4b. Order 2: Online Payment -> Server marks SUCCESS with gateway reference
  const onlineOrderRes = await api("/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.customerToken}` },
    body: JSON.stringify({
      restaurantId: state.restaurantId,
      items: [{ menuItemId: state.dishId, name: "Truffle Mushroom Risotto", price: 390, quantity: 1 }],
      addressId: state.addr1Id,
      paymentMethod: "Online",
    }),
  });
  assert.strictEqual(onlineOrderRes.status, 201, "Online Order placed");
  assert.strictEqual(onlineOrderRes.data.order.paymentStatus, "SUCCESS", "Online payment verified as SUCCESS");
  assert(onlineOrderRes.data.order.paymentDetails.transactionId, "Server-generated transaction ID attached");
  state.onlineOrderId = onlineOrderRes.data.order._id;

  // 4c. Cancellation of paid Online order -> Payment state flips to REFUNDED
  const cancelOnline = await api(`/orders/${state.onlineOrderId}/cancel`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.customerToken}` },
    body: JSON.stringify({ reason: "Duplicate order placed" }),
  });
  assert.strictEqual(cancelOnline.status, 200, "Online order cancelled");
  assert.strictEqual(cancelOnline.data.order.paymentStatus, "REFUNDED", "Payment status updated to REFUNDED");
  assert(cancelOnline.data.order.paymentDetails.refundedAt, "Refund timestamp recorded");
  console.log("  [PASS] Payment states PENDING, SUCCESS, and REFUNDED verified\n");

  // --------------------------------------------------------------------------
  // TEST 5: Cross-Role Notifications Ledger
  // --------------------------------------------------------------------------
  console.log("--- TEST 5: Cross-Role Notifications ---");
  // 5a. Check Customer Notifications (Has ORDER_PLACED and ORDER_CANCELLED)
  const custNotifsRes = await api("/notifications", {
    headers: { Authorization: `Bearer ${state.customerToken}` },
  });
  assert.strictEqual(custNotifsRes.status, 200, "Customer notifications fetched");
  assert(custNotifsRes.data.notifications.length >= 2, "Customer has notification records");
  const hasPlaced = custNotifsRes.data.notifications.some((n) => n.type === "ORDER_PLACED");
  const hasCancelled = custNotifsRes.data.notifications.some((n) => n.type === "ORDER_CANCELLED");
  assert(hasPlaced, "Customer has ORDER_PLACED notification");
  assert(hasCancelled, "Customer has ORDER_CANCELLED notification");

  // 5b. Check Merchant Notifications (Has NEW_ORDER)
  const merchNotifsRes = await api("/notifications", {
    headers: { Authorization: `Bearer ${state.merchantToken}` },
  });
  assert.strictEqual(merchNotifsRes.status, 200, "Merchant notifications fetched");
  const hasNewOrder = merchNotifsRes.data.notifications.some((n) => n.type === "NEW_ORDER");
  assert(hasNewOrder, "Merchant has NEW_ORDER notification");

  // 5c. Check Admin Notifications (Has NEW_MERCHANT_APPLICATION & NEW_DELIVERY_APPLICATION)
  const adminNotifsRes = await api("/notifications", {
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  assert.strictEqual(adminNotifsRes.status, 200, "Admin notifications fetched");
  const hasMerchApp = adminNotifsRes.data.notifications.some((n) => n.type === "NEW_MERCHANT_APPLICATION");
  const hasDelivApp = adminNotifsRes.data.notifications.some((n) => n.type === "NEW_DELIVERY_APPLICATION");
  assert(hasMerchApp, "Admin has NEW_MERCHANT_APPLICATION notification");
  assert(hasDelivApp, "Admin has NEW_DELIVERY_APPLICATION notification");

  // 5d. Mark single notification as read & mark all as read
  const sampleNotifId = custNotifsRes.data.notifications[0]._id;
  const readRes = await api(`/notifications/${sampleNotifId}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.customerToken}` },
  });
  assert.strictEqual(readRes.status, 200, "Mark notification read succeeds");
  assert.strictEqual(readRes.data.notification.isRead, true, "isRead updated to true");

  const readAllRes = await api("/notifications/read-all", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.customerToken}` },
  });
  assert.strictEqual(readAllRes.status, 200, "Mark all notifications read succeeds");
  console.log("  [PASS] Cross-role notifications dispatched and marked read\n");

  // --------------------------------------------------------------------------
  // TEST 6: Customer Reviews & Dynamic Restaurant Rating Update
  // --------------------------------------------------------------------------
  console.log("--- TEST 6: Reviews & Dynamic Rating Recalculation ---");
  // Progress COD order to DELIVERED
  await api(`/merchant/orders/${state.codOrderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({ status: "CONFIRMED" }),
  });
  await api(`/merchant/orders/${state.codOrderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({ status: "PREPARING" }),
  });
  await api(`/merchant/orders/${state.codOrderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({ status: "READY_FOR_PICKUP" }),
  });
  await api(`/delivery/orders/${state.codOrderId}/accept`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
  });
  await api(`/delivery/orders/${state.codOrderId}/pickup`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
  });
  await api(`/delivery/orders/${state.codOrderId}/out-for-delivery`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
  });
  // Handover & verify OTP -> flushes paymentStatus to SUCCESS
  const deliveredCod = await api(`/delivery/orders/${state.codOrderId}/verify-otp`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
    body: JSON.stringify({ otp: state.codOtp }),
  });
  assert.strictEqual(deliveredCod.status, 200, "COD Order delivered");
  assert.strictEqual(deliveredCod.data.order.paymentStatus, "SUCCESS", "COD paymentStatus flipped to SUCCESS on delivery");

  // 6a. Submit Review (5 stars)
  const submitReviewRes = await api(`/orders/${state.codOrderId}/review`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.customerToken}` },
    body: JSON.stringify({
      rating: 5,
      restaurantRating: 5,
      courierRating: 5,
      reviewText: "Incredible risotto! Delivery was prompt and courteous.",
    }),
  });
  assert.strictEqual(submitReviewRes.status, 200, "Review submitted");

  // 6b. Duplicate review prevented
  const duplicateReview = await api(`/orders/${state.codOrderId}/review`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.customerToken}` },
    body: JSON.stringify({ rating: 4, reviewText: "Trying to submit again" }),
  });
  assert.strictEqual(duplicateReview.status, 400, "Duplicate review rejected with 400");

  // 6c. Verify Restaurant dynamic rating in MongoDB
  const restRes = await api(`/restaurants/${state.restaurantId}`);
  assert.strictEqual(restRes.status, 200, "Restaurant fetched");
  assert.strictEqual(restRes.data.restaurant.rating, 5, "Restaurant dynamic rating updated to 5.0 in MongoDB");
  assert(restRes.data.restaurant.numRatings >= 1, "numRatings incremented in MongoDB");
  console.log("  [PASS] Review saved, duplicate blocked, and restaurant rating updated in MongoDB\n");

  console.log("==================================================================");
  console.log(" ALL PHASE 9: REAL-WORLD FEATURES PASSED (100% SUCCESS) ");
  console.log("==================================================================");
}

runTests().catch((err) => {
  console.error("\nPhase 9 Test Failed:", err);
  process.exit(1);
});
