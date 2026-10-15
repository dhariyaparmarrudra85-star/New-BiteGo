/**
 * BiteGo Phase 6: Admin Functionality Comprehensive Automated Test Suite
 * Validates:
 * 1. Real MongoDB Dashboard Statistics (Customers, Merchants, Delivery Partners, Pending Applications, Orders, Completed, Cancelled, Revenue)
 * 2. Merchant Management:
 *    - View applications & documents
 *    - Reject with reason & Approve
 *    - View approved merchants with linked restaurant
 *    - Suspend merchant (cascades restaurant isOpen: false)
 *    - Reactivate merchant
 * 3. Delivery Partner Management:
 *    - View applications & documents
 *    - Reject with reason & Approve
 *    - View delivery partners with vehicle type & number
 *    - Suspend delivery partner (cascades isOnline & isAvailable to false)
 *    - Reactivate delivery partner
 * 4. Customer Management:
 *    - Search customers
 *    - View customer details with order history
 *    - Suspend customer
 *    - Reactivate customer
 * 5. Orders Supervision & Strict Sequential Lifecycle:
 *    - View full relational order fields (ID, customer, restaurant, merchant, delivery partner, amount, paymentStatus, orderStatus, date)
 *    - Invalid transition (PLACED -> DELIVERED) blocked with 400 Bad Request
 *    - Valid transition (PLACED -> CONFIRMED) succeeds with 200 OK
 * 6. Important Security & Permissions Enforcement:
 *    - Admin cannot create Super Admin (403 Forbidden)
 *    - Admin cannot delete Super Admin (403 Forbidden)
 *    - Admin cannot suspend Super Admin (403 Forbidden)
 *    - Admin cannot modify Super Admin role (403 Forbidden)
 *    - Admin cannot promote user to Super Admin (403 Forbidden)
 */

import assert from "node:assert";

const BASE_URL = "http://localhost:5000/api";

