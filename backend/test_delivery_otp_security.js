import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./models/Order.js";
import User from "./models/User.js";
import DeliveryEarning from "./models/DeliveryEarning.js";
import Restaurant from "./models/Restaurant.js";
import jwt from "jsonwebtoken";

dotenv.config();

const API_BASE = "http://localhost:5000/api";

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || "bitego_secure_jwt_secret_key",
    { expiresIn: "1h" }
  );
};

const runOtpSecurityTests = async () => {
  console.log("==========================================================");
  console.log("BiteGo — Delivery OTP Security & Bypass Verification Suite");
  console.log("==========================================================\n");

  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("✓ Connected to MongoDB Atlas\n");

  let testOrder = null;
  let assignedCourier = null;
  let unauthorizedCourier = null;

  try {
    // 1. Fetch or create test delivery partners
    assignedCourier = await User.findOne({ role: "delivery" });
    if (!assignedCourier) {
      throw new Error("No delivery agent found in database to test.");
    }

    unauthorizedCourier = await User.findOne({
      role: "delivery",
      _id: { $ne: assignedCourier._id },
    });

    if (!unauthorizedCourier) {
      unauthorizedCourier = await User.create({
        name: "Rogue Delivery Partner",
        email: `rogue_courier_${Date.now()}@bitego.com`,
        phone: "+91 99999 88888",
        password: "Password@123",
        role: "delivery",
        verificationStatus: "approved",
        isActive: true,
      });
    }

    const assignedToken = generateToken(assignedCourier);
    const unauthorizedToken = generateToken(unauthorizedCourier);

    const testRestaurant = await Restaurant.findOne();
    const testCustomer = await User.findOne({ role: "customer" });

    // Create an isolated order in PREPARING status with full required fields
    const expectedOtp = "7412";
    testOrder = await Order.create({
      orderNumber: `TEST-OTP-${Date.now().toString().slice(-6)}`,
      customer: testCustomer ? testCustomer._id : assignedCourier._id,
      restaurant: testRestaurant ? testRestaurant._id : assignedCourier._id,
      items: [
        {
          name: "Security Test Pizza",
          price: 299,
          quantity: 1,
          itemTotal: 299,
        },
      ],
      subtotal: 299,
      totalAmount: 349,
      deliveryFee: 45,
      platformFee: 5,
      tax: 15,
      orderStatus: "PREPARING",
      orderOtp: expectedOtp,
      deliveryPartner: assignedCourier._id,
      paymentMethod: "UPI",
      paymentStatus: "PENDING",
      deliveryAddress: {
        fullName: "Aarav Sharma",
        phone: "+91 98980 12345",
        houseFlat: "Flat 402, Shivam Residency",
        area: "Navrangpura",
        city: "Ahmedabad",
        pincode: "380009",
      },
    });

    console.log(`✓ Test order created: #${testOrder.orderNumber} (Real OTP: ${expectedOtp})`);
    console.log(`  Assigned Partner: ${assignedCourier.name} (${assignedCourier._id})`);
    console.log(`  Unauthorized Partner: ${unauthorizedCourier.name} (${unauthorizedCourier._id})\n`);

    // Helper to send HTTP requests to verify-otp
    const sendVerifyOtpRequest = async (token, orderId, body) => {
      const res = await fetch(`${API_BASE}/delivery/orders/${orderId}/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return { status: res.status, data };
    };

    // TEST 1: Invalid Order Status (Order is PREPARING, not PICKED_UP or OUT_FOR_DELIVERY)
    console.log("TEST 1: Delivery attempt when order is in invalid status ('PREPARING')...");
    {
      const { status, data } = await sendVerifyOtpRequest(assignedToken, testOrder._id, {
        otp: expectedOtp,
      });
      if (status === 400 && data.success === false) {
        console.log(`  [PASS] Correctly rejected: HTTP ${status} - "${data.message}"`);
      } else {
        throw new Error(`TEST 1 FAILED! Expected HTTP 400, got ${status}: ${JSON.stringify(data)}`);
      }

      // Verify DB unchanged
      const checkDb = await Order.findById(testOrder._id);
      if (checkDb.orderStatus !== "PREPARING") {
        throw new Error(`TEST 1 FAILED! Database was mutated to ${checkDb.orderStatus}`);
      }
      console.log(`  [PASS] MongoDB check: orderStatus remains '${checkDb.orderStatus}'\n`);
    }

    // Advance order to PICKED_UP
    testOrder.orderStatus = "PICKED_UP";
    await testOrder.save();
    console.log(`✓ Advanced test order status to 'PICKED_UP'\n`);

    // TEST 2: Missing OTP (empty body {}) -> The original audit vulnerability!
    console.log("TEST 2: Bypass attempt with completely MISSING OTP (body: {})...");
    {
      const { status, data } = await sendVerifyOtpRequest(assignedToken, testOrder._id, {});
      if (status === 400 && data.success === false) {
        console.log(`  [PASS] Correctly rejected: HTTP ${status} - "${data.message}"`);
      } else {
        throw new Error(`TEST 2 FAILED (Bypass still exists)! Expected HTTP 400, got ${status}: ${JSON.stringify(data)}`);
      }

      // Verify DB unchanged
      const checkDb = await Order.findById(testOrder._id);
      if (checkDb.orderStatus !== "PICKED_UP") {
        throw new Error(`TEST 2 FAILED! Database was mutated to ${checkDb.orderStatus}`);
      }
      console.log(`  [PASS] MongoDB check: orderStatus remains '${checkDb.orderStatus}'\n`);
    }

    // TEST 3: Empty / Whitespace OTP (body: { otp: "   " })
    console.log("TEST 3: Bypass attempt with EMPTY whitespace OTP (body: { otp: '   ' })...");
    {
      const { status, data } = await sendVerifyOtpRequest(assignedToken, testOrder._id, {
        otp: "   ",
      });
      if (status === 400 && data.success === false) {
        console.log(`  [PASS] Correctly rejected: HTTP ${status} - "${data.message}"`);
      } else {
        throw new Error(`TEST 3 FAILED! Expected HTTP 400, got ${status}: ${JSON.stringify(data)}`);
      }

      const checkDb = await Order.findById(testOrder._id);
      if (checkDb.orderStatus !== "PICKED_UP") {
        throw new Error(`TEST 3 FAILED! Database was mutated to ${checkDb.orderStatus}`);
      }
      console.log(`  [PASS] MongoDB check: orderStatus remains '${checkDb.orderStatus}'\n`);
    }

    // TEST 4: Malformed OTP (body: { otp: "12" } and { otp: "abcd" })
    console.log("TEST 4: Malformed OTP format checks ({ otp: '12' }, { otp: 'abc9' })...");
    {
      const res1 = await sendVerifyOtpRequest(assignedToken, testOrder._id, { otp: "12" });
      const res2 = await sendVerifyOtpRequest(assignedToken, testOrder._id, { otp: "abc9" });

      if (res1.status === 400 && res2.status === 400) {
        console.log(`  [PASS] Rejected short OTP: HTTP ${res1.status} - "${res1.data.message}"`);
        console.log(`  [PASS] Rejected non-numeric OTP: HTTP ${res2.status} - "${res2.data.message}"`);
      } else {
        throw new Error(`TEST 4 FAILED! Expected format rejection.`);
      }

      const checkDb = await Order.findById(testOrder._id);
      if (checkDb.orderStatus !== "PICKED_UP") {
        throw new Error(`TEST 4 FAILED! Database was mutated to ${checkDb.orderStatus}`);
      }
      console.log(`  [PASS] MongoDB check: orderStatus remains '${checkDb.orderStatus}'\n`);
    }

    // TEST 5: Incorrect OTP (body: { otp: "0000" })
    console.log(`TEST 5: Incorrect OTP submission ({ otp: '0000' } vs real '${expectedOtp}')...`);
    {
      const { status, data } = await sendVerifyOtpRequest(assignedToken, testOrder._id, {
        otp: "0000",
      });
      if (status === 400 && data.success === false) {
        console.log(`  [PASS] Correctly rejected: HTTP ${status} - "${data.message}"`);
      } else {
        throw new Error(`TEST 5 FAILED! Expected HTTP 400, got ${status}: ${JSON.stringify(data)}`);
      }

      const checkDb = await Order.findById(testOrder._id);
      if (checkDb.orderStatus !== "PICKED_UP") {
        throw new Error(`TEST 5 FAILED! Database was mutated to ${checkDb.orderStatus}`);
      }
      console.log(`  [PASS] MongoDB check: orderStatus remains '${checkDb.orderStatus}'\n`);
    }

    // TEST 6: Wrong Delivery Partner (Unauthorized courier attempting to complete delivery)
    console.log("TEST 6: Wrong delivery agent attempt (unauthorized courier)...");
    {
      const { status, data } = await sendVerifyOtpRequest(unauthorizedToken, testOrder._id, {
        otp: expectedOtp,
      });
      if (status === 403 && data.success === false) {
        console.log(`  [PASS] Correctly forbidden: HTTP ${status} - "${data.message}"`);
      } else {
        throw new Error(`TEST 6 FAILED! Expected HTTP 403, got ${status}: ${JSON.stringify(data)}`);
      }

      const checkDb = await Order.findById(testOrder._id);
      if (checkDb.orderStatus !== "PICKED_UP") {
        throw new Error(`TEST 6 FAILED! Database was mutated to ${checkDb.orderStatus}`);
      }
      console.log(`  [PASS] MongoDB check: orderStatus remains '${checkDb.orderStatus}'\n`);
    }

    // TEST 7: Valid OTP with assigned courier -> Expected Success
    console.log(`TEST 7: Valid OTP submission with assigned partner ({ otp: '${expectedOtp}' })...`);
    {
      const { status, data } = await sendVerifyOtpRequest(assignedToken, testOrder._id, {
        otp: expectedOtp,
      });
      if (status === 200 && data.success === true) {
        console.log(`  [PASS] Delivery confirmed: HTTP 200 - "${data.message}"`);
        console.log(`  [PASS] Credited earning: ₹${data.earning?.totalEarning}`);
      } else {
        throw new Error(`TEST 7 FAILED! Expected HTTP 200, got ${status}: ${JSON.stringify(data)}`);
      }

      // Verify DB mutated to DELIVERED
      const checkDb = await Order.findById(testOrder._id);
      if (checkDb.orderStatus !== "DELIVERED") {
        throw new Error(`TEST 7 FAILED! Expected DELIVERED, got ${checkDb.orderStatus}`);
      }
      if (checkDb.paymentStatus !== "SUCCESS") {
        throw new Error(`TEST 7 FAILED! Expected paymentStatus SUCCESS, got ${checkDb.paymentStatus}`);
      }
      if (!checkDb.deliveredAt) {
        throw new Error("TEST 7 FAILED! deliveredAt was not recorded.");
      }
      console.log(`  [PASS] MongoDB check: orderStatus='${checkDb.orderStatus}', paymentStatus='${checkDb.paymentStatus}', deliveredAt recorded.\n`);
    }

    // TEST 8: Replay Attack (Attempting to re-verify already DELIVERED order)
    console.log("TEST 8: Replay attack (Attempting verify-otp on already DELIVERED order)...");
    {
      const { status, data } = await sendVerifyOtpRequest(assignedToken, testOrder._id, {
        otp: expectedOtp,
      });
      if (status === 400 && data.success === false) {
        console.log(`  [PASS] Correctly rejected: HTTP ${status} - "${data.message}"\n`);
      } else {
        throw new Error(`TEST 8 FAILED! Expected HTTP 400 for already delivered order, got ${status}`);
      }
    }

    // TEST 9: PATCH /api/orders/:id/status with DELIVERED but MISSING OTP
    console.log("TEST 9: PATCH /orders/:id/status with status='DELIVERED' and MISSING OTP...");
    let orderForStatusTest = await Order.create({
      orderNumber: `TEST-ORD-${Date.now().toString().slice(-6)}`,
      customer: testCustomer ? testCustomer._id : assignedCourier._id,
      restaurant: testRestaurant ? testRestaurant._id : assignedCourier._id,
      items: [{ name: "Status Test Item", price: 150, quantity: 1, itemTotal: 150 }],
      subtotal: 150,
      totalAmount: 190,
      deliveryFee: 35,
      platformFee: 5,
      tax: 0,
      orderStatus: "OUT_FOR_DELIVERY",
      orderOtp: "9832",
      deliveryPartner: assignedCourier._id,
      paymentMethod: "UPI",
      paymentStatus: "PENDING",
      deliveryAddress: {
        fullName: "Aarav Sharma",
        phone: "+91 98980 12345",
        houseFlat: "Flat 402",
        area: "Navrangpura",
        city: "Ahmedabad",
        pincode: "380009",
      },
    });

    try {
      const resWithoutOtp = await fetch(`${API_BASE}/orders/${orderForStatusTest._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${assignedToken}`,
        },
        body: JSON.stringify({ status: "DELIVERED" }),
      });
      const dataWithoutOtp = await resWithoutOtp.json();

      if (resWithoutOtp.status === 400 && dataWithoutOtp.success === false) {
        console.log(`  [PASS] Correctly rejected: HTTP ${resWithoutOtp.status} - "${dataWithoutOtp.message}"`);
      } else {
        throw new Error(`TEST 9 FAILED! Expected HTTP 400, got ${resWithoutOtp.status}: ${JSON.stringify(dataWithoutOtp)}`);
      }

      // Verify DB unchanged
      const checkDb = await Order.findById(orderForStatusTest._id);
      if (checkDb.orderStatus !== "OUT_FOR_DELIVERY") {
        throw new Error(`TEST 9 FAILED! Database was mutated to ${checkDb.orderStatus}`);
      }
      console.log(`  [PASS] MongoDB check: orderStatus remains '${checkDb.orderStatus}'\n`);

      // TEST 10: PATCH /api/orders/:id/status with status='DELIVERED' and VALID OTP
      console.log("TEST 10: PATCH /orders/:id/status with status='DELIVERED' and VALID OTP ('9832')...");
      const resWithOtp = await fetch(`${API_BASE}/orders/${orderForStatusTest._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${assignedToken}`,
        },
        body: JSON.stringify({ status: "DELIVERED", otp: "9832" }),
      });
      const dataWithOtp = await resWithOtp.json();

      if (resWithOtp.status === 200 && dataWithOtp.success === true) {
        console.log(`  [PASS] Status updated to DELIVERED: HTTP 200 - "${dataWithOtp.message}"\n`);
      } else {
        throw new Error(`TEST 10 FAILED! Expected HTTP 200, got ${resWithOtp.status}: ${JSON.stringify(dataWithOtp)}`);
      }
    } finally {
      await Order.findByIdAndDelete(orderForStatusTest._id);
    }

    console.log("==========================================================");
    console.log("ALL 10 OTP SECURITY TEST CASES PASSED SUCCESSFULLY!");
    console.log("==========================================================");
  } finally {
    // Clean up test order and earnings
    if (testOrder && testOrder._id) {
      await Order.findByIdAndDelete(testOrder._id);
      await DeliveryEarning.deleteMany({ order: testOrder._id });
      console.log(`\n✓ Cleaned up test order #${testOrder.orderNumber}`);
    }
    if (unauthorizedCourier && unauthorizedCourier.email.startsWith("rogue_courier_")) {
      await User.findByIdAndDelete(unauthorizedCourier._id);
    }
    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB Atlas\n");
  }
};

runOtpSecurityTests().catch((err) => {
  console.error("FATAL ERROR in OTP Security Suite:", err);
  process.exit(1);
});
