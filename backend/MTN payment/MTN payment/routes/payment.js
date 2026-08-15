import express from "express";
import { getPaymentStatus, initiatePayment, initiatePayout } from "../services/pawapay.js";

const router = express.Router();

function requireInternalKey(req, res, next) {
  const key = process.env.PAYMENT_INTERNAL_KEY;
  if (!key || req.get("x-payment-internal-key") !== key) return res.status(403).json({ error: "Forbidden" });
  next();
}

router.post("/pay", async (req, res) => {
  try {
    const result = await initiatePayment(req.body || {});
    return res.status(result.status === "FAILED" || result.status === "REJECTED" ? 400 : 202).json(result);
  } catch (error) {
    return res.status(400).json({ status: "REJECTED", error: error.message });
  }
});

// Public polling is limited to an opaque UUID deposit ID; no phone or token is exposed.
router.get("/status/:depositId", async (req, res) => {
  try {
    return res.json(await getPaymentStatus(req.params.depositId));
  } catch (error) {
    return res.status(400).json({ status: "ERROR", error: error.message });
  }
});

// The application backend uses this endpoint before treating an order as paid.
router.get("/internal/deposits/:depositId", requireInternalKey, async (req, res) => {
  try {
    return res.json(await getPaymentStatus(req.params.depositId));
  } catch (error) {
    return res.status(400).json({ status: "ERROR", error: error.message });
  }
});

router.post("/internal/payout", requireInternalKey, async (req, res) => {
  try {
    return res.status(202).json(await initiatePayout(req.body || {}));
  } catch (error) {
    return res.status(400).json({ status: "REJECTED", error: error.message });
  }
});

export default router;
