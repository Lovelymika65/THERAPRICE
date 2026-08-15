import express from "express";
import { initiatePayment, initiatePayout, getPaymentStatus } from "../services/pawapay.js";

const router = express.Router();

router.post("/pay", async (req, res) => {
  try {
    console.log("📨 Payment request received:", req.body);

    const result = await initiatePayment(req.body);

    console.log("📤 Payment initiation result:", result);

    // Check if payment initiation failed or was rejected
    if (result.status === "FAILED") {
      return res.status(400).json({
        transactionId: result.transactionId,
        status: "FAILED",
        error: result.error,
        depositId: result.depositId
      });
    }

    if (result.status === "REJECTED") {
      return res.status(400).json({
        transactionId: result.transactionId,
        status: "REJECTED",
        error: result.error,
        depositId: result.depositId
      });
    }

    // Payment initiated successfully
    res.json(result);
  } catch (error) {
    console.error("💥 Unexpected error in payment route:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      details: error.message,
      status: "ERROR"
    });
  }
});

router.get("/status/:id", async (req, res) => {
  try {
    console.log("📊 Status check request for transaction:", req.params.id);

    const result = await getPaymentStatus(req.params.id);

    console.log("📤 Status check result:", result);

    res.json(result);
  } catch (error) {
    console.error("💥 Unexpected error in status route:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

router.post("/internal/payout", async (req, res) => {
  // Payout authorisation stays between the application backend and this
  // payment service. Do not expose this capability to public browser calls.
  if (!process.env.PAYMENT_INTERNAL_KEY || req.get("x-payment-internal-key") !== process.env.PAYMENT_INTERNAL_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    res.status(202).json(await initiatePayout(req.body));
  } catch (error) {
    res.status(400).json({ status: "REJECTED", error: error.message });
  }
});

export default router;
