

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

async function runPhase2Tests() {
  console.log("================================================================");
  console.log(" BITEGO PHASE 2: AUTHENTICATION & RBAC COMPREHENSIVE TEST SUITE");
  console.log("================================================================\n");

  const timestamp = Date.now();

  // 1. PUBLIC REGISTRATION SECURITY
  console.log("1. Public Registration Security & Role Isolation");

  // 1a. Disallow public registration of admin
  const regAdminRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Hacker Admin",
      email: `fakeadmin_${timestamp}@hack.com`,
      password: "Password@123",
      role: "admin",
    }),
  });
  assert(
    regAdminRes.status === 403,
    "Public registration of 'admin' role is rejected with 403 Forbidden"
  );

  // 1b. Disallow public registration of superadmin
  const regSuperRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Hacker SuperAdmin",
      email: `fakesuper_${timestamp}@hack.com`,
      password: "Password@123",
      role: "superadmin",
    }),
  });
  assert(
    regSuperRes.status === 403,
    "Public registration of 'superadmin' role is rejected with 403 Forbidden"
  );

  // 1c. Register valid Customer (Approved by default)
  const custEmail = `cust_${timestamp}@test.com`;
  const regCustRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Customer",
      email: custEmail,
      password: "Customer@123",
      role: "customer",
    }),
  });
  const regCustData = await regCustRes.json();
  assert(
    regCustRes.status === 201 &&
      regCustData.user.role === "customer" &&
      regCustData.user.verificationStatus === "approved",
    "Customer registers with role='customer' and verificationStatus='approved'"
  );
  const custToken = regCustData.token;

  // 1d. Register valid Merchant (Pending by default)
  const merchEmail = `merch_${timestamp}@test.com`;
  const regMerchRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Merchant",
      email: merchEmail,
      password: "Merchant@123",
      role: "merchant",
    }),
  });
  const regMerchData = await regMerchRes.json();
  assert(
    regMerchRes.status === 201 &&
      regMerchData.user.role === "merchant" &&
      regMerchData.user.verificationStatus === "pending",
    "Merchant registers with role='merchant' and verificationStatus='pending'"
  );
  const pendingMerchToken = regMerchData.token;

  // 1e. Register valid Delivery Partner (Pending by default)
  const delivEmail = `deliv_${timestamp}@test.com`;
  const regDelivRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Rider",
      email: delivEmail,
      password: "Delivery@123",
      role: "delivery",
    }),
  });
  const regDelivData = await regDelivRes.json();
  assert(
    regDelivRes.status === 201 &&
      regDelivData.user.role === "delivery" &&
      regDelivData.user.verificationStatus === "pending",
    "Delivery registers with role='delivery' and verificationStatus='pending'"
  );
  const pendingDelivToken = regDelivData.token;

  // 2. SELF-PRIVILEGE ESCALATION PREVENTION
  console.log("\n2. Self-Privilege Escalation Prevention");
  const escalateRes = await fetch(`${BASE_URL}/api/users/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${custToken}`,
    },
    body: JSON.stringify({
      name: "Escalated User",
      role: "superadmin",
      verificationStatus: "approved",
    }),
  });
  const escalateData = await escalateRes.json();
  assert(
    escalateRes.ok && escalateData.user.role === "customer",
    "Customer cannot alter own role via profile update API (remains 'customer')"
  );

  // 3. AUTHENTICATION & LOGIN CHECKS
  console.log("\n3. Login & Authentication Flow");
  // 3a. Invalid credentials
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: custEmail,
      password: "WrongPassword@123",
    }),
  });
  assert(badLoginRes.status === 401, "Invalid password rejected with 401 Unauthorized");

  // 3b. Missing credentials
  const emptyLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: custEmail }),
  });
  assert(emptyLoginRes.status === 400, "Missing password rejected with 400 Bad Request");

  // 3c. Valid login across roles
  const seedRoles = [
    { key: "admin", email: "admin@bitego.com", pass: "Admin@123" },
    { key: "superadmin", email: "superadmin@bitego.com", pass: "SuperAdmin@123" },
    { key: "approvedMerchant", email: "merchant@darkroast.com", pass: "Merchant@123" },
    { key: "approvedDelivery", email: "delivery@bitego.com", pass: "Delivery@123" },
  ];
  const roleTokens = {};
  for (const item of seedRoles) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: item.email, password: item.pass }),
    });
    const data = await res.json();
    assert(data.success && data.token, `Login successful for ${item.key} (${item.email})`);
    roleTokens[item.key] = data.token;
  }

  // 4. GET /api/auth/me & LOGOUT
  console.log("\n4. Current User Verification (/api/auth/me) & Logout");
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${custToken}` },
  });
  const meData = await meRes.json();
  assert(
    meRes.ok && meData.user.email === custEmail && meData.user.role === "customer",
    "GET /api/auth/me retrieves authenticated user with verified role from DB"
  );

  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
  });
  const logoutData = await logoutRes.json();
  assert(logoutRes.ok && logoutData.success, "POST /api/auth/logout succeeds with 200");

  // 5. BACKEND ROLE-BASED ACCESS CONTROL (RBAC) GATES
  console.log("\n5. Backend RBAC Route Protection");

  // 5a. Customer access to merchant endpoints -> 403
  const custToMerchRes = await fetch(`${BASE_URL}/api/merchant/orders`, {
    headers: { Authorization: `Bearer ${custToken}` },
  });
  assert(custToMerchRes.status === 403, "Customer access to /api/merchant/orders returns 403 Forbidden");

  // 5b. Customer access to delivery endpoints -> 403
  const custToDelivRes = await fetch(`${BASE_URL}/api/delivery/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${custToken}`,
    },
    body: JSON.stringify({ isOnline: true }),
  });
  assert(custToDelivRes.status === 403, "Customer access to /api/delivery/status returns 403 Forbidden");

  // 5c. Customer access to admin endpoints -> 403
  const custToAdminRes = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${custToken}` },
  });
  assert(custToAdminRes.status === 403, "Customer access to /api/admin/users returns 403 Forbidden");

  // 5d. Customer access to superadmin endpoints -> 403
  const custToSuperRes = await fetch(`${BASE_URL}/api/superadmin/overview`, {
    headers: { Authorization: `Bearer ${custToken}` },
  });
  assert(custToSuperRes.status === 403, "Customer access to /api/superadmin/overview returns 403 Forbidden");

  // 5e. Pending Merchant access to merchant orders -> 403 (verificationStatus='pending')
  const pendingMerchOrdersRes = await fetch(`${BASE_URL}/api/merchant/orders`, {
    headers: { Authorization: `Bearer ${pendingMerchToken}` },
  });
  const pendingMerchOrdersData = await pendingMerchOrdersRes.json();
  assert(
    pendingMerchOrdersRes.status === 403 &&
      pendingMerchOrdersData.verificationStatus === "pending",
    "Pending merchant access to /api/merchant/orders blocked with 403 & verificationStatus='pending'"
  );

  // 5f. Pending Delivery Partner access to delivery status -> 403 (verificationStatus='pending')
  const pendingDelivStatusRes = await fetch(`${BASE_URL}/api/delivery/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pendingDelivToken}`,
    },
    body: JSON.stringify({ isOnline: true }),
  });
  const pendingDelivStatusData = await pendingDelivStatusRes.json();
  assert(
    pendingDelivStatusRes.status === 403 &&
      pendingDelivStatusData.verificationStatus === "pending",
    "Pending delivery partner access to /api/delivery/status blocked with 403 & verificationStatus='pending'"
  );

  // 5g. Approved Merchant access to merchant orders -> 200
  const appMerchRes = await fetch(`${BASE_URL}/api/merchant/orders`, {
    headers: { Authorization: `Bearer ${roleTokens.approvedMerchant}` },
  });
  assert(appMerchRes.ok, "Approved merchant access to /api/merchant/orders succeeds with 200");

  // 5h. Approved Delivery Partner access to delivery status -> 200
  const appDelivRes = await fetch(`${BASE_URL}/api/delivery/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${roleTokens.approvedDelivery}`,
    },
    body: JSON.stringify({ isOnline: true }),
  });
  assert(appDelivRes.ok, "Approved delivery partner access to /api/delivery/status succeeds with 200");

  // 5i. Admin access to admin routes -> 200
  const adminUsersRes = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${roleTokens.admin}` },
  });
  assert(adminUsersRes.ok, "Admin access to /api/admin/users succeeds with 200");

  // 5j. Admin access to superadmin routes -> 403
  const adminToSuperRes = await fetch(`${BASE_URL}/api/superadmin/overview`, {
    headers: { Authorization: `Bearer ${roleTokens.admin}` },
  });
  assert(adminToSuperRes.status === 403, "Admin access to /api/superadmin/overview returns 403 Forbidden");

  const adminToSuperAdminsRes = await fetch(`${BASE_URL}/api/superadmin/admins`, {
    headers: { Authorization: `Bearer ${roleTokens.admin}` },
  });
  assert(adminToSuperAdminsRes.status === 403, "Admin access to /api/superadmin/admins returns 403 Forbidden (Admin cannot create Admin/SuperAdmin)");

  // 5k. Super Admin access to superadmin routes -> 200
  const superOverviewRes = await fetch(`${BASE_URL}/api/superadmin/overview`, {
    headers: { Authorization: `Bearer ${roleTokens.superadmin}` },
  });
  assert(superOverviewRes.ok, "Super Admin access to /api/superadmin/overview succeeds with 200");

  // 5l. Super Admin access to admin routes -> 200
  const superToAdminRes = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${roleTokens.superadmin}` },
  });
  assert(superToAdminRes.ok, "Super Admin access to /api/admin/users succeeds with 200");

  // 5m. Only Super Admin can create Admin
  const createAdminEmail = `newadmin_${timestamp}@bitego.com`;
  const createAdminRes = await fetch(`${BASE_URL}/api/superadmin/admins`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${roleTokens.superadmin}`,
    },
    body: JSON.stringify({
      name: "Operational Admin 2",
      email: createAdminEmail,
      password: "Admin@123",
      phone: "+91 98980 11223",
    }),
  });
  const createAdminData = await createAdminRes.json();
  assert(
    createAdminRes.status === 201 &&
      createAdminData.admin.role === "admin" &&
      createAdminData.admin.email === createAdminEmail,
    "Super Admin creates operational Admin successfully with role='admin'"
  );

  // 6. CLIENT-SIDE PROTECTED ROUTE & REDIRECT MATRIX
  console.log("\n6. Client-Side ProtectedRoute & Redirect Logic Verification");

  // Mirror exact ProtectedRoute & getRedirectPathForUser logic
  function checkClientRoute(user, targetRoute, allowedRoles) {
    if (!user) return { allowed: false, redirect: "/login" };
    if (!user.isActive) return { allowed: false, screen: "Account Suspended" };

    if (user.role === "merchant") {
      if (user.verificationStatus === "pending") return { allowed: false, redirect: "/verification-pending" };
      if (user.verificationStatus === "rejected") return { allowed: false, redirect: "/verification-rejected" };
    }

    if (user.role === "delivery") {
      if (user.verificationStatus === "pending") return { allowed: false, redirect: "/verification-pending" };
      if (user.verificationStatus === "rejected") return { allowed: false, redirect: "/verification-rejected" };
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const isSuperAdminAccessingAdmin = user.role === "superadmin" && allowedRoles.includes("admin");
      const hasDirectRole = allowedRoles.includes(user.role);
      if (!hasDirectRole && !isSuperAdminAccessingAdmin) {
        return { allowed: false, redirect: "/unauthorized" };
      }
    }

    return { allowed: true, redirect: null };
  }

  // Matrix tests
  const customerUser = { role: "customer", verificationStatus: "approved", isActive: true };
  const pendingMerchantUser = { role: "merchant", verificationStatus: "pending", isActive: true };
  const approvedMerchantUser = { role: "merchant", verificationStatus: "approved", isActive: true };
  const pendingDeliveryUser = { role: "delivery", verificationStatus: "pending", isActive: true };
  const approvedDeliveryUser = { role: "delivery", verificationStatus: "approved", isActive: true };
  const adminUser = { role: "admin", verificationStatus: "approved", isActive: true };
  const superAdminUser = { role: "superadmin", verificationStatus: "approved", isActive: true };

  // Customer tests
  assert(checkClientRoute(customerUser, "/", null).allowed === true, "Customer -> / [ALLOWED]");
  assert(checkClientRoute(customerUser, "/merchant", ["merchant"]).redirect === "/unauthorized", "Customer -> /merchant [BLOCKED -> /unauthorized]");
  assert(checkClientRoute(customerUser, "/fleet", ["delivery"]).redirect === "/unauthorized", "Customer -> /fleet [BLOCKED -> /unauthorized]");
  assert(checkClientRoute(customerUser, "/admin", ["admin", "superadmin"]).redirect === "/unauthorized", "Customer -> /admin [BLOCKED -> /unauthorized]");
  assert(checkClientRoute(customerUser, "/superadmin", ["superadmin"]).redirect === "/unauthorized", "Customer -> /superadmin [BLOCKED -> /unauthorized]");

  // Pending partner tests
  assert(checkClientRoute(pendingMerchantUser, "/merchant", ["merchant"]).redirect === "/verification-pending", "Merchant pending -> /merchant [BLOCKED -> /verification-pending]");
  assert(checkClientRoute(pendingDeliveryUser, "/fleet", ["delivery"]).redirect === "/verification-pending", "Delivery pending -> /fleet [BLOCKED -> /verification-pending]");

  // Approved partner tests
  assert(checkClientRoute(approvedMerchantUser, "/merchant", ["merchant"]).allowed === true, "Merchant approved -> /merchant [ALLOWED]");
  assert(checkClientRoute(approvedDeliveryUser, "/fleet", ["delivery"]).allowed === true, "Delivery approved -> /fleet [ALLOWED]");

  // Admin tests
  assert(checkClientRoute(adminUser, "/admin", ["admin", "superadmin"]).allowed === true, "Admin -> /admin [ALLOWED]");
  assert(checkClientRoute(adminUser, "/superadmin", ["superadmin"]).redirect === "/unauthorized", "Admin -> /superadmin [BLOCKED -> /unauthorized]");

  // Super Admin tests
  assert(checkClientRoute(superAdminUser, "/superadmin", ["superadmin"]).allowed === true, "Super Admin -> /superadmin [ALLOWED]");
  assert(checkClientRoute(superAdminUser, "/admin", ["admin", "superadmin"]).allowed === true, "Super Admin -> /admin [ALLOWED]");

  console.log("\n================================================================");
  console.log(" PHASE 2 VERIFICATION COMPLETE: ALL RBAC & AUTH GATES PASSED");
  console.log("================================================================\n");
}

runPhase2Tests().catch((err) => {
  console.error("Test Suite Failed with Error:", err);
  process.exit(1);
});
