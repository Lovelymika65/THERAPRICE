from sqlalchemy import Column, Text, Integer, Boolean, TIMESTAMP, Numeric
from sqlalchemy.sql import func
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

class User(Base):
    __tablename__ = "users"

    id = Column(Text, primary_key=True)
    name = Column(Text, nullable=False)
    phone = Column(Text, nullable=False)
    email = Column(Text)
    role = Column(Text, nullable=False)
    verification_status = Column(Text, default="unverified")
    trust_score = Column(Integer, default=0)
    location = Column(Text, nullable=False)
    farm_name = Column(Text)
    farm_size = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now()) 

class Moment(Base):
    __tablename__ = "moments"

    id = Column(Text, primary_key=True)
    farmer_id = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(Text)
    likes_count = Column(Integer, default=0)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())   

class Order(Base):
    __tablename__ = "orders"

    id = Column(Text, primary_key=True)
    buyer_id = Column(Text, nullable=False)
    farmer_id = Column(Text, nullable=False)
    subtotal_xaf = Column(Integer)
    delivery_fee_xaf = Column(Integer)
    platform_escrow_fee_xaf = Column(Integer)
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

    id = Column(Integer, primary_key=True)
    order_id = Column(Text, nullable=False)
    listing_id = Column(Text, nullable=False)
    quantity = Column(Integer, nullable=False)
    price_xaf_at_purchase = Column(Integer, nullable=False)

class CartItem(Base):
    __tablename__ = "cart_items"

    user_id = Column(Text, primary_key=True)
    listing_id = Column(Text, primary_key=True)
    quantity = Column(Integer, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now())    