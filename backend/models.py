from sqlalchemy import Boolean, Column, Integer, Numeric, Text, TIMESTAMP
from sqlalchemy.sql import func

try:
    from .database import Base
except ImportError:
    from database import Base


class ProduceListing(Base):
    __tablename__ = "produce_listings"

    id = Column(Text, primary_key=True, index=True)
    farmer_id = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    crop_type = Column(Text, nullable=False)
    category = Column(Text, nullable=False)
    price_xaf = Column(Integer, nullable=False)
    unit = Column(Text, nullable=False)
    quantity_available = Column(Integer, nullable=False)
    region = Column(Text, nullable=False)
    image_url = Column(Text)
    description = Column(Text)
    quality_grade = Column(Text, nullable=False)
    size = Column(Text, nullable=False)
    is_fresh = Column(Boolean, default=True)
    verification_status = Column(Text, default="pending")
    rejection_reason = Column(Text)
    prediction_direction = Column(Text)
    prediction_confidence = Column(Integer)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class PricePrediction(Base):
    __tablename__ = "price_predictions"

    crop_id = Column(Text, primary_key=True)
    crop_name = Column(Text, nullable=False)
    region = Column(Text, nullable=False)
    current_price = Column(Integer, nullable=False)
    direction = Column(Text, nullable=False)
    direction_change_percent = Column(Numeric, default=0)
    confidence_tier = Column(Text, nullable=False)
    confidence_percentage = Column(Integer, nullable=False)
    last_updated = Column(TIMESTAMP(timezone=True), server_default=func.now())


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    crop_name = Column(Text, nullable=False)
    region = Column(Text, nullable=False)
    price_date = Column(TIMESTAMP(timezone=True), nullable=False)
    price_xaf = Column(Integer, nullable=False)
    is_predicted = Column(Boolean, default=False)
    confidence_percentage = Column(Integer)
    model_used = Column(Text)



class User(Base):
    __tablename__ = "users"

    id = Column(Text, primary_key=True)
    name = Column(Text, nullable=False)
    phone = Column(Text, nullable=False)
    email = Column(Text)
    role = Column(Text, nullable=False)
    verification_status = Column(Text, default="unverified")
    rejection_reason = Column(Text)
    trust_score = Column(Integer, default=0)
    location = Column(Text, nullable=False)
    farm_name = Column(Text)
    farm_size = Column(Text)
    national_id_number = Column(Text)
    id_card_photo_url = Column(Text)
    selfie_photo_url = Column(Text)
    realtime_photo_url = Column(Text)
    farm_proof_photo_url = Column(Text)
    contract_signed = Column(Boolean, default=False)
    device_locator_enabled = Column(Boolean, default=False)
    password_hash = Column(Text)
    otp_code = Column(Text)
    otp_expires_at = Column(TIMESTAMP(timezone=True))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class PendingRegistration(Base):
    """Registration details retained only until email OTP verification."""
    __tablename__ = "pending_registrations"

    phone = Column(Text, primary_key=True)
    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False, unique=True)
    password_hash = Column(Text, nullable=False)
    role = Column(Text, nullable=False)
    location = Column(Text, nullable=False)
    otp_code = Column(Text)
    otp_expires_at = Column(TIMESTAMP(timezone=True))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

class Favorite(Base):
    __tablename__ = "favorites"

    user_id = Column(Text, primary_key=True)
    listing_id = Column(Text, primary_key=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class ListingUnitOption(Base):
    __tablename__ = "listing_unit_options"

    id = Column(Text, primary_key=True)
    listing_id = Column(Text, nullable=False)
    unit = Column(Text, nullable=False)
    price_xaf = Column(Integer, nullable=False)


class CartItem(Base):
    __tablename__ = "cart_items"

    user_id = Column(Text, primary_key=True)
    listing_id = Column(Text, primary_key=True)
    quantity = Column(Integer, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class Order(Base):
    __tablename__ = "orders"

    id = Column(Text, primary_key=True)
    buyer_id = Column(Text, nullable=False)
    farmer_id = Column(Text, nullable=False)
    subtotal_xaf = Column(Integer)
    delivery_fee_xaf = Column(Integer)
    platform_escrow_fee_xaf = Column(Integer)
    farmer_40_amount_xaf = Column(Integer, default=0)
    farmer_57_amount_xaf = Column(Integer, default=0)
    farmer_40_payout_ref = Column(Text)
    farmer_57_payout_ref = Column(Text)
    total_amount_xaf = Column(Integer, nullable=False)
    payment_method = Column(Text, nullable=False)
    payment_phone = Column(Text, nullable=False)
    payment_status = Column(Text)
    order_status = Column(Text)
    escrow_status = Column(Text)
    delivery_address = Column(Text, nullable=False)
    region = Column(Text, nullable=False)
    estimated_delivery_days = Column(Integer)
    transaction_ref = Column(Text, nullable=False)
    status = Column(Text, default="Placed")
    delivery_confirmed_by_buyer = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Text, nullable=False)
    listing_id = Column(Text, nullable=False)
    quantity = Column(Integer, nullable=False)
    price_xaf_at_purchase = Column(Integer, nullable=False)
    unit_at_purchase = Column(Text, nullable=False, default="kg")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Text, primary_key=True)
    farmer_id = Column(Text, nullable=False)
    buyer_id = Column(Text)
    buyer_name = Column(Text, nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    listing_id = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class Moment(Base):
    __tablename__ = "moments"

    id = Column(Text, primary_key=True)
    farmer_id = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    content = Column(Text)
    image_url = Column(Text)
    likes_count = Column(Integer, default=0)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class MomentLike(Base):
    __tablename__ = "moment_likes"

    user_id = Column(Text, primary_key=True)
    moment_id = Column(Text, primary_key=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class MomentComment(Base):
    __tablename__ = "moment_comments"

    id = Column(Text, primary_key=True)
    moment_id = Column(Text, nullable=False)
    buyer_name = Column(Text, nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class CommentLike(Base):
    __tablename__ = "comment_likes"

    user_id = Column(Text, primary_key=True)
    comment_id = Column(Text, primary_key=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class FarmerCheckin(Base):
    __tablename__ = "farmer_checkins"

    id = Column(Text, primary_key=True)
    farmer_id = Column(Text, nullable=False)
    crop_type = Column(Text, nullable=False)
    crop_stage = Column(Text, nullable=False)
    expected_harvest_qty = Column(Text)
    expected_harvest_date = Column(Text)
    location = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class PriceAlertNotification(Base):
    __tablename__ = "price_alert_notifications"

    id = Column(Text, primary_key=True)
    user_id = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    message = Column(Text)
    crop_type = Column(Text, nullable=False)
    type = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class ForecastPriceAlert(Base):
    """A user threshold evaluated against refreshed model forecast artifacts."""
    __tablename__ = "forecast_price_alerts"

    id = Column(Text, primary_key=True)
    user_id = Column(Text, nullable=False, index=True)
    crop_name = Column(Text, nullable=False, index=True)
    frequency = Column(Text, nullable=False, default="daily")
    direction = Column(Text, nullable=False)  # "above" or "below"
    threshold_price = Column(Numeric, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    triggered_at = Column(TIMESTAMP(timezone=True))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

otp_code = Column(Text)
otp_expires_at = Column(TIMESTAMP(timezone=True))
