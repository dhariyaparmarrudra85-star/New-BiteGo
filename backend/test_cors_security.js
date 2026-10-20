import express from "express";
import cors from "cors";

// Helper function implementing exact server.js CORS logic
const buildCorsMiddleware = (envMode, clientUrl, allowedOriginsEnv) => {
  const isProduction = envMode === "production";

  const parseConfiguredOrigins = () => {
    const sources = [clientUrl, allowedOriginsEnv];
    const origins = [];

    for (const raw of sources) {
      if (raw && typeof raw === "string") {
        raw
          .split(",")
          .map((s) => s.trim().replace(/\/+$/, ""))
          .filter((s) => s.length > 0)
          .forEach((origin) => {
            if (!origins.includes(origin)) origins.push(origin);
          });
      }
    }
    return origins;
  };

  const configuredOrigins = parseConfiguredOrigins();

  const devOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
  ];

  const allowedOrigins = isProduction
    ? configuredOrigins
    : [...new Set([...configuredOrigins, ...devOrigins])];

  return cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      const normalized = origin.trim().replace(/\/+$/, "");
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400,
  });
};

const runCorsTestSuite = async () => {
  console.log("==========================================================");
  console.log("BiteGo — CORS Security & Origin Validation Test Suite");
  console.log("==========================================================\n");

  // SECTION 1: Test against live running server on port 5000 (Development mode)
  console.log("--- SECTION 1: Testing Live Running Server (Development Mode) ---");
  const LIVE_URL = "http://localhost:5000/";

  // TEST 1: Allowed Development Origin
  console.log("TEST 1: Request with allowed origin 'http://localhost:5173'...");
  {
    const res = await fetch(LIVE_URL, {
      headers: { Origin: "http://localhost:5173" },
    });
    const acao = res.headers.get("access-control-allow-origin");
    const acac = res.headers.get("access-control-allow-credentials");

    if (res.status === 200 && acao === "http://localhost:5173" && acac === "true") {
      console.log(`  [PASS] Allowed origin permitted: ACAO='${acao}', Credentials=${acac}`);
    } else {
      throw new Error(`TEST 1 FAILED! Expected ACAO='http://localhost:5173', got '${acao}'`);
    }
  }

  // TEST 2: Unapproved Origin in Development
  console.log("TEST 2: Request with unapproved origin 'http://malicious-hacker.com'...");
  {
    const res = await fetch(LIVE_URL, {
      headers: { Origin: "http://malicious-hacker.com" },
    });
    const acao = res.headers.get("access-control-allow-origin");

    if (!acao) {
      console.log("  [PASS] Unapproved origin blocked: ACAO header is correctly null/omitted.");
    } else {
      throw new Error(`TEST 2 FAILED (CORS LEAK)! Unapproved origin received ACAO='${acao}'`);
    }
  }

  // TEST 3: Request without Origin Header (curl / uptime monitor / server-to-server)
  console.log("TEST 3: Non-browser request without Origin header (curl / health check)...");
  {
    const res = await fetch(LIVE_URL);
    const data = await res.json();

    if (res.status === 200 && data.status === "Healthy") {
      console.log(`  [PASS] Non-browser request succeeded without Origin header: status=${res.status}`);
    } else {
      throw new Error(`TEST 3 FAILED! Non-browser request failed.`);
    }
  }

  // TEST 4: Preflight OPTIONS Request with Allowed Origin
  console.log("TEST 4: Preflight OPTIONS request from 'http://localhost:5173'...");
  {
    const res = await fetch(`${LIVE_URL}api/orders`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
      },
    });
    const acao = res.headers.get("access-control-allow-origin");
    const acam = res.headers.get("access-control-allow-methods");

    if (acao === "http://localhost:5173" && acam && acam.includes("POST")) {
      console.log(`  [PASS] Preflight approved: ACAO='${acao}', Allowed Methods: '${acam}'`);
    } else {
      throw new Error(`TEST 4 FAILED! Preflight failed: ACAO='${acao}', ACAM='${acam}'`);
    }
  }

  // TEST 5: Preflight OPTIONS Request with Unapproved Origin
  console.log("TEST 5: Preflight OPTIONS request from 'http://malicious-site.com'...");
  {
    const res = await fetch(`${LIVE_URL}api/orders`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://malicious-site.com",
        "Access-Control-Request-Method": "POST",
      },
    });
    const acao = res.headers.get("access-control-allow-origin");

    if (!acao) {
      console.log("  [PASS] Preflight blocked: No ACAO header present.\n");
    } else {
      throw new Error(`TEST 5 FAILED! Preflight was unethically allowed: ACAO='${acao}'`);
    }
  }

  // SECTION 2: Production Mode Simulation (NODE_ENV=production)
  console.log("--- SECTION 2: Testing Production Mode Enforcement (NODE_ENV=production) ---");

  // Spin up test server in production mode
  const prodApp = express();
  const PROD_CLIENT_URL = "https://bitego.vercel.app/, https://admin.bitego.com"; // with trailing slashes & spaces
  prodApp.use(buildCorsMiddleware("production", PROD_CLIENT_URL, ""));
  prodApp.get("/health", (req, res) => res.json({ ok: true }));

  const prodServer = prodApp.listen(5091);
  const PROD_URL = "http://localhost:5091/health";

  try {
    // TEST 6: Configured Production Origin (Normalized without trailing slash)
    console.log("TEST 6: Production request from configured origin 'https://bitego.vercel.app'...");
    {
      const res = await fetch(PROD_URL, {
        headers: { Origin: "https://bitego.vercel.app" },
      });
      const acao = res.headers.get("access-control-allow-origin");
      const acac = res.headers.get("access-control-allow-credentials");

      if (acao === "https://bitego.vercel.app" && acac === "true") {
        console.log(`  [PASS] Production origin permitted: ACAO='${acao}', Credentials=${acac}`);
      } else {
        throw new Error(`TEST 6 FAILED! Expected ACAO='https://bitego.vercel.app', got '${acao}'`);
      }
    }

    // TEST 7: Second Configured Origin in Comma-Separated List
    console.log("TEST 7: Production request from second configured origin 'https://admin.bitego.com'...");
    {
      const res = await fetch(PROD_URL, {
        headers: { Origin: "https://admin.bitego.com" },
      });
      const acao = res.headers.get("access-control-allow-origin");

      if (acao === "https://admin.bitego.com") {
        console.log(`  [PASS] Second production origin permitted: ACAO='${acao}'`);
      } else {
        throw new Error(`TEST 7 FAILED! Expected ACAO='https://admin.bitego.com', got '${acao}'`);
      }
    }

    // TEST 8: Localhost in Production Mode (Must be BLOCKED in production!)
    console.log("TEST 8: Request from 'http://localhost:5173' in PRODUCTION mode...");
    {
      const res = await fetch(PROD_URL, {
        headers: { Origin: "http://localhost:5173" },
      });
      const acao = res.headers.get("access-control-allow-origin");

      if (!acao) {
        console.log("  [PASS] Localhost is strictly BLOCKED in production mode (No ACAO header).");
      } else {
        throw new Error(`TEST 8 FAILED! Localhost was allowed in production mode: ACAO='${acao}'`);
      }
    }

    // TEST 9: Arbitrary Unknown Domain in Production Mode (Must be BLOCKED)
    console.log("TEST 9: Request from arbitrary domain 'https://untrusted-site.com' in production...");
    {
      const res = await fetch(PROD_URL, {
        headers: { Origin: "https://untrusted-site.com" },
      });
      const acao = res.headers.get("access-control-allow-origin");

      if (!acao) {
        console.log("  [PASS] Arbitrary domain blocked: No wildcard fallback.\n");
      } else {
        throw new Error(`TEST 9 FAILED! Production wildcard fallback detected: ACAO='${acao}'`);
      }
    }
  } finally {
    prodServer.close();
  }

  // SECTION 3: Production with Unconfigured / Missing Origin (Safe Failure Mode)
  console.log("--- SECTION 3: Safe Failure Mode (Production with empty CLIENT_URL) ---");
  const unconfiguredApp = express();
  unconfiguredApp.use(buildCorsMiddleware("production", "", ""));
  unconfiguredApp.get("/health", (req, res) => res.json({ ok: true }));

  const unconfiguredServer = unconfiguredApp.listen(5092);
  const UNCONFIGURED_URL = "http://localhost:5092/health";

  try {
    // TEST 10: Any browser cross-origin request when production has empty configuration
    console.log("TEST 10: Cross-origin request when CLIENT_URL is empty in production...");
    {
      const res = await fetch(UNCONFIGURED_URL, {
        headers: { Origin: "https://any-site.com" },
      });
      const acao = res.headers.get("access-control-allow-origin");

      if (!acao) {
        console.log("  [PASS] Safely blocked: Server does not crash or expose wildcard ACAO.\n");
      } else {
        throw new Error("TEST 10 FAILED! Unconfigured production allowed cross-origin access.");
      }
    }
  } finally {
    unconfiguredServer.close();
  }

  console.log("==========================================================");
  console.log("ALL 10 CORS SECURITY TEST CASES PASSED SUCCESSFULLY!");
  console.log("==========================================================");
};

runCorsTestSuite().catch((err) => {
  console.error("FATAL ERROR in CORS Test Suite:", err);
  process.exit(1);
});
