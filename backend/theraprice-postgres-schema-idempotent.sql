-- ============================================================
-- TheraPrice — PostgreSQL schema
-- Generated from the application's ER diagram (types.ts data model)
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- DROP EXISTING OBJECTS (makes this script safely re-runnable)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS price_alert_notifications CASCADE;
DROP TABLE IF EXISTS farmer_checkins CASCADE;
DROP TABLE IF EXISTS moment_comments CASCADE;
DROP TABLE IF EXISTS moments CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS listing_unit_options CASCADE;
DROP TABLE IF EXISTS produce_listings CASCADE;
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS price_predictions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS measuring_unit CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS verification_status CASCADE;
DROP TYPE IF EXISTS listing_category CASCADE;
DROP TYPE IF EXISTS quality_grade CASCADE;
DROP TYPE IF EXISTS listing_size CASCADE;
DROP TYPE IF EXISTS price_direction CASCADE;
DROP TYPE IF EXISTS confidence_tier CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS escrow_status CASCADE;
DROP TYPE IF EXISTS order_status_label CASCADE;
DROP TYPE IF EXISTS checkin_stage CASCADE;
DROP TYPE IF EXISTS alert_type CASCADE;

-- ------------------------------------------------------------
-- ENUM TYPES
-- ------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('farmer', 'buyer', 'institutional', 'admin');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE listing_category AS ENUM ('Vegetables', 'Tubers', 'Fruits', 'Grains', 'Spices');
CREATE TYPE quality_grade AS ENUM ('Premium', 'Grade A', 'Standard');
CREATE TYPE listing_size AS ENUM ('Small', 'Medium', 'Large');
CREATE TYPE price_direction AS ENUM ('Rising', 'Falling', 'Stable');
CREATE TYPE confidence_tier AS ENUM ('high', 'medium', 'low');
CREATE TYPE payment_method AS ENUM ('MTN Mobile Money', 'Orange Money');
CREATE TYPE payment_status AS ENUM ('paid_escrow', 'released_to_farmer', 'refunded');
CREATE TYPE order_status AS ENUM ('confirmed', 'in_transit', 'delivered', 'completed');
CREATE TYPE escrow_status AS ENUM ('held_in_escrow', 'released_to_farmer');
CREATE TYPE order_status_label AS ENUM ('Placed', 'Preparing', 'In Transit', 'Delivered', 'Completed');
CREATE TYPE checkin_stage AS ENUM ('Planting', 'Growing', 'Flowering', 'Harvest Ready', 'Harvesting');
CREATE TYPE alert_type AS ENUM ('sell_now', 'wait', 'price_drop', 'price_surge');

-- measuring_unit: internal codes only, never shown to users directly.
-- Frontend maps each code to a localized display label (English/French).
CREATE TYPE measuring_unit AS ENUM (
    'kg',
    'basket',
    'bag',
    'crate',
    'bunch',
    'tuber_count',
    'tin'
);

