import dotenv from "dotenv";
dotenv.config();

const BASE_URL = "http://localhost:5000";

const assert = (condition, message) => {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  [PASS] ${message}`);
};

async function runPhase3Tests() {
  console.log("================================================================");
  console.log(" BITEGO PHASE 3: COMPLETE CUSTOMER LIFECYCLE TEST SUITE");
  console.log("================================================================\n");

  const timestamp = Date.now();

  // 1. REGISTRATION & LOGIN
  console.log("1. Customer Account Registration & Authentication");
  const custEmail = `shopper_${timestamp}@bitego.com`;
  const originalPassword = "Shopper@123";

  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Rudra Customer",
      email: custEmail,
      password: originalPassword,
      phone: "+91 98980 99887",
      role: "customer",
    }),
  });
  const regData = await regRes.json();
  assert(regRes.status === 201 && regData.token, "Customer registered successfully");
  let customerToken = regData.token;

  // Verify /api/auth/me
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const meData = await meRes.json();
  assert(meRes.ok && meData.user.email === custEmail, "Current user profile verified from MongoDB");

  // 2. HOME BROWSING & CATEGORIES
  console.log("\n2. Home Browsing, Categories & Trending Dishes");
  // 2a. Live categories
  const catRes = await fetch(`${BASE_URL}/api/restaurants/categories`);
  const catData = await catRes.json();
  assert(
    catRes.ok && Array.isArray(catData.categories) && catData.categories.length > 0,
    `Retrieved ${catData.categories?.length} distinct food categories from database`
  );

  // 2b. Live restaurants list
  const restRes = await fetch(`${BASE_URL}/api/restaurants`);
  const restData = await restRes.json();
  assert(
    restRes.ok && Array.isArray(restData.restaurants) && restData.restaurants.length > 0,
    `Retrieved ${restData.restaurants?.length} active restaurants from database`
  );
  const targetRestaurant = restData.restaurants[0];

  // 2c. Trending dishes
  const trendRes = await fetch(`${BASE_URL}/api/restaurants/trending-dishes`);
  const trendData = await trendRes.json();
  assert(
    trendRes.ok && Array.isArray(trendData.dishes) && trendData.dishes.length > 0,
    `Retrieved ${trendData.dishes?.length} trending dishes across popular restaurants`
  );

  // 3. SEARCH & FILTERS
  console.log("\n3. Backend-Powered Search & Filters");
  // 3a. Search by keyword
  const searchRes = await fetch(`${BASE_URL}/api/restaurants/search?q=pizza`);
  const searchData = await searchRes.json();
  assert(
    searchRes.ok &&
      Array.isArray(searchData.restaurants) &&
      Array.isArray(searchData.dishes) &&
      searchData.dishes.length > 0,
    `Search for 'pizza' found ${searchData.restaurants.length} restaurants and ${searchData.dishes.length} dishes`
  );

  // 3b. Filter by Pure Veg
  const vegRes = await fetch(`${BASE_URL}/api/restaurants?isPureVeg=true`);
  const vegData = await vegRes.json();
  assert(
    vegRes.ok && vegData.restaurants.every((r) => r.isPureVeg || r.type === "Pure Veg"),
    "Filter by 'isPureVeg=true' returned strictly vegetarian restaurants"
  );

  // 3c. Sort by rating
  const sortRes = await fetch(`${BASE_URL}/api/restaurants?sortBy=rating-desc`);
  const sortData = await sortRes.json();
  assert(
    sortRes.ok && sortData.restaurants[0].rating >= sortData.restaurants[sortData.restaurants.length - 1].rating,
    "Sort by 'rating-desc' ordered restaurants correctly"
  );

  // 4. RESTAURANT DETAILS & MENU
  console.log("\n4. Restaurant Details & Menu Inspection");
  const detailRes = await fetch(`${BASE_URL}/api/restaurants/${targetRestaurant._id}`);
  const detailData = await detailRes.json();
  assert(detailRes.ok && detailData.restaurant._id === targetRestaurant._id, "Fetched restaurant details");

  const menuRes = await fetch(`${BASE_URL}/api/restaurants/${targetRestaurant._id}/menu`);
  const menuData = await menuRes.json();
  assert(
    menuRes.ok && Array.isArray(menuData.menu) && menuData.menu.length > 0,
    `Menu loaded with ${menuData.menu.length} categories and ${menuData.totalItems} total dishes`
  );
  const sampleDish = menuData.menu[0].items[0];
  assert(sampleDish && sampleDish.price > 0, `Sample dish selected: ${sampleDish.name} (₹${sampleDish.price})`);

  // 5. CART PERSISTENCE IN MONGODB
  console.log("\n5. Customer Cart Persistence in MongoDB");
  // 5a. Sync cart
  const cartPayload = {
    activeRestaurant: {
      id: targetRestaurant._id,
      name: targetRestaurant.name,
    },
    items: [
      {
        cartItemId: `${sampleDish._id}_plain`,
        id: sampleDish._id,
        menuItemId: sampleDish._id,
        name: sampleDish.name,
        price: sampleDish.price,
        quantity: 2,
        image: sampleDish.image,
        isVeg: sampleDish.isVeg,
        restaurant: targetRestaurant.name,
        restaurantId: targetRestaurant._id,
      },
    ],
    appliedCoupon: {
      code: "BITEGO50",
      discountType: "fixed",
      discountAmount: 100,
    },
  };

  const syncCartRes = await fetch(`${BASE_URL}/api/cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify(cartPayload),
  });
  const syncCartData = await syncCartRes.json();
  assert(syncCartRes.ok && syncCartData.success, "Cart synced and persisted to MongoDB");

  // 5b. Retrieve saved cart
  const getCartRes = await fetch(`${BASE_URL}/api/cart`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const getCartData = await getCartRes.json();
  assert(
    getCartRes.ok &&
      getCartData.cart?.items?.length === 1 &&
      getCartData.cart.items[0].quantity === 2,
    "GET /api/cart retrieved persisted cart with matching quantities"
  );

  // 5c. Clear cart
  const clearCartRes = await fetch(`${BASE_URL}/api/cart`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  assert(clearCartRes.ok, "DELETE /api/cart cleared persisted cart in MongoDB");

  // 6. ADDRESS CRUD
  console.log("\n6. Customer Address Management (CRUD)");
  // 6a. Create Address
  const addAddrRes = await fetch(`${BASE_URL}/api/users/addresses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      fullName: "Rudra Shah",
      phone: "+91 98980 99887",
      houseFlat: "A-502, Silicon Heights",
      area: "Bodakdev Core",
      landmark: "Near Pakwan Crossroad",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380054",
      type: "home",
      isDefault: true,
    }),
  });
  const addAddrData = await addAddrRes.json();
  assert(addAddrRes.status === 201 && addAddrData.address._id, "Added delivery address in MongoDB");
  const savedAddressId = addAddrData.address._id;

  // 6b. Update Address
  const updateAddrRes = await fetch(`${BASE_URL}/api/users/addresses/${savedAddressId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      houseFlat: "A-502, Silicon Heights (Tower A)",
    }),
  });
  const updateAddrData = await updateAddrRes.json();
  assert(
    updateAddrRes.ok && updateAddrData.address.houseFlat.includes("Tower A"),
    "Updated delivery address in MongoDB"
  );

  // 6c. List Addresses
  const listAddrRes = await fetch(`${BASE_URL}/api/users/addresses`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const listAddrData = await listAddrRes.json();
  assert(
    listAddrRes.ok && listAddrData.addresses?.length >= 1,
    `Listed ${listAddrData.addresses?.length} saved delivery addresses`
  );

  // 7. CHECKOUT & ORDER CREATION (SERVER-SIDE PRICE RECALCULATION)
  console.log("\n7. Checkout & Server-Side Price Verification");
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      restaurantId: targetRestaurant._id,
      items: [
        {
          menuItemId: sampleDish._id,
          name: sampleDish.name,
          quantity: 2,
        },
      ],
      addressId: savedAddressId,
      deliveryInstructions: "Leave with security reception",
      couponCode: "BITEGO50",
      paymentMethod: "UPI",
      tipAmount: 30,
    }),
  });
  const orderData = await orderRes.json();
  assert(
    orderRes.status === 201 && orderData.success && orderData.order?.orderNumber,
    `Order placed successfully: ${orderData.order?.orderNumber} (OTP: ${orderData.order?.orderOtp})`
  );
  const placedOrder = orderData.order;

  // Verify server recalculation
  const expectedSubtotal = sampleDish.price * 2;
  assert(
    placedOrder.subtotal === expectedSubtotal,
    `Server computed exact subtotal: ₹${placedOrder.subtotal} (₹${sampleDish.price} x 2)`
  );
  assert(
    placedOrder.discount > 0,
    `Coupon discount applied by backend: -₹${placedOrder.discount}`
  );
  assert(
    placedOrder.totalAmount === Number((placedOrder.subtotal + placedOrder.tax + placedOrder.deliveryFee + placedOrder.platformFee + placedOrder.tipAmount - placedOrder.discount).toFixed(2)),
    `Server strictly verified final total: ₹${placedOrder.totalAmount}`
  );

  // 8. ORDER TRACKING & LIFECYCLE
  console.log("\n8. Order Tracking & Lifecycle Progression");
  // 8a. Retrieve by orderNumber
  const trackRes = await fetch(`${BASE_URL}/api/orders/${placedOrder.orderNumber}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const trackData = await trackRes.json();
  assert(
    trackRes.ok && trackData.order.orderStatus === "PLACED",
    `Tracked order ${placedOrder.orderNumber} with initial status 'PLACED'`
  );

  // 8b. Transition through lifecycle steps (Simulated via Merchant / Delivery / Admin)
  // Login as admin to advance status
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@bitego.com", password: "Admin@123" }),
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token;

  const statuses = ["CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"];
  for (const nextStatus of statuses) {
    const statusUpdateRes = await fetch(`${BASE_URL}/api/orders/${placedOrder._id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: nextStatus, note: `Status advanced to ${nextStatus}` }),
    });
    assert(statusUpdateRes.ok, `Lifecycle advanced to ${nextStatus}`);
  }

  // 8c. Verify delivered order details
  const deliveredRes = await fetch(`${BASE_URL}/api/orders/${placedOrder._id}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const deliveredData = await deliveredRes.json();
  assert(
    deliveredRes.ok && deliveredData.order.orderStatus === "DELIVERED",
    `Order confirmed as 'DELIVERED'`
  );

  // 9. REVIEWS & DUPLICATE PREVENTION
  console.log("\n9. Reviews & Duplicate Review Prevention");
  // 9a. Submit valid review
  const reviewRes = await fetch(`${BASE_URL}/api/orders/${placedOrder._id}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      rating: 5,
      reviewText: "Phenomenal taste and piping hot delivery!",
      courierRating: 5,
    }),
  });
  const reviewData = await reviewRes.json();
  assert(reviewRes.ok && reviewData.success, "Review submitted and saved to MongoDB");

  // 9b. Attempt duplicate review (must fail)
  const dupReviewRes = await fetch(`${BASE_URL}/api/orders/${placedOrder._id}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      rating: 4,
      reviewText: "Trying to submit another review",
    }),
  });
  assert(dupReviewRes.status === 400, "Duplicate review rejected with 400 Bad Request");

  // 10. ORDER CANCELLATION RULES
  console.log("\n10. Order Cancellation Business Logic Verification");
  // 10a. Delivered order cannot be cancelled
  const cancelDeliveredRes = await fetch(`${BASE_URL}/api/orders/${placedOrder._id}/cancel`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({ reason: "Changed mind after eating" }),
  });
  assert(
    cancelDeliveredRes.status === 400,
    "Delivered order cannot be cancelled (rejected with 400)"
  );

  // 10b. Fresh placed order CAN be cancelled
  const freshOrderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      restaurantId: targetRestaurant._id,
      items: [{ menuItemId: sampleDish._id, name: sampleDish.name, quantity: 1 }],
      addressId: savedAddressId,
      paymentMethod: "COD",
    }),
  });
  const freshOrderData = await freshOrderRes.json();
  const freshOrderId = freshOrderData.order._id;

  const cancelFreshRes = await fetch(`${BASE_URL}/api/orders/${freshOrderId}/cancel`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({ reason: "Cancelled by customer within 1 minute" }),
  });
  const cancelFreshData = await cancelFreshRes.json();
  assert(
    cancelFreshRes.ok && cancelFreshData.order.orderStatus === "CANCELLED",
    `Fresh order ${freshOrderData.order.orderNumber} successfully cancelled while status was 'PLACED'`
  );

  // 11. PROFILE MANAGEMENT & PASSWORD CHANGE
  console.log("\n11. Profile Management & Password Change");
  // 11a. Update name & phone
  const updateProfRes = await fetch(`${BASE_URL}/api/users/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      name: "Rudra S. (Updated)",
      phone: "+91 99999 11111",
      city: "Ahmedabad",
    }),
  });
  const updateProfData = await updateProfRes.json();
  assert(
    updateProfRes.ok && updateProfData.user.name === "Rudra S. (Updated)",
    "Customer profile name and phone updated successfully"
  );

  // 11b. Change password
  const newPassword = "NewSecretPassword@456";
  const changePassRes = await fetch(`${BASE_URL}/api/users/change-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      currentPassword: originalPassword,
      newPassword,
    }),
  });
  const changePassData = await changePassRes.json();
  assert(changePassRes.ok && changePassData.success, "Password changed successfully via API");

  // 11c. Verify login with new password
  const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: custEmail, password: newPassword }),
  });
  const newLoginData = await newLoginRes.json();
  assert(
    newLoginRes.ok && newLoginData.token,
    "Logged in successfully using newly updated password"
  );

  // 11d. Verify old password no longer works
  const oldLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: custEmail, password: originalPassword }),
  });
  assert(oldLoginRes.status === 401, "Old password rejected with 401 Unauthorized");

  console.log("\n================================================================");
  console.log(" PHASE 3 VERIFICATION COMPLETE: ALL CUSTOMER FEATURES PASSED");
  console.log("================================================================\n");
}

runPhase3Tests().catch((err) => {
  console.error("Test Suite Failed with Error:", err);
  process.exit(1);
});