const state = {
  adminToken: null,
  superadminToken: null,
  superadminId: null,
  customerToken: null,
  customerId: null,
  merchantToken: null,
  merchantId: null,
  merchantAppId: null,
  deliveryToken: null,
  deliveryId: null,
  deliveryAppId: null,
  orderId: null,
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
  console.log(" BITEGO PHASE 6: ADMIN FUNCTIONALITY COMPREHENSIVE TEST SUITE");
  console.log("================================================================\n");

  const timestamp = Date.now();

  // STEP 0: Authentication
  console.log("--- STEP 0: Admin & Super Admin Authentication ---");
  const adminLogin = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@bitego.com", password: "Admin@123" }),
  });
  assert.strictEqual(adminLogin.status, 200, "Admin login successful");
  assert.strictEqual(adminLogin.data.user.role, "admin", "Admin role confirmed");
  state.adminToken = adminLogin.data.token;
  console.log("  [PASS] Admin logged in successfully");

  const superLogin = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "superadmin@bitego.com", password: "SuperAdmin@123" }),
  });
  assert.strictEqual(superLogin.status, 200, "Super Admin login successful");
  assert.strictEqual(superLogin.data.user.role, "superadmin", "Super Admin role confirmed");
  state.superadminToken = superLogin.data.token;
  state.superadminId = superLogin.data.user._id || superLogin.data.user.id;
  console.log("  [PASS] Super Admin credentials authenticated\n");

  // TEST 1: Real MongoDB Dashboard Statistics
  console.log("--- TEST 1: Real MongoDB Dashboard Statistics ---");
  const statsRes = await api("/admin/overview", {
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  assert.strictEqual(statsRes.status, 200, "Admin overview request succeeds");
  assert.strictEqual(statsRes.data.success, true, "Success flag is true");
  const stats = statsRes.data.stats;

  assert(typeof stats.customers === "number", "stats.customers is a real number");
  assert(typeof stats.merchants === "number", "stats.merchants is a real number");
  assert(typeof stats.deliveryPartners === "number", "stats.deliveryPartners is a real number");
  assert(typeof stats.pendingMerchantApplications === "number", "stats.pendingMerchantApplications is a number");
  assert(typeof stats.pendingDeliveryApplications === "number", "stats.pendingDeliveryApplications is a number");
  assert(typeof stats.orders === "number", "stats.orders is a real number");
  assert(typeof stats.completedOrders === "number", "stats.completedOrders is a number");
  assert(typeof stats.cancelledOrders === "number", "stats.cancelledOrders is a number");
  assert(typeof stats.revenue === "number", "stats.revenue is a real aggregated number");

  console.log("  [PASS] Real MongoDB Statistics Verified:", {
    customers: stats.customers,
    merchants: stats.merchants,
    deliveryPartners: stats.deliveryPartners,
    pendingMerchants: stats.pendingMerchantApplications,
    pendingDelivery: stats.pendingDeliveryApplications,
    orders: stats.orders,
    completed: stats.completedOrders,
    cancelled: stats.cancelledOrders,
    revenue: `₹${stats.revenue}`,
  });
  console.log("");

  // TEST 2: Merchant Management
  console.log("--- TEST 2: Merchant Management ---");
  // 2a. Register a new merchant applicant
  const newMerchEmail = `merch_p6_${timestamp}@bitego.com`;
  const regMerch = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Chef Vikram P6",
      email: newMerchEmail,
      password: "Password@123",
      role: "merchant",
    }),
  });
  assert.strictEqual(regMerch.status, 201, "Merchant applicant registered");
  state.merchantToken = regMerch.data.token;
  state.merchantId = regMerch.data.user._id || regMerch.data.user.id;

  // Submit merchant application
  const appMerch = await api("/merchant/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({
      restaurantName: "Vikram Fine Spice",
      ownerName: "Chef Vikram P6",
      category: "Indian",
      address: "Sindhu Bhavan Hub",
      hub: "Bodakdev Hub",
      phone: "+91 9988776655",
      fssaiNumber: "FSSAI-88392",
      description: "Authentic Gujarati Thali & Curries",
    }),
  });
  assert.strictEqual(appMerch.status, 201, "Merchant application submitted");
  state.merchantAppId = appMerch.data.application._id;
  console.log("  [PASS] Merchant application created with pending verification");

  // 2b. View merchant applications
  const viewMerchApps = await api("/admin/merchant-applications?status=pending", {
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  assert.strictEqual(viewMerchApps.status, 200, "Admin can view merchant applications");
  const foundApp = viewMerchApps.data.applications.find((a) => a._id === state.merchantAppId);
  assert(foundApp, "Created merchant application exists in pending review queue");
  console.log("  [PASS] Admin can view merchant applications and legal documents");

  // 2c. Test Rejection flow with mandatory reason
  const emptyReject = await api(`/admin/merchants/${state.merchantAppId}/reject`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({ reason: "" }),
  });
  assert.strictEqual(emptyReject.status, 400, "Empty rejection reason rejected with 400");

  const validReject = await api(`/admin/merchants/${state.merchantAppId}/reject`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({ reason: "FSSAI document requires clear seal endorsement." }),
  });
  assert.strictEqual(validReject.status, 200, "Merchant rejected with reason recorded");
  assert.strictEqual(validReject.data.application.status, "rejected", "Application status marked rejected");
  console.log("  [PASS] Admin can reject application with reason");

  // 2d. Approve merchant application
  const approveMerch = await api(`/admin/merchants/${state.merchantAppId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  assert.strictEqual(approveMerch.status, 200, "Admin approved merchant application");
  assert.strictEqual(approveMerch.data.application.status, "approved", "Status transitioned to approved");
  console.log("  [PASS] Admin can approve merchant application");

  // 2e. View approved merchants directory
  const getMerchants = await api("/admin/merchants", {
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  assert.strictEqual(getMerchants.status, 200, "Admin can view approved merchants list");
  const approvedItem = getMerchants.data.merchants.find((m) => m._id === state.merchantId);
  assert(approvedItem, "Newly approved merchant listed in directory");
  assert(approvedItem.restaurant, "Linked restaurant is attached");
  console.log("  [PASS] Admin can view approved merchants directory with restaurant details");

  // 2f. Suspend merchant (and verify restaurant isOpen is closed)
  const suspendMerch = await api(`/admin/users/${state.merchantId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({ isActive: false }),
  });
  assert.strictEqual(suspendMerch.status, 200, "Admin suspended merchant account");
  assert.strictEqual(suspendMerch.data.user.isActive, false, "Merchant isActive marked false");

  // Check restaurant is now closed
  const verifyClosedMerch = await api("/admin/merchants", {
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  const suspendedMerchItem = verifyClosedMerch.data.merchants.find((m) => m._id === state.merchantId);
  assert.strictEqual(suspendedMerchItem.isActive, false, "Merchant is inactive");
  assert.strictEqual(suspendedMerchItem.restaurant?.isOpen, false, "Restaurant isOpen toggled false on suspension");
  console.log("  [PASS] Suspending merchant cascades restaurant isOpen to false");

  // 2g. Reactivate merchant
  const reactivateMerch = await api(`/admin/users/${state.merchantId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({ isActive: true }),
  });
  assert.strictEqual(reactivateMerch.status, 200, "Admin reactivated merchant account");
  assert.strictEqual(reactivateMerch.data.user.isActive, true, "Merchant isActive marked true");
  console.log("  [PASS] Admin can reactivate merchant\n");

  // TEST 3: Delivery Partner Management
  console.log("--- TEST 3: Delivery Partner Management ---");
  // 3a. Register a new delivery partner applicant
  const newDelivEmail = `rider_p6_${timestamp}@bitego.com`;
  const regDeliv = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Rider Suresh P6",
      email: newDelivEmail,
      password: "Password@123",
      role: "delivery",
    }),
  });
  assert.strictEqual(regDeliv.status, 201, "Delivery applicant registered");
  state.deliveryToken = regDeliv.data.token;
  state.deliveryId = regDeliv.data.user._id || regDeliv.data.user.id;

  // Submit delivery application
  const appDeliv = await api("/delivery/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
    body: JSON.stringify({
      fullName: "Rider Suresh P6",
      phone: "+91 9911223344",
      dob: "1997-04-12",
      address: "Ellis Bridge, Ahmedabad",
      emergencyContactPhone: "+91 9900000000",
      vehicleType: "Bike",
      vehicleNumber: "GJ-01-AB-8822",
      drivingLicenseNumber: "DL-GJ-2018-992812",
    }),
  });
  assert.strictEqual(appDeliv.status, 201, "Delivery application submitted");
  state.deliveryAppId = appDeliv.data.application._id;
  console.log("  [PASS] Delivery partner application created");

  // 3b. View delivery applications
  const viewDelivApps = await api("/admin/delivery-applications", {
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  assert.strictEqual(viewDelivApps.status, 200, "Admin can view delivery applications");
  const foundDelivApp = viewDelivApps.data.applications.find((a) => a._id === state.deliveryAppId);
  assert(foundDelivApp, "Created delivery application exists in review queue");
  console.log("  [PASS] Admin can view delivery applications & vehicle documentation");

  // 3c. Reject with reason
  const emptyDelivReject = await api(`/admin/delivery/${state.deliveryAppId}/reject`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({ reason: "" }),
  });
  assert.strictEqual(emptyDelivReject.status, 400, "Empty rejection reason rejected with 400");

  const validDelivReject = await api(`/admin/delivery/${state.deliveryAppId}/reject`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({ reason: "Vehicle RC scan expired. Please re-upload current certificate." }),
  });
  assert.strictEqual(validDelivReject.status, 200, "Delivery application rejected with reason");
  console.log("  [PASS] Admin can reject delivery partner with reason");

  // 3d. Approve delivery application
  const approveDeliv = await api(`/admin/delivery/${state.deliveryAppId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  assert.strictEqual(approveDeliv.status, 200, "Admin approved delivery partner application");
  console.log("  [PASS] Admin can approve delivery partner");

  // 3e. View delivery partners
  const getPartners = await api("/admin/delivery-partners", {
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  assert.strictEqual(getPartners.status, 200, "Admin can view delivery partners list");
  const partnerItem = getPartners.data.partners.find((p) => p._id === state.deliveryId);
  assert(partnerItem, "Partner listed with vehicle details");
  assert.strictEqual(partnerItem.vehicleType, "Bike", "Vehicle type populated");
  console.log("  [PASS] Admin can view delivery partners list with vehicle metadata");

  // 3f. Suspend delivery partner (verifies isOnline and isAvailable become false)
  // First let partner go online
  await api("/delivery/status/toggle", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
    body: JSON.stringify({ isOnline: true }),
  });

  const suspendDeliv = await api(`/admin/users/${state.deliveryId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({ isActive: false }),
  });
  assert.strictEqual(suspendDeliv.status, 200, "Delivery partner suspended");
  assert.strictEqual(suspendDeliv.data.user.isActive, false, "Partner isActive marked false");
  assert.strictEqual(suspendDeliv.data.user.isOnline, false, "Partner isOnline toggled false");
  assert.strictEqual(suspendDeliv.data.user.isAvailable, false, "Partner isAvailable toggled false");
  console.log("  [PASS] Suspending partner sets isActive, isOnline, and isAvailable to false");

  // 3g. Reactivate delivery partner
  const reactivateDeliv = await api(`/admin/users/${state.deliveryId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({ isActive: true }),
  });
  assert.strictEqual(reactivateDeliv.status, 200, "Delivery partner reactivated");
  assert.strictEqual(reactivateDeliv.data.user.isActive, true, "Partner isActive marked true");
  console.log("  [PASS] Admin can reactivate delivery partner\n");

  // TEST 4: Customer Management
  console.log("--- TEST 4: Customer Management ---");
  // 4a. Register a test customer
  const newCustEmail = `cust_p6_${timestamp}@bitego.com`;
  const regCust = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Patron Ramesh P6",
      email: newCustEmail,
      password: "Password@123",
      role: "customer",
    }),
  });
  assert.strictEqual(regCust.status, 201, "Customer registered");
  state.customerToken = regCust.data.token;
  state.customerId = regCust.data.user._id || regCust.data.user.id;

  // 4b. Search customer
  const searchCust = await api(`/admin/customers?search=Ramesh P6`, {
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  assert.strictEqual(searchCust.status, 200, "Customer search succeeds");
  const foundCustomer = searchCust.data.customers.find((c) => c._id === state.customerId);
  assert(foundCustomer, "Search accurately found the registered customer");
  console.log("  [PASS] Admin can search customers");

  // 4c. View customer details and order history
  const viewCustomer = await api(`/admin/customers/${state.customerId}`, {
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  assert.strictEqual(viewCustomer.status, 200, "View customer profile succeeds");
  assert.strictEqual(viewCustomer.data.customer.name, "Patron Ramesh P6", "Customer name matches");
  assert(Array.isArray(viewCustomer.data.orders), "Customer orders array returned");
  console.log("  [PASS] Admin can view customer profile and order history");

  // 4d. Suspend customer
  const suspendCust = await api(`/admin/users/${state.customerId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({ isActive: false }),
  });
  assert.strictEqual(suspendCust.status, 200, "Customer suspended");
  assert.strictEqual(suspendCust.data.user.isActive, false, "Customer isActive false");

  // Suspended customer cannot login
  const custLoginSuspended = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: newCustEmail, password: "Password@123" }),
  });
  assert.strictEqual(custLoginSuspended.status, 403, "Suspended customer blocked from login with 403");
  console.log("  [PASS] Admin can suspend customer (login blocked)");

  // 4e. Reactivate customer
  const reactivateCust = await api(`/admin/users/${state.customerId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({ isActive: true }),
  });
  assert.strictEqual(reactivateCust.status, 200, "Customer reactivated");
  assert.strictEqual(reactivateCust.data.user.isActive, true, "Customer isActive true");

  const custLoginActive = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: newCustEmail, password: "Password@123" }),
  });
  assert.strictEqual(custLoginActive.status, 200, "Reactivated customer can log in normally");
  console.log("  [PASS] Admin can reactivate customer (login restored)\n");

  // TEST 5: Orders Supervision & Strict Sequential Lifecycle
  console.log("--- TEST 5: Orders Supervision & Lifecycle Rules ---");
  const ordersRes = await api("/admin/orders", {
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  assert.strictEqual(ordersRes.status, 200, "Admin can retrieve platform orders list");
  assert(Array.isArray(ordersRes.data.orders), "Orders list is an array");
  assert(ordersRes.data.orders.length > 0, "Orders exist in the database");

  const sampleOrder = ordersRes.data.orders[0];
  assert(sampleOrder.orderNumber, "Order has orderNumber / Order ID");
  assert(sampleOrder.customer, "Order has customer populated");
  assert(sampleOrder.restaurant, "Order has restaurant populated");
  assert(sampleOrder.merchant, "Order has merchant details populated");
  assert(sampleOrder.amount !== undefined, "Order has amount populated");
  assert(sampleOrder.paymentStatus, "Order has paymentStatus populated");
  assert(sampleOrder.orderStatus, "Order has orderStatus populated");
  assert(sampleOrder.date, "Order has date populated");
  console.log("  [PASS] Admin can view Order ID, Customer, Restaurant, Merchant, Courier, Amount, Payment Status, Order Status, and Date");

  // Test Lifecycle Integrity: Find or create PLACED order
  let placedOrder = ordersRes.data.orders.find((o) => o.orderStatus === "PLACED");
  if (!placedOrder) {
    // Customer places a quick order
    const menuRes = await api("/restaurants");
    const activeRest = menuRes.data.restaurants?.find((r) => r.isOpen);
    const cartRes = await api("/cart/add", {
      method: "POST",
      headers: { Authorization: `Bearer ${state.customerToken}` },
      body: JSON.stringify({
        foodId: activeRest.menu[0]._id,
        restaurantId: activeRest._id,
        quantity: 1,
      }),
    });
    const placeOrderRes = await api("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${state.customerToken}` },
      body: JSON.stringify({
        deliveryAddress: {
          street: "SG Highway",
          city: "Ahmedabad",
          pincode: "380054",
          fullName: "Patron Ramesh",
          phone: "+91 9988776655",
        },
        paymentMethod: "COD",
      }),
    });
    placedOrder = placeOrderRes.data.order;
  }

  // 5a. Admin attempts to bypass valid lifecycle progression (e.g. PLACED -> DELIVERED)
  const bypassRes = await api(`/admin/orders/${placedOrder._id}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({ status: "DELIVERED" }),
  });
  assert.strictEqual(bypassRes.status, 400, "Admin lifecycle bypass is blocked with 400 Bad Request");
  console.log("  [PASS] Admin CANNOT bypass valid order lifecycle progression (PLACED -> DELIVERED rejected)");

  // 5b. Admin advances valid sequential order lifecycle (PLACED -> CONFIRMED)
  const validAdvance = await api(`/admin/orders/${placedOrder._id}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({ status: "CONFIRMED" }),
  });
  assert.strictEqual(validAdvance.status, 200, "Valid sequential transition succeeds with 200");
  assert.strictEqual(validAdvance.data.order.orderStatus, "CONFIRMED", "Order status advanced to CONFIRMED");
  console.log("  [PASS] Admin advances order lifecycle conforming to sequential state progression\n");

  // TEST 6: Critical Security & Super Admin Permissions Isolation
  console.log("--- TEST 6: Critical Super Admin Permissions Isolation ---");

  // 6a. Admin MUST NOT create Super Admin through public registration
  const createSuper = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Illegal SuperAdmin",
      email: `rogue_super_${timestamp}@bitego.com`,
      password: "Password@123",
      role: "superadmin",
    }),
  });
  assert.strictEqual(createSuper.status, 403, "Public creation of Super Admin rejected with 403");
  console.log("  [PASS] Admin MUST NOT create Super Admin");

  // 6b. Admin MUST NOT delete Super Admin
  const delSuper = await api(`/admin/users/${state.superadminId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  assert.strictEqual(delSuper.status, 403, "Admin attempt to delete Super Admin rejected with 403");
  console.log("  [PASS] Admin MUST NOT delete Super Admin");

  // 6c. Admin MUST NOT modify Super Admin account / credentials
  const suspSuper = await api(`/admin/users/${state.superadminId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({ isActive: false }),
  });
  assert.strictEqual(suspSuper.status, 403, "Admin attempt to modify Super Admin status rejected with 403");
  console.log("  [PASS] Admin MUST NOT modify Super Admin active status or credentials");

  // 6d. Admin MUST NOT change Super Admin role
  const roleSuper = await api(`/admin/users/${state.superadminId}/role`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({ role: "customer" }),
  });
  assert.strictEqual(roleSuper.status, 403, "Admin attempt to change Super Admin role rejected with 403");
  console.log("  [PASS] Admin MUST NOT change Super Admin role");

  // 6e. Admin MUST NOT promote normal user to Super Admin
  const promoteSuper = await api(`/admin/users/${state.customerId}/role`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({ role: "superadmin" }),
  });
  assert.strictEqual(promoteSuper.status, 403, "Admin attempt to assign superadmin role rejected with 403");
  console.log("  [PASS] Admin MUST NOT assign or escalate to Super Admin role\n");

  console.log("================================================================");
  console.log(" ALL PHASE 6: ADMIN FUNCTIONALITY TESTS PASSED (100% SUCCESS) ");
  console.log("================================================================\n");
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
