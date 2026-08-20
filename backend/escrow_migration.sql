-- Run once against an existing Theraprice PostgreSQL database.
-- Safe to re-run; it adds the fields required for the 40% / 57% / 3% ledger.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS farmer_40_amount_xaf INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS farmer_57_amount_xaf INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS farmer_40_payout_ref TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS farmer_57_payout_ref TEXT;
