import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import Order from "./models/Order.js";
import User from "./models/User.js";
import Restaurant from "./models/Restaurant.js";
import MenuItem from "./models/MenuItem.js";

dotenv.config();

const API_BASE = "http://localhost:5000/api";

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || "bitego_secure_jwt_secret_key",
    { expiresIn: "1h" }
  );
};

const runIdorSecurityTests = async () => {
  console.log("==========================================================");
  console.log("BiteGo — Order Details API & IDOR Security Verification");
  console.log("==========================================================\n");

  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("✓ Connected to MongoDB Atlas\n");

  const createdUsers = [];
  const createdRestaurants = [];
  const createdMenuItems = [];
  let testOrder = null;

  try {
    const timestamp = Date.now();

    // 1. Create Customer A (Legitimate Owner)
    const customerA = await User.create({
      name: "Customer Alice",
      email: `alice_${timestamp}@test.com`,
      phone: "+91 91111 00001",
      password: "Password@123",
      role: "customer",
      isActive: true,
    });
    createdUsers.push(customerA);

    // 2. Create Customer B (Attacker / Different Customer)
    const customerB = await User.create({
      name: "Customer Bob",
      email: `bob_${timestamp}@test.com`,
      phone: "+91 91111 00002",
      password: "Password@123",
      role: "customer",
      isActive: true,
    });
    createdUsers.push(customerB);

    // 3. Create Merchant A (Authorized Restaurant Owner)
    const merchantA = await User.create({
      name: "Merchant Mario",
      email: `mario_${timestamp}@test.com`,
      phone: "+91 92222 00001",
      password: "Password@123",
      role: "merchant",
      verificationStatus: "approved",
      isActive: true,
    });
    createdUsers.push(merchantA);

    // 4. Create Merchant B (Unauthorized Restaurant Owner)
    const merchantB = await User.create({
      name: "Merchant Luigi",
      email: `luigi_${timestamp}@test.com`,
      phone: "+91 92222 00002",
      password: "Password@123",
      role: "merchant",
      verificationStatus: "approved",
      isActive: true,
    });
    createdUsers.push(merchantB);

    // 5. Create Courier A (Assigned Delivery Partner)
    const courierA = await User.create({
      name: "Courier Fast",
      email: `fast_${timestamp}@test.com`,
      phone: "+91 93333 00001",
      password: "Password@123",
      role: "delivery",
      verificationStatus: "approved",
      isActive: true,
    });
    createdUsers.push(courierA);

    // 6. Create Courier B (Unassigned Delivery Partner)
    const courierB = await User.create({
      name: "Courier Snooze",
      email: `snooze_${timestamp}@test.com`,
      phone: "+91 93333 00002",
      password: "Password@123",
      role: "delivery",
      verificationStatus: "approved",
      isActive: true,
    });
    createdUsers.push(courierB);

    // 7. Find or Create Admin
    let admin = await User.findOne({ role: "admin" });
    if (!admin) {
      admin = await User.create({
        name: "Admin Officer",
        email: `admin_${timestamp}@test.com`,
        phone: "+91 94444 00001",
        password: "Password@123",
        role: "admin",
        isActive: true,
      });
      createdUsers.push(admin);
    }

    // 8. Create Restaurants
    const restaurantA = await Restaurant.create({
      name: `Mario Pizzeria ${timestamp}`,
      slug: `mario-pizzeria-${timestamp}`,
      address: "100 Italian Way, Ahmedabad",
      merchantUser: merchantA._id,
      isOpen: true,
    });
    createdRestaurants.push(restaurantA);

    const restaurantB = await Restaurant.create({
      name: `Luigi Bistro ${timestamp}`,
      slug: `luigi-bistro-${timestamp}`,
      address: "200 Pasta Blvd, Ahmedabad",
      merchantUser: merchantB._id,
      isOpen: true,
    });
    createdRestaurants.push(restaurantB);

    // 9. Create MenuItem
    const menuItem = await MenuItem.create({
      restaurant: restaurantA._id,
      name: "Truffle Pizza",
      price: 499,
      category: "Pizza",
      isAvailable: true,
      inStock: true,
    });
    createdMenuItems.push(menuItem);

    // 10. Create Target Test Order (Belonging to Customer A, Restaurant A, Assigned to Courier A)
    testOrder = await Order.create({
      orderNumber: `BG-${Math.floor(10000 + Math.random() * 90000)}`,
      customer: customerA._id,
      restaurant: restaurantA._id,
      deliveryPartner: courierA._id,
      items: [
        {
          menuItem: menuItem._id,
          name: "Truffle Pizza",
          price: 499,
          quantity: 2,
          itemTotal: 998,
        },
      ],
      subtotal: 998,
      totalAmount: 1048,
      deliveryFee: 45,
      platformFee: 5,
      orderStatus: "OUT_FOR_DELIVERY",
      orderOtp: "4589",
      deliveryAddress: {
        fullName: "Alice Wonderland",
        phone: "+91 91111 00001",
        houseFlat: "Secret Penthouse 99",
        area: "Vastrapur",
        city: "Ahmedabad",
        pincode: "380015",
      },
    });

    console.log(`✓ Test Order Created: ${testOrder.orderNumber} (ID: ${testOrder._id})`);
    console.log(`  Owner Customer: ${customerA.name} (${customerA._id})`);
    console.log(`  Owner Restaurant: ${restaurantA.name} (Merchant: ${merchantA.name})`);
    console.log(`  Assigned Courier: ${courierA.name} (${courierA._id})\n`);

    // Generate JWT tokens
    const tokenCustomerA = generateToken(customerA);
    const tokenCustomerB = generateToken(customerB);
    const tokenMerchantA = generateToken(merchantA);
    const tokenMerchantB = generateToken(merchantB);
    const tokenCourierA = generateToken(courierA);
    const tokenCourierB = generateToken(courierB);
    const tokenAdmin = generateToken(admin);

    const fetchOrder = async (token, orderId) => {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/orders/${orderId}`, { headers });
      const data = await res.json();
      return { status: res.status, data };
    };

    // TEST 1: Unauthenticated Request (No Token)
    console.log("TEST 1: Unauthenticated request to GET /api/orders/:id (No Token)...");
    {
      const { status, data } = await fetchOrder(null, testOrder._id);
      if (status === 401 && data.success === false) {
        console.log(`  [PASS] Correctly rejected: HTTP ${status} - "${data.message}"\n`);
      } else {
        throw new Error(`TEST 1 FAILED! Expected HTTP 401, got ${status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 2: Authorized Customer (Customer A accesses their own order)
    console.log("TEST 2: Legitimate Customer A accesses their own order...");
    {
      const { status, data } = await fetchOrder(tokenCustomerA, testOrder._id);
      if (status === 200 && data.success === true && data.order?.orderNumber === testOrder.orderNumber) {
        console.log(`  [PASS] Allowed: HTTP 200 - Order ${data.order.orderNumber} retrieved.`);
        console.log(`  [PASS] Customer sees their Delivery OTP: ${data.order.orderOtp}\n`);
      } else {
        throw new Error(`TEST 2 FAILED! Expected HTTP 200, got ${status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 3: IDOR - Unauthorized Customer (Customer B accesses Customer A's order)
    console.log("TEST 3: IDOR ATTEMPT - Customer B tries to view Customer A's order...");
    {
      const { status, data } = await fetchOrder(tokenCustomerB, testOrder._id);
      if (status === 403 && data.success === false) {
        console.log(`  [PASS] Correctly forbidden: HTTP ${status} - "${data.message}"`);
        console.log("  [PASS] Customer B received ZERO address or phone details.\n");
      } else {
        throw new Error(`TEST 3 FAILED (IDOR VULNERABILITY DETECTED)! Expected HTTP 403, got ${status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 4: Authorized Merchant (Merchant A accesses order for their restaurant)
    console.log("TEST 4: Authorized Merchant A views order belonging to Restaurant A...");
    {
      const { status, data } = await fetchOrder(tokenMerchantA, testOrder._id);
      if (status === 200 && data.success === true && data.order?.orderNumber === testOrder.orderNumber) {
        console.log(`  [PASS] Allowed: HTTP 200 - Merchant retrieved order #${data.order.orderNumber}.`);
        if (data.order.orderOtp === undefined) {
          console.log("  [PASS] Delivery OTP is safely redacted from merchant response.\n");
        } else {
          throw new Error("TEST 4 FAILED! Customer OTP was exposed to merchant.");
        }
      } else {
        throw new Error(`TEST 4 FAILED! Expected HTTP 200, got ${status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 5: IDOR - Unauthorized Merchant (Merchant B tries to view Restaurant A's order)
    console.log("TEST 5: IDOR ATTEMPT - Merchant B tries to view Restaurant A's order...");
    {
      const { status, data } = await fetchOrder(tokenMerchantB, testOrder._id);
      if (status === 403 && data.success === false) {
        console.log(`  [PASS] Correctly forbidden: HTTP ${status} - "${data.message}"`);
        console.log("  [PASS] Competitor merchant received ZERO customer or ticket details.\n");
      } else {
        throw new Error(`TEST 5 FAILED (IDOR VULNERABILITY DETECTED)! Expected HTTP 403, got ${status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 6: Authorized Delivery Agent (Courier A accesses assigned order)
    console.log("TEST 6: Authorized Courier A views assigned order...");
    {
      const { status, data } = await fetchOrder(tokenCourierA, testOrder._id);
      if (status === 200 && data.success === true && data.order?.orderNumber === testOrder.orderNumber) {
        console.log(`  [PASS] Allowed: HTTP 200 - Courier retrieved assigned drop #${data.order.orderNumber}.`);
        if (data.order.orderOtp === undefined) {
          console.log("  [PASS] Delivery OTP is safely redacted from courier response.\n");
        } else {
          throw new Error("TEST 6 FAILED! Customer OTP was pre-exposed to courier before handover.");
        }
      } else {
        throw new Error(`TEST 6 FAILED! Expected HTTP 200, got ${status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 7: IDOR - Unauthorized Delivery Agent (Courier B tries to view Courier A's assigned order)
    console.log("TEST 7: IDOR ATTEMPT - Courier B tries to view Courier A's assigned order...");
    {
      const { status, data } = await fetchOrder(tokenCourierB, testOrder._id);
      if (status === 403 && data.success === false) {
        console.log(`  [PASS] Correctly forbidden: HTTP ${status} - "${data.message}"`);
        console.log("  [PASS] Unassigned courier received ZERO customer delivery address info.\n");
      } else {
        throw new Error(`TEST 7 FAILED (IDOR VULNERABILITY DETECTED)! Expected HTTP 403, got ${status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 8: Platform Admin (Admin views order)
    console.log("TEST 8: Platform Admin inspects order details...");
    {
      const { status, data } = await fetchOrder(tokenAdmin, testOrder._id);
      if (status === 200 && data.success === true && data.order?.orderNumber === testOrder.orderNumber) {
        console.log(`  [PASS] Allowed: HTTP 200 - Admin platform inspection authorized.\n`);
      } else {
        throw new Error(`TEST 8 FAILED! Expected HTTP 200, got ${status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 9: Non-existent Order ID
    console.log("TEST 9: Requesting non-existent order ID...");
    {
      const fakeId = new mongoose.Types.ObjectId();
      const { status, data } = await fetchOrder(tokenCustomerA, fakeId);
      if (status === 404 && data.success === false) {
        console.log(`  [PASS] Correctly returns 404: HTTP ${status} - "${data.message}"\n`);
      } else {
        throw new Error(`TEST 9 FAILED! Expected HTTP 404, got ${status}`);
      }
    }

    // TEST 10: IDOR on Reorder API (Customer B tries to reorder Customer A's order)
    console.log("TEST 10: IDOR on POST /api/orders/:id/reorder (Customer B reorders Customer A's feast)...");
    {
      const resB = await fetch(`${API_BASE}/orders/${testOrder._id}/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenCustomerB}`,
        },
      });
      const dataB = await resB.json();

      if (resB.status === 404 && dataB.success === false) {
        console.log(`  [PASS] Customer B reorder blocked: HTTP ${resB.status} - "${dataB.message}"`);
      } else {
        throw new Error(`TEST 10 FAILED! Expected HTTP 404 for unauthorized reorder, got ${resB.status}`);
      }

      // Customer A legitimate reorder
      const resA = await fetch(`${API_BASE}/orders/${testOrder._id}/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenCustomerA}`,
        },
      });
      const dataA = await resA.json();

      if (resA.status === 200 && dataA.success === true) {
        console.log(`  [PASS] Customer A legitimate reorder succeeded: HTTP ${resA.status} - "${dataA.message}"\n`);
      } else {
        throw new Error(`TEST 10 FAILED! Expected HTTP 200 for Customer A reorder, got ${resA.status}`);
      }
    }

    console.log("==========================================================");
    console.log("ALL 10 IDOR & AUTHORIZATION SECURITY TESTS PASSED!");
    console.log("==========================================================");
  } finally {
    // Clean up test data
    console.log("\nCleaning up test records...");
    if (testOrder && testOrder._id) {
      await Order.findByIdAndDelete(testOrder._id);
    }
    for (const item of createdMenuItems) {
      await MenuItem.findByIdAndDelete(item._id);
    }
    for (const rest of createdRestaurants) {
      await Restaurant.findByIdAndDelete(rest._id);
    }
    for (const user of createdUsers) {
      await User.findByIdAndDelete(user._id);
    }
    await mongoose.disconnect();
    console.log("✓ All temporary test data removed & MongoDB disconnected.\n");
  }
};

runIdorSecurityTests().catch((err) => {
  console.error("FATAL ERROR in IDOR Security Suite:", err);
  process.exit(1);
});
