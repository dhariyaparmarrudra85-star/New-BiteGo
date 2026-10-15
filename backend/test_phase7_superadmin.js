/**
 * BiteGo Phase 7: Super Admin Functionality Comprehensive Automated Test Suite
 * Validates:
 * 1. Super Admin Dashboard (Real MongoDB stats: customers, merchants, delivery, admins, pending apps, orders, completed, cancelled, revenue, platform activity)
 * 2. Admin Management (Create, View, Edit, Disable, Reactivate, Delete, and privilege isolation: only Super Admin can create Admin)
 * 3. User Management (Search, Filter, View, Suspend, Reactivate across all 5 roles)
 * 4. Merchant Management (View, Approve, Reject with reason, Suspend, Reactivate)
 * 5. Delivery Fleet Management (View, Approve, Reject with reason, Suspend, Reactivate)
 * 6. Orders Supervision (View all platform orders and relational details)
 * 7. Platform Settings (Delivery fee, Tax configuration, Platform commission, Service availability persisted in MongoDB)
 * 8. Audit Logging (Recorded actions: Super Admin created Admin, Admin approved Merchant, Admin rejected Delivery Partner, Super Admin suspended User, Super Admin changed settings)
 * 9. Security Gates (Admin blocked with 403 from Super Admin APIs, Admin cannot create Super Admin, normal users cannot elevate)
 */

import assert from "node:assert";

const BASE_URL = "http://localhost:5000/api";

