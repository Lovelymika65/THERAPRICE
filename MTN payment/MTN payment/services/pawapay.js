import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.PAWAPAY_BASE_URL;
const TOKEN = process.env.PAWAPAY_TOKEN;

// Configure axios to prevent memory leaks and TLS socket warnings
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 5,
  maxFreeSockets: 5,
  timeout: 30000
});

axios.defaults.timeout = 30000;
axios.defaults.httpsAgent = httpsAgent;

// Store transactions temporarily
const transactions = {};

// 🔹 Initiate Payment
export const initiatePayment = async ({ phone, amount, provider }) => {
  const transactionId = uuidv4();
  const depositId = uuidv4();

  // Validate and format phone number
  // Accepts: 237XXXXXXXXX or 6XXXXXXXX or 2XXXXXXXX
  let formattedPhone = phone.trim().replace(/\D/g, ''); // Remove spaces and non-digits
  
  // If already has country code, keep it
  if (formattedPhone.startsWith('237')) {
    if (formattedPhone.length !== 12) {
      throw new Error("Invalid phone number. Must be 237 + 9 digits = 12 digits total");
    }
  } else {
    // Local format - must be 9 digits starting with 6 or 2
    if (formattedPhone.length !== 9) {
      throw new Error("Invalid phone number. Must be 9 digits or 237 + 9 digits");
    }
    if (!formattedPhone.match(/^[62][0-9]{8}$/)) {
      throw new Error("Invalid phone number. Must start with 6 or 2");
    }
    // Add country code
    formattedPhone = `237${formattedPhone}`;
  }
  
  console.log("📱 Formatted phone number:", formattedPhone);
  console.log("🏢 Provider:", provider);

  const payload = {
    depositId: depositId,
    amount: amount.toString(),
    currency: "XAF",
    country: "CMR",
    correspondent: provider, // MTN_CM, ORANGE_CM etc
    payer: {
      type: "MSISDN",
      address: {
        value: formattedPhone
      }
    },
    customerTimestamp: new Date().toISOString(),
    statementDescription: "Library Payment"
  };

  console.log("🔄 Initiating PawaPay payment with payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(
      `${BASE_URL}/v1/deposits`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    console.log("✅ PawaPay API Response:", JSON.stringify(response.data, null, 2));
    console.log("✅ Response Status:", response.status);

    // Check if payment was accepted or rejected
    const responseStatus = response.data.status;
    console.log("💾 Storing transaction status:", responseStatus);
    
    if (responseStatus === "REJECTED") {
      console.error("❌ Payment rejected:", response.data.rejectionReason);
      return {
        transactionId,
        status: "FAILED",
        error: response.data.rejectionReason?.rejectionMessage || "Payment rejected",
        depositId: response.data.depositId
      };
    }
    
    // Store transaction with the depositId from response
    transactions[transactionId] = {
      status: responseStatus || "PENDING",
      depositId: response.data.depositId,
      phone: formattedPhone,
      provider: provider
    };

    return {
      transactionId,
      status: responseStatus || "PENDING",
      depositId: response.data.depositId
    };

  } catch (error) {
    console.error("❌ PawaPay Error Details:");
    console.error("Error Message:", error.message);
    console.error("Error Code:", error.code);
    console.error("Response Status:", error.response?.status);
    console.error("Response Data:", JSON.stringify(error.response?.data, null, 2));

    // Don't throw error, return failed status instead
    return {
      transactionId,
      status: "FAILED",
      error: error.response?.data?.errorMessage || error.message
    };
  }
};

// 🔹 Check Payment Status
export const getPaymentStatus = async (transactionId) => {
  const tx = transactions[transactionId];

  if (!tx) {
    console.log(`❓ Transaction ${transactionId} not found`);
    return { status: "NOT_FOUND" };
  }

  // If already failed, return the error
  if (tx.status === "FAILED") {
    return {
      transactionId,
      status: "FAILED",
      error: tx.error
    };
  }

  try {
    console.log(`🔍 Checking status for depositId: ${tx.depositId}`);

    const response = await axios.get(
      `${BASE_URL}/v1/deposits/${tx.depositId}`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`
        },
        timeout: 30000,
        httpsAgent: httpsAgent
      }
    );

    console.log("✅ Status API Response Full:", JSON.stringify(response.data, null, 2));

    // Handle both object and array responses
    let statusData = response.data;
    if (Array.isArray(response.data) && response.data.length > 0) {
      statusData = response.data[0];
    }

    const status = statusData.status || "UNKNOWN";

    console.log("📊 Extracted status:", status);
    
    transactions[transactionId].status = status;

    return {
      transactionId,
      status: status,
      data: statusData
    };

  } catch (error) {
    console.error("❌ Status Check Error:");
    console.error("Error Message:", error.message);
    console.error("Response Status:", error.response?.status);
    console.error("Response Data:", JSON.stringify(error.response?.data, null, 2));

    return {
      transactionId,
      status: "ERROR",
      error: error.response?.data?.errorMessage || error.message
    };
  }
};

// Payouts are deliberately server-to-server only. Never call this directly
// from browser code: a buyer must not be able to choose a payout recipient.
export const initiatePayout = async ({ phone, amount, provider = "MTN_MOMO_CMR", orderId, phase }) => {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Payout amount must be a positive whole XAF amount");
  }
  let formattedPhone = String(phone || "").trim().replace(/\D/g, "");
  if (!formattedPhone.startsWith("237")) formattedPhone = `237${formattedPhone}`;
  if (!/^237[62]\d{8}$/.test(formattedPhone)) {
    throw new Error("Invalid Cameroon Mobile Money number for payout");
  }

  const payoutId = uuidv4();
  const payload = {
    payoutId,
    amount: String(amount),
    currency: "XAF",
    country: "CMR",
    correspondent: provider,
    recipient: { type: "MSISDN", address: { value: formattedPhone } },
    customerTimestamp: new Date().toISOString(),
    statementDescription: phase === "farmer_40" ? "TheraPrice40Payout" : "TheraPriceDelivery",
    metadata: [{ fieldName: "orderId", fieldValue: String(orderId) }]
  };
  const response = await axios.post(`${BASE_URL}/payouts`, payload, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    timeout: 30000
  });
  if (response.data.status === "REJECTED") {
    throw new Error(response.data.rejectionReason?.rejectionMessage || "Payout rejected");
  }
  return { payoutId, status: response.data.status, providerResponse: response.data };
};
