import crypto from "crypto";

/**
 * Normalizes phone numbers to standard E.164 format.
 * Defaults to India (+91) if no country code provided.
 */
export const normalizePhoneNumber = (rawPhone, defaultCountryCode = "+91") => {
  if (!rawPhone || typeof rawPhone !== "string") {
    throw new Error("Invalid phone number provided.");
  }

  // Remove spaces, hyphens, parentheses, and other punctuation
  let cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, "");

  // If already starts with '+', validate digits
  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1);
    if (!/^\d{10,14}$/.test(digits)) {
      throw new Error("Please enter a valid international phone number.");
    }
    return cleaned;
  }

  // If starts with 00, replace with +
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
    if (!/^\+\d{10,14}$/.test(cleaned)) {
      throw new Error("Please enter a valid international phone number.");
    }
    return cleaned;
  }

  // If starts with leading 0 (domestic trunk prefix), strip it
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  // Standard 10-digit mobile number
  if (/^\d{10}$/.test(cleaned)) {
    return `${defaultCountryCode}${cleaned}`;
  }

  // If already contains country code without +
  if (/^91\d{10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  if (/^\d{11,14}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  throw new Error("Please enter a valid 10-digit mobile number.");
};

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 */
export const generateSecureOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Computes a secure HMAC-SHA256 hash of the OTP using the system secret.
 */
export const hashOtp = (otp) => {
  const secret = process.env.JWT_SECRET || "bitego_otp_secret_key_salt";
  return crypto.createHmac("sha256", secret).update(String(otp).trim()).digest("hex");
};

/**
 * Verifies a candidate OTP against a stored hash using timing-safe comparison.
 */
export const verifyOtpHash = (candidateOtp, storedHash) => {
  if (!candidateOtp || !storedHash) return false;
  const candidateHash = hashOtp(candidateOtp);
  try {
    const candidateBuf = Buffer.from(candidateHash, "hex");
    const storedBuf = Buffer.from(storedHash, "hex");
    if (candidateBuf.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(candidateBuf, storedBuf);
  } catch {
    return false;
  }
};

/**
 * Dispatches an SMS verification code via configured SMS provider.
 * Supports Twilio, MSG91, or Development Sandbox when credentials are unconfigured.
 */
export const dispatchSmsOtp = async ({ phoneNumber, otp }) => {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  const msg91Key = process.env.MSG91_AUTH_KEY;
  const msg91Template = process.env.MSG91_TEMPLATE_ID;

  // 1. Twilio SMS Provider
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const body = new URLSearchParams({
        To: phoneNumber,
        From: twilioFrom,
        Body: `Your BiteGo verification code is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,
      });

      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        }
      );

      const twilioData = await res.json();
      if (!res.ok) {
        console.error("[SMS Service] Twilio dispatch error:", twilioData.message || twilioData);
        throw new Error("Failed to dispatch SMS via Twilio provider.");
      }

      return { success: true, provider: "twilio" };
    } catch (err) {
      console.error("[SMS Service] Twilio delivery exception:", err.message);
      throw err;
    }
  }

  // 2. MSG91 SMS Provider
  if (msg91Key && msg91Template) {
    try {
      const res = await fetch("https://control.msg91.com/api/v5/otp", {
        method: "POST",
        headers: {
          authkey: msg91Key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_id: msg91Template,
          mobile: phoneNumber.replace("+", ""),
          otp,
        }),
      });

      const msgData = await res.json();
      if (!res.ok || msgData.type === "error") {
        console.error("[SMS Service] MSG91 dispatch error:", msgData);
        throw new Error("Failed to dispatch SMS via MSG91 provider.");
      }

      return { success: true, provider: "msg91" };
    } catch (err) {
      console.error("[SMS Service] MSG91 delivery exception:", err.message);
      throw err;
    }
  }

  // 3. Development / Sandbox Provider
  // Used when no third-party SMS provider credentials are configured in .env.
  // In production, an error is thrown to avoid silent non-delivery.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SMS provider credentials are not configured. Please set TWILIO_ACCOUNT_SID or MSG91_AUTH_KEY in .env."
    );
  }

  console.log(
    `[SMS Service - Dev Sandbox] Dispatched OTP to ${phoneNumber.slice(0, 3)}****${phoneNumber.slice(
      -4
    )}. (Set TWILIO_ACCOUNT_SID or MSG91_AUTH_KEY for live delivery).`
  );

  return { success: true, provider: "sandbox" };
};
