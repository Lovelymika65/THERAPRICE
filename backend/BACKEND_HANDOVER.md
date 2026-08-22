# Theraprice backend handover

Last reviewed: 18 August 2026

## 1. What the backend currently is

The backend consists of two services:

1. A Python/FastAPI application in `backend/`. It manages users, marketplace data, forecasts, carts, orders, escrow logic, community data, alerts and email OTP registration.
2. A Node/Express payment service in `backend/MTN payment/MTN payment/`. It initiates and checks pawaPay mobile-money deposits and can create protected internal payouts.

The FastAPI application must be started from the project root as a package:

```powershell
.\theraprice-env\Scripts\python.exe -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

`uvicorn main:app` from inside `backend` is not a supported command because the application uses Python package-relative imports.

## 2. Implemented features

### Authentication and registration

- Passwords are hashed with bcrypt through `passlib`.
- Login returns a 24-hour signed JWT access token.
- `GET /me` reads the authenticated user from a Bearer token.
- Registration is deliberately a two-stage process:
  - `POST /register` saves a `PendingRegistration`, not a real user account.
  - `POST /send-otp` emails a six-digit OTP to the pending registration email address.
  - `POST /verify-otp` validates the OTP, creates the `users` record and returns an access token.
- This prevents an unverified registration from being persisted as a usable user account.
- SMS OTP is intentionally unavailable; the supported delivery channel is email.

### Marketplace and farmer data

- `GET /products` and `GET /products/{product_id}` return marketplace listings.
- `POST /products` requires an authenticated user with the `farmer` role.
- Listing values are validated and UI category labels are mapped to database categories, including Vegetables, Tubers, Fruits, Spices and Grains.
- Listings may now be created when no forecast exists for their crop. The former database foreign-key requirement between a listing and a price prediction was removed.
- Listings start in `pending` verification status.
- Farmer records, reviews, check-ins, listing unit options, favorites and cart records are stored in PostgreSQL/SQLAlchemy models.

### Forecasts and alerts

- `GET /forecast/crops` exposes crops for which forecast files are available.
- `GET /forecast/{crop_name}` returns model forecast data in daily, weekly, monthly or yearly views.
- Legacy prediction and price-history endpoints are also present.
- Forecast threshold alerts can be created, listed and evaluated through `/forecast-alerts` endpoints.
- The alert evaluator records an in-app `PriceAlertNotification` when a threshold is met.

### Orders and escrow

- `POST /orders` requires an authenticated buyer and verifies that the linked payment deposit is completed before the order is written.
- The order schema stores payment status, transaction reference, escrow state, delivery state, and the intended 40% / 57% farmer releases.
- `POST /orders/{order_id}/release-initial` starts the initial farmer payout.
- `POST /orders/{order_id}/confirm-delivery` confirms delivery and starts the final farmer payout.
- The API derives the farmer payout recipient from stored farmer data rather than trusting a client-provided recipient phone number.

### Community and user features

- Cart add/list/remove endpoints.
- Favorites, reviews, farmer check-ins and price alerts.
- Moments feed, comments and likes.
- Farmer profile, users, notifications and price-history reads.

### Payment service

- The Node service provides:
  - `POST /api/payment/pay` to initiate a deposit.
  - `GET /api/payment/status/:depositId` to read provider status.
  - protected internal deposit status and payout endpoints used by the FastAPI service.
- It supports `MTN_MOMO_CMR` and `ORANGE_CMR` provider codes.
- Cameroon phone numbers and positive whole-number XAF amounts are validated before requests are sent.
- pawaPay deposit paths were corrected to use `/deposits` and `/deposits/{id}`.

## 3. Data model currently present

Core tables/models in `models.py`:

- `users`, `pending_registrations`
- `produce_listings`, `listing_unit_options`
- `price_predictions`, `price_history`, `forecast_price_alerts`, `price_alert_notifications`
- `cart_items`, `favorites`
- `orders`, `order_items`, `reviews`
- `moments`, `moment_comments`, `moment_likes`, `comment_likes`
- `farmer_checkins`

The schema source is `theraprice-postgres-schema-idempotent.sql`. The migration `migrations/20260814_allow_listings_without_predictions.sql` removes the outdated listing-to-prediction foreign key from existing databases.

## 4. Configuration required

Keep real values only in untracked `.env` files. Do not commit keys, passwords or database URLs.

FastAPI requires at least:

```dotenv
DATABASE_URL=postgresql+psycopg2://...
SECRET_KEY=a-long-random-secret
EMAIL_ADDRESS=your-sender@example.com
EMAIL_APP_PASSWORD=an-email-app-password
PAYMENT_SERVICE_URL=http://127.0.0.1:5000/api/payment
PAYMENT_INTERNAL_KEY=a-shared-long-random-secret
```

The payment service needs its pawaPay API token/base configuration and **the same** `PAYMENT_INTERNAL_KEY`. The internal key is required for backend-to-payment-service deposit and payout calls.

## 5. Known limitations and work still required

### Critical: security and access control

1. The frontend currently contains an admin password. It is public to anyone who loads the site. Replace it with backend-admin authentication, hashed server-side credentials and role/permission checks.
2. Many endpoints accept `user_id`, `farmer_id`, `buyer_name` or raw dictionaries from the client without verifying that the token owner owns the resource. Cart, favorite, review, check-in, alert, comment and like write routes need authentication and ownership authorization.
3. Do not expose payment payloads, provider responses, phone numbers, access tokens or email credentials in logs.
4. Validate that `SECRET_KEY` and `PAYMENT_INTERNAL_KEY` are set at startup; the service should refuse production startup if either is missing or weak.
5. Add rate limits for login, registration, OTP send and OTP verification. Add OTP attempt limits and a resend cooldown.

### Critical: payment is not production-verified

1. MTN and Orange integration code exists, but a real pawaPay sandbox end-to-end test is still required.
2. Add authenticated provider webhooks/callback verification. Do not rely solely on a client waiting for a status result.
3. Persist provider deposit and payout events in dedicated payment/audit tables; an order transaction reference alone is not sufficient for reconciliation.
4. Define robust states for pending, completed, failed, expired, cancelled, retried, partially paid and refunded transactions.
5. Make payout operations idempotent. A repeated request must not pay a farmer twice.
6. Confirm legal, operational and reconciliation rules for the 40% / 57% escrow releases before real money is enabled.

### Product and marketplace work

1. Add authenticated product edit, delete, farmer-owned listing list, stock adjustment and sold-out endpoints.
2. Implement an authenticated admin review API to approve or reject pending listings. The current `verification_status` field exists, but there is no complete protected moderation workflow.
3. Enforce that public marketplace responses show only approved/live products; expose a separate view for a farmer's own pending/rejected listings.
4. Replace free-text crop names with a canonical crop catalogue and aliases. For example, both “Fresh Tomatoes” and “tomato” should map to a single `tomatoes` forecast key.
5. Validate image URLs or implement secure image uploads/object storage. Do not depend on large base64 data inside frontend JavaScript.

### Forecast work

1. The API can provide model forecast files, but frontend prediction presentation must consistently use `/forecast/{crop_name}` rather than static/demo calculations.
2. Map marketplace crop types to forecast crop keys and show only crops that have real forecast data. If none is available, show an explicit “forecast unavailable” state.
3. Document model provenance, training date, region coverage, confidence meaning, refresh schedule and known limitations.
4. Put forecast generation and `/forecast-alerts/evaluate` behind a scheduled background job. The current evaluator only runs when explicitly called.

### Database and code structure

1. Replace `Base.metadata.create_all()` as the production schema mechanism with versioned migrations (for example Alembic). `create_all()` cannot safely perform real schema changes.
2. Apply every migration consistently to development, staging and production databases. The existing foreign-key removal migration must be recorded as applied where appropriate.
3. Add database foreign keys, indexes and uniqueness constraints deliberately for ownership and performance, after checking existing data.
4. Split `main.py` into routers/services: authentication, products, orders, forecasts, community, notifications and administration.
5. Replace `payload: dict` request bodies with Pydantic models for validation and OpenAPI documentation.
6. Several read endpoints catch `SQLAlchemyError` and return empty lists. Log the exception and return a clear 500 error instead; an empty response hides an outage as “no data.”

### Testing, operations and deployment

1. There is no comprehensive automated test suite. Add API tests for registration/OTP, login, permissions, product lifecycle, cart/order totals, payment status, payout idempotency and forecast alerts.
2. Add structured logging, error tracking, request IDs and health/readiness checks that include database connectivity.
3. Add backup, restore and retention procedures for PostgreSQL. Test restoring `theraprice-export.dump` in a safe environment.
4. Separate development and production configuration. Localhost URLs, CORS origins, payment endpoint URL and email settings must be environment-specific.
5. Restrict CORS to the deployed frontend domains in production; do not leave development origins broadly enabled.
6. Run FastAPI behind a production process manager/reverse proxy with HTTPS. Do not use `--reload` in production.
7. Maintain one clearly designated payment-service directory. There are duplicate payment-service folders in the repository, which can lead to fixing or deploying the wrong copy.
8. Add dependency lock files and documented installation commands for the Python service as well as the Node payment service.

### Existing-account and user-experience follow-up

1. Legacy unverified entries already stored in `users` can conflict with the newer pending-registration flow. Decide whether to migrate, delete after review, or provide a secure re-verification path.
2. Explain OTP email delivery failures clearly in the UI. The server needs a working sender account/app password and outbound SMTP access.
3. Separate email verification from farmer identity/marketplace verification. A user can have a verified email while their farmer documents or product listing remain pending review.

## 6. Recommended implementation order

1. Remove the frontend admin password; add backend roles, authentication and authorization guards.
2. Add listing moderation and farmer-owned listing management.
3. Create a canonical crop catalogue and connect marketplace selections to actual forecast API responses.
4. Complete pawaPay sandbox tests, callback handling, transaction persistence and payout idempotency.
5. Introduce migrations, test coverage, logs and production deployment configuration.

## 7. Current local validation status

- `backend.main:app` imports successfully using the project package path.
- Uvicorn starts successfully with `backend.main:app`.
- The health endpoint is `GET /health`.
- Product creation was tested against the corrected live database schema using valid farmer credentials; the temporary test listing was removed afterward.

This document describes the current codebase, not a guarantee that external services (SMTP or pawaPay) are configured or reachable in every environment. Those integrations require environment-specific validation before release.
