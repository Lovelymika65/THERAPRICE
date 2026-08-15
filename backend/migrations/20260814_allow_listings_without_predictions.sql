-- Marketplace listings are independent of the forecasting dataset.
-- A product may be listed even when its crop/region has no model prediction.
ALTER TABLE produce_listings
    DROP CONSTRAINT IF EXISTS fk_listing_price_prediction;
