import User from "../models/User.js";
import MerchantApplication from "../models/MerchantApplication.js";
import DeliveryApplication from "../models/DeliveryApplication.js";

export const seedSuperAdminAndDemoAccounts = async () => {
  try {
    const superAdminEmail =
      process.env.SUPERADMIN_EMAIL || "superadmin@bitego.com";
    const superAdminPassword =
      process.env.SUPERADMIN_PASSWORD || "SuperAdmin@123";

    // 1. Super Admin Check / Create
    let superAdmin = await User.findOne({ role: "superadmin" });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: "Vikramaditya S.",
        email: superAdminEmail.toLowerCase(),
        password: superAdminPassword,
        phone: "+91 99090 12345",
        role: "superadmin",
        verificationStatus: "approved",
        isActive: true,
      });
      console.log(`[Seed] Super Admin initialized: ${superAdmin.email}`);
    }

    // 2. Operational Admin
    const adminEmail = "admin@bitego.com";
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: "Neha Rajput",
        email: adminEmail,
        password: "Admin@123",
        phone: "+91 98250 44321",
        role: "admin",
        verificationStatus: "approved",
        isActive: true,
      });
      console.log(`[Seed] Admin initialized: ${admin.email}`);
    } else {
      admin.name = "Neha Rajput";
      admin.password = "Admin@123";
      admin.role = "admin";
      admin.verificationStatus = "approved";
      admin.isActive = true;
      await admin.save();
      console.log(`[Seed] Admin refreshed: ${admin.email}`);
    }

    // 3. Approved Merchant
    const approvedMerchantEmail = "merchant@darkroast.com";
    let appMerchant = await User.findOne({ email: approvedMerchantEmail });
    if (!appMerchant) {
      appMerchant = await User.create({
        name: "Chef Vikram Patel",
        email: approvedMerchantEmail,
        password: "Merchant@123",
        phone: "+91 79 4002 9182",
        role: "merchant",
        verificationStatus: "approved",
        isActive: true,
      });

      await MerchantApplication.create({
        userId: appMerchant._id,
        restaurantName: "The Dark Roast Pizzeria",
        ownerName: "Chef Vikram Patel",
        email: approvedMerchantEmail,
        phone: "+91 79 4002 9182",
        address: "Sindhu Bhavan Express Branch, Bodakdev",
        hub: "Bodakdev Hub",
        category: "Italian • Gourmet Neapolitan Pizza",
        fssaiNumber: "108230049281",
        gstin: "24AAECB1029P1Z2",
        requestedCommission: 16.0,
        status: "approved",
      });
    }

    // 4. Pending Merchant (for Admin Review desk)
    const pendingMerchantEmail = "pendingmerchant@pizzeria.com";
    let penMerchant = await User.findOne({ email: pendingMerchantEmail });
    if (!penMerchant) {
      penMerchant = await User.create({
        name: "Hitesh Shah",
        email: pendingMerchantEmail,
        password: "Merchant@123",
        phone: "+91 79 2550 6555",
        role: "merchant",
        verificationStatus: "pending",
        isActive: true,
      });

      await MerchantApplication.create({
        userId: penMerchant._id,
        restaurantName: "Shree Thaker Gujarati Dining",
        ownerName: "Hitesh Shah",
        email: pendingMerchantEmail,
        phone: "+91 79 2550 6555",
        address: "Ellis Bridge Flagship, Ahmedabad",
        hub: "Ellis Bridge Hub",
        category: "Authentic Pure-Veg Gujarati Thali",
        fssaiNumber: "108240098765",
        gstin: "24AAACR1234F1Z1",
        requestedCommission: 18.0,
        status: "pending",
      });
    }

    // 5. Approved Delivery Partner
    const approvedDeliveryEmail = "delivery@bitego.com";
    let appDelivery = await User.findOne({ email: approvedDeliveryEmail });
    if (!appDelivery) {
      appDelivery = await User.create({
        name: "Rajesh Vaghela",
        email: approvedDeliveryEmail,
        password: "Delivery@123",
        phone: "+91 98980 55667",
        role: "delivery",
        verificationStatus: "approved",
        isActive: true,
        isOnline: true,
        isAvailable: true,
      });

      await DeliveryApplication.create({
        userId: appDelivery._id,
        fullName: "Rajesh Vaghela",
        email: approvedDeliveryEmail,
        phone: "+91 98980 55667",
        dob: "1996-05-14",
        address: "Bodakdev Core, Ahmedabad",
        vehicleType: "Bike",
        vehicleNumber: "GJ-01-ET-4501",
        drivingLicenseNumber: "GJ0120150049281",
        vehicleRCNumber: "RC-GJ01-2022-881",
        governmentId: "AADHAAR-891029102",
        status: "approved",
      });
    }

    // 6. Pending Delivery Partner
    const pendingDeliveryEmail = "pendingdelivery@bitego.com";
    let penDelivery = await User.findOne({ email: pendingDeliveryEmail });
    if (!penDelivery) {
      penDelivery = await User.create({
        name: "Amit Kumar Solanki",
        email: pendingDeliveryEmail,
        password: "Delivery@123",
        phone: "+91 97240 88991",
        role: "delivery",
        verificationStatus: "pending",
        isActive: true,
      });

      await DeliveryApplication.create({
        userId: penDelivery._id,
        fullName: "Amit Kumar Solanki",
        email: pendingDeliveryEmail,
        phone: "+91 97240 88991",
        dob: "1998-11-20",
        address: "Vastrapur Lake Rd, Ahmedabad",
        vehicleType: "Scooter",
        vehicleNumber: "GJ-01-CK-9920",
        drivingLicenseNumber: "GJ0120190088123",
        vehicleRCNumber: "RC-GJ01-2021-440",
        governmentId: "AADHAAR-449102941",
        status: "pending",
      });
    }

    // 7. Normal Customer
    const customerEmail = "customer@bitego.com";
    let customer = await User.findOne({ email: customerEmail });
    if (!customer) {
      customer = await User.create({
        name: "Ananya Sharma",
        email: customerEmail,
        password: "Customer@123",
        phone: "+91 98765 43210",
        role: "customer",
        verificationStatus: "approved",
        isActive: true,
        address: "Sindhu Bhavan Rd, Bodakdev",
      });
      console.log(`[Seed] Customer initialized: ${customer.email}`);
    }
  } catch (error) {
    console.error("Super Admin & Demo Accounts Seed Error:", error.message);
  }
};

// Standalone CLI execution support: node config/seedSuperAdmin.js
if (process.argv[1] && (process.argv[1].endsWith("seedSuperAdmin.js") || process.argv[1].includes("seedSuperAdmin"))) {
  import("dotenv").then((dotenv) => {
    dotenv.default.config();
    import("./db.js").then(async (dbModule) => {
      await dbModule.default();
      await seedSuperAdminAndDemoAccounts();
      console.log("[Seed] Super Admin & Demo Accounts seeded successfully.");
      process.exit(0);
    });
  });
}

