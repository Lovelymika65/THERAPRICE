import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = (process.env.PAWAPAY_BASE_URL || "").replace(/\/$/, "");
const TOKEN = process.env.PAWAPAY_TOKEN;
const MTN_CAMEROON = "MTN_MOMO_CMR";
const ORANGE_CAMEROON = "ORANGE_CMR";
const SUPPORTED_PROVIDERS = new Set([MTN_CAMEROON, ORANGE_CAMEROON]);

const client = axios.create({
  timeout: 30000,
  httpsAgent: new https.Agent({ keepAlive: true, keepAliveMsecs: 30000, maxSockets: 5, maxFreeSockets: 5 }),
});

function ensureConfigured() {
  if (!BASE_URL || !TOKEN) throw new Error("pawaPay is not configured");
}

function normalisePhone(phone) {
  let value = String(phone || "").trim().replace(/\D/g, "");
  if (!value.startsWith("237")) value = `237${value}`;
  // Mobile Money payments are only accepted from Cameroon mobile numbers.
  if (!/^2376\d{8}$/.test(value)) {
    throw new Error("Enter a valid Cameroon mobile number (237 followed by 9 digits starting with 6)");
  }
  return value;
}

function normaliseAmount(amount) {
  const value = Number(amount);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("Amount must be a positive whole XAF amount");
  }
  return value;
}

function paymentError(error) {
  return error.response?.data?.errorMessage || error.response?.data?.message || error.message;
}

export async function initiatePayment({ phone, amount, provider = MTN_CAMEROON }) {
  ensureConfigured();
  if (!SUPPORTED_PROVIDERS.has(provider)) throw new Error("Choose MTN Mobile Money or Orange Money Cameroon");

  const depositId = uuidv4();
  const payload = {
    depositId,
    amount: String(normaliseAmount(amount)),
    currency: "XAF",
    country: "CMR",
    correspondent: provider,
    payer: { type: "MSISDN", address: { value: normalisePhone(phone) } },
    customerTimestamp: new Date().toISOString(),
    statementDescription: "TheraPrice payment",
  };

  try {
    // This service uses the pawaPay v1 payload, whose production endpoint is /deposits.
    const response = await client.post(`${BASE_URL}/deposits`, payload, {
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    });
    if (response.data.status === "REJECTED") {
      return { transactionId: depositId, depositId, status: "REJECTED", error: response.data.rejectionReason?.rejectionMessage || "Payment rejected" };
    }
    return { transactionId: depositId, depositId, status: response.data.status || "ACCEPTED" };
  } catch (error) {
    return { transactionId: depositId, depositId, status: "FAILED", error: paymentError(error) };
  }
}

export async function getPaymentStatus(depositId) {
  ensureConfigured();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(depositId)) {
    throw new Error("Invalid deposit ID");
  }
  try {
    const response = await client.get(`${BASE_URL}/deposits/${depositId}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    // v1 returns the deposit directly; tolerate the v2 wrapper during migration.
    const data = response.data?.data || response.data;
    return { transactionId: depositId, depositId, status: data.status || "UNKNOWN", data };
  } catch (error) {
    return { transactionId: depositId, depositId, status: "ERROR", error: paymentError(error) };
  }
}

export async function initiatePayout({ phone, amount, provider = MTN_CAMEROON, orderId, phase }) {
  ensureConfigured();
  if (!SUPPORTED_PROVIDERS.has(provider)) throw new Error("Choose MTN Mobile Money or Orange Money Cameroon");
  const payoutId = uuidv4();
  const payload = {
    payoutId,
    amount: String(normaliseAmount(amount)),
    currency: "XAF",
    country: "CMR",
    correspondent: provider,
    recipient: { type: "MSISDN", address: { value: normalisePhone(phone) } },
    customerTimestamp: new Date().toISOString(),
    statementDescription: phase === "farmer_40" ? "TheraPrice payout" : "TheraPrice delivery",
    metadata: [{ fieldName: "orderId", fieldValue: String(orderId || "") }],
  };
  const response = await client.post(`${BASE_URL}/payouts`, payload, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  });
  if (response.data.status === "REJECTED") throw new Error(response.data.rejectionReason?.rejectionMessage || "Payout rejected");
  return { payoutId, status: response.data.status || "ACCEPTED" };
}