const state = {
  superadminToken: null,
  superadminId: null,
  adminToken: null,
  adminId: null,
  testAdminId: null,
  customerToken: null,
  customerId: null,
  merchantToken: null,
  merchantId: null,
  merchantAppId: null,
  deliveryToken: null,
  deliveryId: null,
  deliveryAppId: null,
};

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { "Content-Type": "application/json", ...options.headers };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log("==================================================================");
  console.log(" BITEGO PHASE 7: SUPER ADMIN FUNCTIONALITY COMPREHENSIVE SUITE");
  console.log("==================================================================\n");

  const timestamp = Date.now();

  // STEP 0: Authentication
  console.log("--- STEP 0: Super Admin & Admin Login ---");
  const superLogin = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "superadmin@bitego.com", password: "SuperAdmin@123" }),
  });
  assert.strictEqual(superLogin.status, 200, "Super Admin login succeeds");
  assert.strictEqual(superLogin.data.user.role, "superadmin", "User role is superadmin");
  state.superadminToken = superLogin.data.token;
  state.superadminId = superLogin.data.user._id || superLogin.data.user.id;
  console.log("  [PASS] Super Admin authenticated with root privilege");

  const adminLogin = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@bitego.com", password: "Admin@123" }),
  });
  assert.strictEqual(adminLogin.status, 200, "Admin login succeeds");
  state.adminToken = adminLogin.data.token;
  state.adminId = adminLogin.data.user._id || adminLogin.data.user.id;
  console.log("  [PASS] Operational Admin authenticated\n");

  // TEST 1: Real MongoDB Statistics & Dashboard Telemetry
  console.log("--- TEST 1: Real MongoDB Platform Statistics ---");
  const overviewRes = await api("/superadmin/overview", {
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(overviewRes.status, 200, "Overview request succeeds");
  assert.strictEqual(overviewRes.data.success, true, "Success is true");
  const stats = overviewRes.data.stats;

  assert(typeof stats.totalCustomers === "number", "stats.totalCustomers is number");
  assert(typeof stats.totalMerchants === "number", "stats.totalMerchants is number");
  assert(typeof stats.totalDelivery === "number", "stats.totalDelivery is number");
  assert(typeof stats.totalAdmins === "number", "stats.totalAdmins is number");
  assert(typeof stats.pendingApplications === "number", "stats.pendingApplications is number");
  assert(typeof stats.totalOrders === "number", "stats.totalOrders is number");
  assert(typeof stats.completedOrders === "number", "stats.completedOrders is number");
  assert(typeof stats.cancelledOrders === "number", "stats.cancelledOrders is number");
  assert(typeof stats.totalRevenue === "number", "stats.totalRevenue is number");
  assert(Array.isArray(overviewRes.data.platformActivity), "platformActivity is array");

  console.log("  [PASS] Super Admin Dashboard Real Statistics:", {
    customers: stats.totalCustomers,
    merchants: stats.totalMerchants,
    delivery: stats.totalDelivery,
    admins: stats.totalAdmins,
    pendingApps: stats.pendingApplications,
    orders: stats.totalOrders,
    completed: stats.completedOrders,
    cancelled: stats.cancelledOrders,
    revenue: `₹${stats.totalRevenue}`,
    activityCount: overviewRes.data.platformActivity.length,
  });
  console.log("");

  // TEST 2: Admin Management
  console.log("--- TEST 2: Admin Management (Root-Level) ---");
  // 2a. Only Super Admin can create Admin - verify Admin attempt is rejected
  const adminAttemptCreateAdmin = await api("/superadmin/admins", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({
      name: "Rogue Admin",
      email: `rogue_admin_${timestamp}@bitego.com`,
      password: "Password@123",
    }),
  });
  assert.strictEqual(adminAttemptCreateAdmin.status, 403, "Admin cannot access Super Admin create admin API");
  console.log("  [PASS] Operational Admin CANNOT create Admin accounts (403 Forbidden)");

  // 2b. Super Admin creates Admin
  const testAdminEmail = `ops_admin_${timestamp}@bitego.com`;
  const createAdminRes = await api("/superadmin/admins", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
    body: JSON.stringify({
      name: "Ops Officer Ravi",
      email: testAdminEmail,
      password: "Password@123",
      phone: "+91 9876543210",
    }),
  });
  assert.strictEqual(createAdminRes.status, 201, "Super Admin created Admin account");
  assert.strictEqual(createAdminRes.data.admin.role, "admin", "Created account role is admin");
  state.testAdminId = createAdminRes.data.admin._id || createAdminRes.data.admin.id;
  console.log("  [PASS] Super Admin created Admin account successfully");

  // 2c. View Admin
  const viewAdminsRes = await api("/superadmin/admins", {
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(viewAdminsRes.status, 200, "View admins list succeeds");
  const foundAdmin = viewAdminsRes.data.admins.find((a) => a._id === state.testAdminId);
  assert(foundAdmin, "Newly created admin exists in directory");

  const viewSingleAdmin = await api(`/superadmin/admins/${state.testAdminId}`, {
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(viewSingleAdmin.status, 200, "View single admin succeeds");
  assert.strictEqual(viewSingleAdmin.data.admin.email, testAdminEmail, "Admin email matches");
  console.log("  [PASS] Super Admin can view all Admins and single Admin details");

  // 2d. Edit Admin
  const editAdminRes = await api(`/superadmin/admins/${state.testAdminId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
    body: JSON.stringify({
      name: "Senior Ops Ravi",
      phone: "+91 9999888877",
    }),
  });
  assert.strictEqual(editAdminRes.status, 200, "Super Admin edited Admin account");
  assert.strictEqual(editAdminRes.data.admin.name, "Senior Ops Ravi", "Admin name updated");
  console.log("  [PASS] Super Admin can edit Admin account details");

  // 2e. Disable Admin
  const disableAdminRes = await api(`/superadmin/admins/${state.testAdminId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
    body: JSON.stringify({ isActive: false }),
  });
  assert.strictEqual(disableAdminRes.status, 200, "Super Admin disabled Admin account");
  assert.strictEqual(disableAdminRes.data.admin.isActive, false, "Admin isActive marked false");

  // Disabled admin cannot log in
  const disabledAdminLogin = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: testAdminEmail, password: "Password@123" }),
  });
  assert.strictEqual(disabledAdminLogin.status, 403, "Disabled Admin blocked from logging in");
  console.log("  [PASS] Super Admin can disable Admin (login blocked with 403)");

  // 2f. Reactivate Admin
  const reactivateAdminRes = await api(`/superadmin/admins/${state.testAdminId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
    body: JSON.stringify({ isActive: true }),
  });
  assert.strictEqual(reactivateAdminRes.status, 200, "Super Admin reactivated Admin account");
  assert.strictEqual(reactivateAdminRes.data.admin.isActive, true, "Admin isActive marked true");
  console.log("  [PASS] Super Admin can reactivate Admin");

  // 2g. Delete Admin
  const deleteAdminRes = await api(`/superadmin/admins/${state.testAdminId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(deleteAdminRes.status, 200, "Super Admin deleted Admin account");
  console.log("  [PASS] Super Admin can delete Admin account where appropriate\n");

  // TEST 3: User Management across all roles
  console.log("--- TEST 3: User Management (All 5 Roles) ---");
  // 3a. Register a test customer
  const testCustEmail = `user_cust_${timestamp}@bitego.com`;
  const regCust = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Customer Anand",
      email: testCustEmail,
      password: "Password@123",
      role: "customer",
    }),
  });
  assert.strictEqual(regCust.status, 201, "Customer registered");
  state.customerId = regCust.data.user._id || regCust.data.user.id;

  // 3b. Search and filter users
  const searchUsersRes = await api(`/superadmin/users?search=Anand&role=customer`, {
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(searchUsersRes.status, 200, "Search and filter users succeeds");
  const foundUser = searchUsersRes.data.users.find((u) => u._id === state.customerId);
  assert(foundUser, "Registered user found via search and role filter");
  console.log("  [PASS] Super Admin can search and filter users across roles");

  // 3c. View user profile details
  const viewUserRes = await api(`/superadmin/users/${state.customerId}`, {
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(viewUserRes.status, 200, "View user details succeeds");
  assert.strictEqual(viewUserRes.data.user.name, "Customer Anand", "User profile returned");
  console.log("  [PASS] Super Admin can view user details");

  // 3d. Suspend user
  const suspendUserRes = await api(`/superadmin/users/${state.customerId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
    body: JSON.stringify({ isActive: false }),
  });
  assert.strictEqual(suspendUserRes.status, 200, "Super Admin suspended user");
  assert.strictEqual(suspendUserRes.data.user.isActive, false, "User isActive false");

  // Suspended user blocked from login
  const suspendedLogin = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: testCustEmail, password: "Password@123" }),
  });
  assert.strictEqual(suspendedLogin.status, 403, "Suspended user cannot log in");
  console.log("  [PASS] Super Admin can suspend user account");

  // 3e. Reactivate user
  const reactivateUserRes = await api(`/superadmin/users/${state.customerId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
    body: JSON.stringify({ isActive: true }),
  });
  assert.strictEqual(reactivateUserRes.status, 200, "Super Admin reactivated user");
  assert.strictEqual(reactivateUserRes.data.user.isActive, true, "User isActive true");
  console.log("  [PASS] Super Admin can reactivate user account\n");

  // TEST 4: Merchant Management
  console.log("--- TEST 4: Merchant Management (Super Admin) ---");
  // 4a. Register and submit merchant application
  const testMerchEmail = `merch_sa_${timestamp}@bitego.com`;
  const regMerch = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Chef Sanjay SA",
      email: testMerchEmail,
      password: "Password@123",
      role: "merchant",
    }),
  });
  assert.strictEqual(regMerch.status, 201, "Merchant applicant registered");
  state.merchantToken = regMerch.data.token;
  state.merchantId = regMerch.data.user._id || regMerch.data.user.id;

  const applyMerch = await api("/merchant/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.merchantToken}` },
    body: JSON.stringify({
      restaurantName: "Sanjay Heritage Spice",
      ownerName: "Chef Sanjay SA",
      category: "Gujarati",
      address: "C.G. Road",
      hub: "Bodakdev Hub",
      phone: "+91 9888877777",
      fssaiNumber: "FSSAI-9938192",
    }),
  });
  assert.strictEqual(applyMerch.status, 201, "Merchant application submitted");
  state.merchantAppId = applyMerch.data.application._id;

  // 4b. Super Admin views all merchants
  const viewMerchantsRes = await api("/superadmin/merchants", {
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(viewMerchantsRes.status, 200, "View all merchants succeeds");
  const foundMerch = viewMerchantsRes.data.merchants.find((m) => m._id === state.merchantId);
  assert(foundMerch, "Merchant exists in Super Admin list");
  console.log("  [PASS] Super Admin can view all merchants with applications");

  // 4c. Super Admin rejects with reason
  const rejectMerchRes = await api(`/superadmin/merchants/${state.merchantAppId}/reject`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
    body: JSON.stringify({ reason: "FSSAI validation required from state portal." }),
  });
  assert.strictEqual(rejectMerchRes.status, 200, "Super Admin rejected merchant with reason");
  console.log("  [PASS] Super Admin can reject merchant application with reason");

  // 4d. Super Admin approves merchant
  const approveMerchRes = await api(`/superadmin/merchants/${state.merchantAppId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(approveMerchRes.status, 200, "Super Admin approved merchant application");
  console.log("  [PASS] Super Admin can approve merchant application");

  // 4e. Super Admin suspends & reactivates merchant
  const suspendMerchRes = await api(`/superadmin/users/${state.merchantId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
    body: JSON.stringify({ isActive: false }),
  });
  assert.strictEqual(suspendMerchRes.status, 200, "Super Admin suspended merchant");

  const reactivateMerchRes = await api(`/superadmin/users/${state.merchantId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
    body: JSON.stringify({ isActive: true }),
  });
  assert.strictEqual(reactivateMerchRes.status, 200, "Super Admin reactivated merchant");
  console.log("  [PASS] Super Admin can suspend and reactivate merchants\n");

  // TEST 5: Delivery Management
  console.log("--- TEST 5: Delivery Management (Super Admin) ---");
  // 5a. Register and submit delivery application
  const testDelivEmail = `deliv_sa_${timestamp}@bitego.com`;
  const regDeliv = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Pilot Manoj SA",
      email: testDelivEmail,
      password: "Password@123",
      role: "delivery",
    }),
  });
  assert.strictEqual(regDeliv.status, 201, "Delivery applicant registered");
  state.deliveryToken = regDeliv.data.token;
  state.deliveryId = regDeliv.data.user._id || regDeliv.data.user.id;

  const applyDeliv = await api("/delivery/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${state.deliveryToken}` },
    body: JSON.stringify({
      fullName: "Pilot Manoj SA",
      phone: "+91 9777788888",
      dob: "1996-08-20",
      address: "Navrangpura Hub",
      vehicleType: "Bike",
      vehicleNumber: "GJ-01-SA-9900",
      drivingLicenseNumber: "DL-GJ-2019-88192",
    }),
  });
  assert.strictEqual(applyDeliv.status, 201, "Delivery application submitted");
  state.deliveryAppId = applyDeliv.data.application._id;

  // 5b. Super Admin views all delivery partners
  const viewDelivRes = await api("/superadmin/delivery-partners", {
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(viewDelivRes.status, 200, "View all delivery partners succeeds");
  const foundDeliv = viewDelivRes.data.partners.find((d) => d._id === state.deliveryId);
  assert(foundDeliv, "Courier exists in Super Admin list");
  console.log("  [PASS] Super Admin can view all delivery partners");

  // 5c. Super Admin rejects with reason
  const rejectDelivRes = await api(`/superadmin/delivery/${state.deliveryAppId}/reject`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
    body: JSON.stringify({ reason: "Vehicle RC document expired." }),
  });
  assert.strictEqual(rejectDelivRes.status, 200, "Super Admin rejected delivery partner with reason");
  console.log("  [PASS] Super Admin can reject delivery partner with reason");

  // 5d. Super Admin approves delivery partner
  const approveDelivRes = await api(`/superadmin/delivery/${state.deliveryAppId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(approveDelivRes.status, 200, "Super Admin approved delivery partner");
  console.log("  [PASS] Super Admin can approve delivery partner");

  // 5e. Super Admin suspends & reactivates delivery partner
  const suspendDelivRes = await api(`/superadmin/users/${state.deliveryId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
    body: JSON.stringify({ isActive: false }),
  });
  assert.strictEqual(suspendDelivRes.status, 200, "Super Admin suspended courier");

  const reactivateDelivRes = await api(`/superadmin/users/${state.deliveryId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
    body: JSON.stringify({ isActive: true }),
  });
  assert.strictEqual(reactivateDelivRes.status, 200, "Super Admin reactivated courier");
  console.log("  [PASS] Super Admin can suspend and reactivate delivery partners\n");

  // TEST 6: Orders Supervision
  console.log("--- TEST 6: Orders Supervision (Platform-Wide) ---");
  const ordersRes = await api("/superadmin/orders", {
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(ordersRes.status, 200, "View all orders succeeds");
  assert(Array.isArray(ordersRes.data.orders), "Orders array returned");
  assert(ordersRes.data.orders.length > 0, "Orders exist in platform ledger");
  const firstOrder = ordersRes.data.orders[0];
  assert(firstOrder.orderNumber, "Order has orderNumber");
  assert(firstOrder.customer, "Order has customer populated");
  assert(firstOrder.totalAmount !== undefined, "Order has totalAmount");
  assert(firstOrder.orderStatus, "Order has orderStatus");
  console.log("  [PASS] Super Admin can view all platform orders with relational metadata\n");

  // TEST 7: Platform Settings (Stored in MongoDB)
  console.log("--- TEST 7: Platform Settings (Persisted in MongoDB) ---");
  // 7a. Get current settings
  const getSettingsRes = await api("/superadmin/settings", {
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(getSettingsRes.status, 200, "Get settings succeeds");
  assert(getSettingsRes.data.settings, "Settings document returned from MongoDB");
  console.log("  [PASS] Current settings retrieved from MongoDB:", {
    deliveryFee: getSettingsRes.data.settings.deliveryFee,
    taxRate: getSettingsRes.data.settings.taxRate,
    platformCommission: getSettingsRes.data.settings.platformCommission,
    serviceAvailability: getSettingsRes.data.settings.serviceAvailability,
  });

  // 7b. Update settings
  const updateSettingsRes = await api("/superadmin/settings", {
    method: "PUT",
    headers: { Authorization: `Bearer ${state.superadminToken}` },
    body: JSON.stringify({
      deliveryFee: 42.5,
      taxRate: 5.0,
      platformCommission: 19.5,
      serviceAvailability: true,
      minOrderAmount: 120.0,
      freeDeliveryThreshold: 550.0,
      surgeMultiplier: 1.2,
    }),
  });
  assert.strictEqual(updateSettingsRes.status, 200, "Settings updated successfully");
  assert.strictEqual(updateSettingsRes.data.settings.deliveryFee, 42.5, "deliveryFee updated in MongoDB");
  assert.strictEqual(updateSettingsRes.data.settings.platformCommission, 19.5, "platformCommission updated in MongoDB");

  // 7c. Verify persistence by refetching from MongoDB
  const refetchSettings = await api("/superadmin/settings", {
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(refetchSettings.data.settings.deliveryFee, 42.5, "deliveryFee persistence verified");
  assert.strictEqual(refetchSettings.data.settings.platformCommission, 19.5, "platformCommission persistence verified");
  console.log("  [PASS] Platform settings updated and verified directly in MongoDB\n");

  // TEST 8: Audit Logging
  console.log("--- TEST 8: Security Audit Logs Verification ---");

  // 8a. Trigger Operational Admin actions to verify cross-role audit logging
  // Register another merchant for Admin approval
  const adminTestMerch = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Chef Rohit AdminAudit",
      email: `merch_adm_${timestamp}@bitego.com`,
      password: "Password@123",
      role: "merchant",
    }),
  });
  const adminMerchApp = await api("/merchant/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${adminTestMerch.data.token}` },
    body: JSON.stringify({
      restaurantName: "Rohit Rasoi Audit",
      ownerName: "Chef Rohit AdminAudit",
      category: "North Indian",
      address: "Sindhu Bhavan Road",
      hub: "Bodakdev Hub",
      phone: "+91 9111122222",
      fssaiNumber: "FSSAI-8839201",
    }),
  });
  // Operational Admin approves merchant
  const adminApproveRes = await api(`/admin/merchants/${adminMerchApp.data.application._id}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  assert.strictEqual(adminApproveRes.status, 200, "Operational Admin approved merchant");

  // Register another delivery partner for Admin rejection
  const adminTestDeliv = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Pilot Chetan AdminAudit",
      email: `deliv_adm_${timestamp}@bitego.com`,
      password: "Password@123",
      role: "delivery",
    }),
  });
  const adminDelivApp = await api("/delivery/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${adminTestDeliv.data.token}` },
    body: JSON.stringify({
      fullName: "Pilot Chetan AdminAudit",
      phone: "+91 9333344444",
      dob: "1998-05-15",
      address: "Vastrapur Hub",
      vehicleType: "Bike",
      vehicleNumber: "GJ-01-AD-7788",
      drivingLicenseNumber: "DL-GJ-2021-99881",
    }),
  });
  // Operational Admin rejects delivery partner
  const adminRejectDelivRes = await api(`/admin/delivery/${adminDelivApp.data.application._id}/reject`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({ reason: "License expired on portal verification." }),
  });
  assert.strictEqual(adminRejectDelivRes.status, 200, "Operational Admin rejected delivery partner");

  const auditLogsRes = await api("/superadmin/audit-logs", {
    headers: { Authorization: `Bearer ${state.superadminToken}` },
  });
  assert.strictEqual(auditLogsRes.status, 200, "Get audit logs succeeds");
  assert(Array.isArray(auditLogsRes.data.logs), "Audit logs is an array");
  assert(auditLogsRes.data.logs.length > 0, "Audit logs contain recorded events");

  const requiredActions = [
    "Super Admin created Admin",
    "Admin approved Merchant",
    "Admin rejected Delivery Partner",
    "Super Admin suspended User",
    "Super Admin changed settings",
  ];

  for (const act of requiredActions) {
    const hasAction = auditLogsRes.data.logs.some((l) => l.action === act);
    assert(hasAction, `Audit log contains action '${act}'`);
    console.log(`  [PASS] Audit log verified for action: "${act}"`);
  }

  // Verify structure
  const sampleLog = auditLogsRes.data.logs[0];
  assert(sampleLog.performedBy, "Audit log has performedBy");
  assert(sampleLog.action, "Audit log has action");
  assert(sampleLog.target, "Audit log has target");
  assert(sampleLog.createdAt, "Audit log has timestamp");
  assert(sampleLog.details, "Audit log has details");
  console.log("  [PASS] Audit log schema fields validated (performedBy, action, target, timestamp, details)\n");

  // TEST 9: Critical Security Invariants
  console.log("--- TEST 9: Critical Security Invariants ---");
  // 9a. Operational Admin cannot access any Super Admin API
  const endpointsToTest = [
    { method: "GET", path: "/superadmin/overview" },
    { method: "GET", path: "/superadmin/admins" },
    { method: "POST", path: "/superadmin/admins" },
    { method: "GET", path: "/superadmin/users" },
    { method: "GET", path: "/superadmin/merchants" },
    { method: "GET", path: "/superadmin/delivery-partners" },
    { method: "GET", path: "/superadmin/orders" },
    { method: "GET", path: "/superadmin/settings" },
    { method: "PUT", path: "/superadmin/settings" },
    { method: "GET", path: "/superadmin/audit-logs" },
  ];

  for (const ep of endpointsToTest) {
    const res = await api(ep.path, {
      method: ep.method,
      headers: { Authorization: `Bearer ${state.adminToken}` },
      body: ep.method !== "GET" ? JSON.stringify({}) : undefined,
    });
    assert.strictEqual(res.status, 403, `Admin blocked with 403 from ${ep.method} ${ep.path}`);
  }
  console.log("  [PASS] Operational Admin strictly blocked (403) from all 10 Super Admin endpoints");

  // 9b. Cannot register as Super Admin publicly
  const regSuperAttempt = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Fake Super",
      email: `fake_super_${timestamp}@bitego.com`,
      password: "Password@123",
      role: "superadmin",
    }),
  });
  assert.strictEqual(regSuperAttempt.status, 403, "Public registration of superadmin blocked with 403");
  console.log("  [PASS] Public registration of superadmin blocked (403 Forbidden)");

  // 9c. Admin cannot delete or suspend Super Admin
  const adminDelSuper = await api(`/admin/users/${state.superadminId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  assert.strictEqual(adminDelSuper.status, 403, "Admin cannot delete Super Admin");
  console.log("  [PASS] Admin cannot delete Super Admin");

  const adminSuspSuper = await api(`/admin/users/${state.superadminId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.adminToken}` },
    body: JSON.stringify({ isActive: false }),
  });
  assert.strictEqual(adminSuspSuper.status, 403, "Admin cannot suspend Super Admin");
  console.log("  [PASS] Admin cannot suspend Super Admin\n");

  console.log("==================================================================");
  console.log(" ALL PHASE 7: SUPER ADMIN FUNCTIONALITY TESTS PASSED (100%) ");
  console.log("==================================================================\n");
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