-- ------------------------------------------------------------
-- USER
-- ------------------------------------------------------------
CREATE TABLE users (
    id                      TEXT PRIMARY KEY,
    name                    TEXT NOT NULL,
    phone                   TEXT NOT NULL UNIQUE,
    email                   TEXT UNIQUE,
    role                    user_role NOT NULL,
    verification_status     verification_status NOT NULL DEFAULT 'unverified',
    rejection_reason        TEXT,
    trust_score             INTEGER NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
    location                TEXT NOT NULL,
    farm_name               TEXT,
    farm_size               TEXT,
    national_id_number      TEXT,
    id_card_photo_url       TEXT,
    selfie_photo_url        TEXT,
    realtime_photo_url      TEXT,
    farm_proof_photo_url    TEXT,
    contract_signed         BOOLEAN NOT NULL DEFAULT FALSE,
    device_locator_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash           TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- PRICE PREDICTION (reference/lookup data, keyed by crop + region)
-- ------------------------------------------------------------
CREATE TABLE price_predictions (
    crop_id                 TEXT PRIMARY KEY,
    crop_name               TEXT NOT NULL,
    region                  TEXT NOT NULL,
    current_price           INTEGER NOT NULL,
    direction               price_direction NOT NULL,
    direction_change_percent NUMERIC(6,2) NOT NULL DEFAULT 0,
    confidence_tier          confidence_tier NOT NULL,
    confidence_percentage    INTEGER NOT NULL CHECK (confidence_percentage BETWEEN 0 AND 100),
    last_updated             TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (crop_name, region)
);

-- ------------------------------------------------------------
-- PRICE HISTORY (time series, powers Year/Month/Day zoom UI)
-- One row per crop + region + date; both real past prices and
-- model-predicted future prices. Additive: does not replace
-- price_predictions, which still serves the current-snapshot badge.
-- ------------------------------------------------------------
CREATE TABLE price_history (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    crop_name               TEXT NOT NULL,
    region                  TEXT NOT NULL,
    price_date              DATE NOT NULL,
    price_xaf               INTEGER NOT NULL CHECK (price_xaf >= 0),
    is_predicted            BOOLEAN NOT NULL DEFAULT false,
    confidence_percentage   INTEGER
        CHECK (confidence_percentage >= 0 AND confidence_percentage <= 100),
    model_used              TEXT,
    UNIQUE (crop_name, region, price_date)
);

CREATE INDEX idx_price_history_lookup
    ON price_history (crop_name, region, price_date);

-- ------------------------------------------------------------
-- PRODUCE LISTING
-- ------------------------------------------------------------
CREATE TABLE produce_listings (
    id                      TEXT PRIMARY KEY,
    farmer_id               TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title                   TEXT NOT NULL,
    crop_type               TEXT NOT NULL,
    category                listing_category NOT NULL,
    price_xaf               INTEGER NOT NULL CHECK (price_xaf >= 0),
    unit                    measuring_unit NOT NULL,
    quantity_available      INTEGER NOT NULL CHECK (quantity_available >= 0),
    region                  TEXT NOT NULL,
    image_url               TEXT,
    description             TEXT,
    quality_grade           quality_grade NOT NULL,
    size                    listing_size NOT NULL,
    is_fresh                BOOLEAN NOT NULL DEFAULT TRUE,
    verification_status     verification_status NOT NULL DEFAULT 'pending',
    rejection_reason        TEXT,
    prediction_direction    price_direction,
    prediction_confidence   INTEGER CHECK (prediction_confidence BETWEEN 0 AND 100),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_listing_price_prediction
        FOREIGN KEY (crop_type, region)
        REFERENCES price_predictions (crop_name, region)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE INDEX idx_listings_farmer_id ON produce_listings(farmer_id);
CREATE INDEX idx_listings_crop_region ON produce_listings(crop_type, region);

-- ------------------------------------------------------------
-- LISTING UNIT OPTIONS (auto-calculated alternate unit prices)
-- Populated by backend logic when a listing is created, not
-- manually entered by the farmer.
-- ------------------------------------------------------------
CREATE TABLE listing_unit_options (
    id          TEXT PRIMARY KEY,
    listing_id  TEXT NOT NULL REFERENCES produce_listings(id) ON DELETE CASCADE,
    unit        measuring_unit NOT NULL,
    price_xaf   INTEGER NOT NULL CHECK (price_xaf >= 0),
    UNIQUE (listing_id, unit)
);

CREATE INDEX idx_listing_unit_options_listing_id ON listing_unit_options(listing_id);

-- ------------------------------------------------------------
-- CART ITEM (association: user <-> listing)
-- ------------------------------------------------------------
CREATE TABLE cart_items (
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id  TEXT NOT NULL REFERENCES produce_listings(id) ON DELETE CASCADE,
    quantity    INTEGER NOT NULL CHECK (quantity > 0),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, listing_id)
);

-- ------------------------------------------------------------
-- ORDER
-- ------------------------------------------------------------
CREATE TABLE orders (
    id                          TEXT PRIMARY KEY,
    buyer_id                    TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    farmer_id                   TEXT REFERENCES users(id) ON DELETE SET NULL,
    subtotal_xaf                INTEGER,
    delivery_fee_xaf            INTEGER,
    platform_escrow_fee_xaf     INTEGER,
    total_amount_xaf            INTEGER NOT NULL CHECK (total_amount_xaf >= 0),
    payment_method               payment_method NOT NULL,
    payment_phone                TEXT NOT NULL,
    payment_status               payment_status,
    order_status                 order_status,
    escrow_status                escrow_status,
    delivery_address             TEXT NOT NULL,
    region                       TEXT NOT NULL,
    estimated_delivery_days      INTEGER,
    transaction_ref              TEXT,
    status                       order_status_label NOT NULL DEFAULT 'Placed',
    delivery_confirmed_by_buyer  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_farmer_id ON orders(farmer_id);

-- ------------------------------------------------------------
-- ORDER ITEM (association: order <-> listing, price captured at purchase time)
-- ------------------------------------------------------------
CREATE TABLE order_items (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id              TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    listing_id            TEXT NOT NULL REFERENCES produce_listings(id) ON DELETE RESTRICT,
    quantity              INTEGER NOT NULL CHECK (quantity > 0),
    price_xaf_at_purchase INTEGER NOT NULL CHECK (price_xaf_at_purchase >= 0),
    -- Default is a migration placeholder only; every new order sets this explicitly.
    unit_at_purchase      measuring_unit NOT NULL DEFAULT 'kg'
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_listing_id ON order_items(listing_id);

-- ------------------------------------------------------------
-- REVIEW
-- ------------------------------------------------------------
CREATE TABLE reviews (
    id          TEXT PRIMARY KEY,
    farmer_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buyer_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
    buyer_name  TEXT NOT NULL,
    rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_farmer_id ON reviews(farmer_id);

-- ------------------------------------------------------------
-- MOMENT
-- ------------------------------------------------------------
CREATE TABLE moments (
    id              TEXT PRIMARY KEY,
    farmer_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    content         TEXT,
    image_url       TEXT,
    likes_count     INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_moments_farmer_id ON moments(farmer_id);

-- ------------------------------------------------------------
-- MOMENT COMMENT
-- ------------------------------------------------------------
CREATE TABLE moment_comments (
    id          TEXT PRIMARY KEY,
    moment_id   TEXT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    buyer_name  TEXT NOT NULL,
    comment     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_moment_comments_moment_id ON moment_comments(moment_id);

-- ------------------------------------------------------------
-- FARMER CHECK-IN
-- ------------------------------------------------------------
CREATE TABLE farmer_checkins (
    id                      TEXT PRIMARY KEY,
    farmer_id               TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crop_type               TEXT NOT NULL,
    crop_stage              checkin_stage NOT NULL,
    expected_harvest_qty    TEXT,
    expected_harvest_date   TEXT,
    location                TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkins_farmer_id ON farmer_checkins(farmer_id);

-- ------------------------------------------------------------
-- PRICE ALERT NOTIFICATION
-- ------------------------------------------------------------
CREATE TABLE price_alert_notifications (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    message     TEXT,
    crop_type   TEXT NOT NULL,
    type        alert_type NOT NULL,
    read        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON price_alert_notifications(user_id);

COMMIT;
