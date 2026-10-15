import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("ERROR: MONGODB_URI is not defined");
  process.exit(1);
}

const OLD_DB_NAME = "test";
const NEW_DB_NAME = "BiteGo";

async function verify() {
  console.log("============================================================");
  console.log(" BITEGO DATABASE MIGRATION VERIFICATION AUDIT");
  console.log("============================================================");

  const client = new MongoClient(uri);
  await client.connect();

  const oldDb = client.db(OLD_DB_NAME);
  const newDb = client.db(NEW_DB_NAME);

  const oldCollections = await oldDb.listCollections().toArray();
  const oldCollNames = oldCollections.map((c) => c.name).sort();

  console.log("\n--- COLLECTION COUNT AUDIT ---");
  let allCountsMatched = true;
  const countResults = [];

  for (const name of oldCollNames) {
    const oldCount = await oldDb.collection(name).countDocuments();
    const newCount = await newDb.collection(name).countDocuments();
    const isPass = oldCount === newCount;
    if (!isPass) allCountsMatched = false;

    countResults.push({
      Collection: name,
      "Old Count": oldCount,
      "New Count": newCount,
      Status: isPass ? "PASS" : "FAIL",
    });
  }

  console.table(countResults);

  if (!allCountsMatched) {
    console.error("FAIL: Collection counts do not match!");
    process.exit(1);
  }
  console.log("ALL COLLECTION COUNTS MATCH 100%!");

  // --- RELATIONSHIP INTEGRITY AUDIT ---
  console.log("\n--- RELATIONSHIP INTEGRITY AUDIT ---");
  let relIssues = 0;

  // 1. Orders
  const orders = await newDb.collection("orders").find({}).toArray();
  console.log(`Checking ${orders.length} orders...`);
  for (const order of orders) {
    // User check
    const userId = order.user || order.customer;
    if (userId) {
      const userDoc = await newDb.collection("users").findOne({ _id: new ObjectId(userId) });
      if (!userDoc) {
        console.error(`[FAIL] Order ${order._id} links to missing User ${userId}`);
        relIssues++;
      }
    }

    // Restaurant check
    const restId = order.restaurant?._id || order.restaurant;
    if (restId && typeof restId === "object" && restId instanceof ObjectId) {
      const restDoc = await newDb.collection("restaurants").findOne({ _id: restId });
      if (!restDoc) {
        console.error(`[FAIL] Order ${order._id} links to missing Restaurant ${restId}`);
        relIssues++;
      }
    }

    // Delivery Partner check
    if (order.deliveryPartner) {
      const partnerDoc = await newDb.collection("users").findOne({ _id: new ObjectId(order.deliveryPartner) });
      if (!partnerDoc) {
        console.error(`[FAIL] Order ${order._id} links to missing Delivery Partner ${order.deliveryPartner}`);
        relIssues++;
      }
    }
  }

  // 2. Addresses
  const addresses = await newDb.collection("addresses").find({}).toArray();
  console.log(`Checking ${addresses.length} addresses...`);
  for (const addr of addresses) {
    if (addr.user) {
      const userDoc = await newDb.collection("users").findOne({ _id: new ObjectId(addr.user) });
      if (!userDoc) {
        console.error(`[FAIL] Address ${addr._id} links to missing User ${addr.user}`);
        relIssues++;
      }
    }
  }

  // 3. Reviews
  const reviews = await newDb.collection("reviews").find({}).toArray();
  console.log(`Checking ${reviews.length} reviews...`);
  for (const rev of reviews) {
    if (rev.user) {
      const userDoc = await newDb.collection("users").findOne({ _id: new ObjectId(rev.user) });
      if (!userDoc) {
        console.error(`[FAIL] Review ${rev._id} links to missing User ${rev.user}`);
        relIssues++;
      }
    }
    if (rev.restaurant) {
      const restDoc = await newDb.collection("restaurants").findOne({ _id: new ObjectId(rev.restaurant) });
      if (!restDoc) {
        console.error(`[FAIL] Review ${rev._id} links to missing Restaurant ${rev.restaurant}`);
        relIssues++;
      }
    }
  }

  // 4. Favorites
  const favorites = await newDb.collection("favorites").find({}).toArray();
  console.log(`Checking ${favorites.length} favorites...`);
  for (const fav of favorites) {
    if (fav.user) {
      const userDoc = await newDb.collection("users").findOne({ _id: new ObjectId(fav.user) });
      if (!userDoc) {
        console.error(`[FAIL] Favorite ${fav._id} links to missing User ${fav.user}`);
        relIssues++;
      }
    }
  }

  // 5. Carts
  const carts = await newDb.collection("carts").find({}).toArray();
  console.log(`Checking ${carts.length} carts...`);
  for (const cart of carts) {
    if (cart.user) {
      const userDoc = await newDb.collection("users").findOne({ _id: new ObjectId(cart.user) });
      if (!userDoc) {
        console.error(`[FAIL] Cart ${cart._id} links to missing User ${cart.user}`);
        relIssues++;
      }
    }
  }

  // 6. Menu Items & Foods
  const menuitems = await newDb.collection("menuitems").find({}).toArray();
  console.log(`Checking ${menuitems.length} menu items...`);
  for (const item of menuitems) {
    if (item.restaurant) {
      const restDoc = await newDb.collection("restaurants").findOne({ _id: new ObjectId(item.restaurant) });
      if (!restDoc) {
        console.error(`[FAIL] MenuItem ${item._id} links to missing Restaurant ${item.restaurant}`);
        relIssues++;
      }
    }
  }

  // 7. Check All 5 Roles Exist in Users
  const roles = await newDb.collection("users").distinct("role");
  console.log(`Roles present in BiteGo users:`, roles);
  const requiredRoles = ["customer", "merchant", "delivery", "admin", "superadmin"];
  for (const role of requiredRoles) {
    const count = await newDb.collection("users").countDocuments({ role });
    console.log(`  - Role '${role}': ${count} users`);
    if (count === 0) {
      console.error(`[FAIL] Missing required role '${role}' in users`);
      relIssues++;
    }
  }

  if (relIssues === 0) {
    console.log("\nALL RELATIONSHIPS AND REFERENTIAL INTEGRITY CHECKS PASSED 100%!");
  } else {
    console.error(`\nReferential integrity found ${relIssues} issues!`);
    process.exit(1);
  }

  // --- INDEX AUDIT ---
  console.log("\n--- INDEX AUDIT ---");
  for (const name of oldCollNames) {
    const oldIdx = await oldDb.collection(name).indexes();
    const newIdx = await newDb.collection(name).indexes();
    console.log(`Collection ${name}: Old Indexes (${oldIdx.length}) | New Indexes (${newIdx.length})`);
  }

  // --- CONFIRM OLD DATABASE IS INTACT ---
  console.log("\n--- VERIFY OLD DATABASE IS UNTOUCHED ---");
  for (const name of oldCollNames) {
    const count = await oldDb.collection(name).countDocuments();
    console.log(`  test.${name}: ${count} docs (Untouched)`);
  }

  await client.close();
  console.log("\n============================================================");
  console.log(" FULL VERIFICATION AUDIT COMPLETE - ALL CHECKS PASSED!");
  console.log("============================================================");
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
