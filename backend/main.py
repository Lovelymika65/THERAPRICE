import uuid
from typing import List

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

try:
    from .database import engine, get_db
    from .models import (
        CartItem,
        CommentLike,
        FarmerCheckin,
        Favorite,
        ListingUnitOption,
        Moment,
        MomentComment,
        MomentLike,
        Order,
        OrderItem,
        PriceAlertNotification,
        PriceHistory,
        PricePrediction,
        ProduceListing,
        Review,
        User,
    )
except ImportError:
    from database import engine, get_db
    from models import (
        CartItem,
        CommentLike,
        FarmerCheckin,
        Favorite,
        ListingUnitOption,
        Moment,
        MomentComment,
        MomentLike,
        Order,
        OrderItem,
        PriceAlertNotification,
        PriceHistory,
        PricePrediction,
        ProduceListing,
        Review,
        User,
    )

app = FastAPI(title="TheraPrice Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    from .database import Base
except ImportError:
    from database import Base

Base.metadata.create_all(bind=engine)


def serialize_model(model) -> dict:
    return {column.name: getattr(model, column.name) for column in model.__table__.columns}


@app.get("/")
def read_root():
    return {"status": "Theraprice backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/products")
def get_products(db: Session = Depends(get_db), limit: int = Query(default=100, ge=1)):
    try:
        products = db.query(ProduceListing).order_by(ProduceListing.created_at.desc()).limit(limit).all()
        return [serialize_model(item) for item in products]
    except SQLAlchemyError:
        return []


@app.get("/users")
def get_users(db: Session = Depends(get_db), limit: int = Query(default=100, ge=1)):
    try:
        users = db.query(User).order_by(User.created_at.desc()).limit(limit).all()
        return [serialize_model(item) for item in users]
    except SQLAlchemyError:
        return []


@app.get("/predictions/{crop_name}")
def get_prediction(crop_name: str, db: Session = Depends(get_db)):
    try:
        result = db.query(PricePrediction).filter(PricePrediction.crop_name == crop_name).all()
        return [serialize_model(item) for item in result]
    except SQLAlchemyError:
        return []


@app.get("/products/{product_id}")
def get_product(product_id: str, db: Session = Depends(get_db)):
    try:
        product = db.query(ProduceListing).filter(ProduceListing.id == product_id).first()
        if not product:
            return {"error": "Product not found"}
        return serialize_model(product)
    except SQLAlchemyError:
        return {"error": "Product not found"}


@app.get("/farmers/{farmer_id}")
def get_farmer(farmer_id: str, db: Session = Depends(get_db)):
    try:
        farmer = db.query(User).filter(User.id == farmer_id, User.role == "farmer").first()
        if not farmer:
            return {"error": "Farmer not found"}
        return serialize_model(farmer)
    except SQLAlchemyError:
        return {"error": "Farmer not found"}


@app.get("/moments")
def get_moments(db: Session = Depends(get_db), limit: int = Query(default=100, ge=1)):
    try:
        moments = db.query(Moment).order_by(Moment.created_at.desc()).limit(limit).all()
        return [serialize_model(item) for item in moments]
    except SQLAlchemyError:
        return []


@app.get("/reviews")
def get_reviews(db: Session = Depends(get_db), limit: int = Query(default=100, ge=1)):
    try:
        reviews = db.query(Review).order_by(Review.created_at.desc()).limit(limit).all()
        return [serialize_model(item) for item in reviews]
    except SQLAlchemyError:
        return []


@app.get("/price-history/{crop_name}")
def get_price_history(crop_name: str, db: Session = Depends(get_db), region: str = Query(default="Yaoundé")):
    try:
        history = db.query(PriceHistory).filter(
            PriceHistory.crop_name == crop_name,
            PriceHistory.region == region,
        ).order_by(PriceHistory.id.asc()).all()
        return [serialize_model(item) for item in history]
    except SQLAlchemyError:
        return []


@app.get("/checkins/{farmer_id}")
def get_checkins(farmer_id: str, db: Session = Depends(get_db)):
    try:
        checkins = db.query(FarmerCheckin).filter(FarmerCheckin.farmer_id == farmer_id).all()
        return [serialize_model(item) for item in checkins]
    except SQLAlchemyError:
        return []


@app.get("/alerts/{user_id}")
def get_alerts(user_id: str, db: Session = Depends(get_db)):
    try:
        alerts = db.query(PriceAlertNotification).filter(PriceAlertNotification.user_id == user_id).all()
        return [serialize_model(item) for item in alerts]
    except SQLAlchemyError:
        return []


class OrderItemCreate(BaseModel):
    listing_id: str
    quantity: int
    price_xaf_at_purchase: int


class OrderCreate(BaseModel):
    buyer_id: str
    farmer_id: str
    total_amount_xaf: int
    payment_method: str
    payment_phone: str
    delivery_address: str
    region: str
    transaction_ref: str
    items: List[OrderItemCreate]


@app.post("/orders", status_code=201)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    try:
        order_id = str(uuid.uuid4())
        new_order = Order(
            id=order_id,
            buyer_id=order.buyer_id,
            farmer_id=order.farmer_id,
            subtotal_xaf=order.total_amount_xaf,
            delivery_fee_xaf=0,
            platform_escrow_fee_xaf=0,
            total_amount_xaf=order.total_amount_xaf,
            payment_method=order.payment_method,
            payment_phone=order.payment_phone,
            payment_status="paid_escrow",
            order_status="confirmed",
            escrow_status="held_in_escrow",
            delivery_address=order.delivery_address,
            region=order.region,
            estimated_delivery_days=3,
            transaction_ref=order.transaction_ref,
            status="Placed",
        )
        db.add(new_order)

        for item in order.items:
            db.add(
                OrderItem(
                    order_id=order_id,
                    listing_id=item.listing_id,
                    quantity=item.quantity,
                    price_xaf_at_purchase=item.price_xaf_at_purchase,
                    unit_at_purchase="kg",
                )
            )

        db.commit()
        return {"order_id": order_id, "status": "created"}
    except SQLAlchemyError:
        db.rollback()
        return {"status": "error", "message": "Unable to create order"}


class CartItemCreate(BaseModel):
    user_id: str
    listing_id: str
    quantity: int


@app.get("/cart/{user_id}")
def get_cart(user_id: str, db: Session = Depends(get_db)):
    try:
        items = db.query(CartItem).filter(CartItem.user_id == user_id).all()
        return [serialize_model(item) for item in items]
    except SQLAlchemyError:
        return []


@app.post("/cart")
def add_to_cart(item: CartItemCreate, db: Session = Depends(get_db)):
    try:
        existing = db.query(CartItem).filter(
            CartItem.user_id == item.user_id,
            CartItem.listing_id == item.listing_id,
        ).first()

        if existing:
            existing.quantity = item.quantity
        else:
            db.add(CartItem(user_id=item.user_id, listing_id=item.listing_id, quantity=item.quantity))

        db.commit()
        return {"status": "ok"}
    except SQLAlchemyError:
        db.rollback()
        return {"status": "error", "message": "Unable to update cart"}


@app.delete("/cart/{user_id}/{listing_id}")
def remove_from_cart(user_id: str, listing_id: str, db: Session = Depends(get_db)):
    try:
        item = db.query(CartItem).filter(
            CartItem.user_id == user_id,
            CartItem.listing_id == listing_id,
        ).first()
        if item:
            db.delete(item)
            db.commit()
        return {"status": "removed"}
    except SQLAlchemyError:
        db.rollback()
        return {"status": "error", "message": "Unable to remove cart item"}


@app.get("/favorites/{user_id}")
def get_favorites(user_id: str, db: Session = Depends(get_db)):
    try:
        favorites = db.query(Favorite).filter(Favorite.user_id == user_id).all()
        return [serialize_model(item) for item in favorites]
    except SQLAlchemyError:
        return []


@app.get("/listing-options/{listing_id}")
def get_listing_options(listing_id: str, db: Session = Depends(get_db)):
    try:
        options = db.query(ListingUnitOption).filter(ListingUnitOption.listing_id == listing_id).all()
        return [serialize_model(item) for item in options]
    except SQLAlchemyError:
        return []


@app.post("/listing-options", status_code=201)
def create_listing_option(payload: dict, db: Session = Depends(get_db)):
    try:
        option = ListingUnitOption(
            id=str(uuid.uuid4()),
            listing_id=payload.get("listing_id"),
            unit=payload.get("unit"),
            price_xaf=payload.get("price_xaf"),
        )
        db.add(option)
        db.commit()
        return {"status": "created", "option_id": option.id}
    except SQLAlchemyError:
        db.rollback()
        return {"status": "error", "message": "Unable to create listing option"}


@app.post("/favorites", status_code=201)
def add_favorite(payload: dict, db: Session = Depends(get_db)):
    try:
        favorite = Favorite(user_id=payload.get("user_id"), listing_id=payload.get("listing_id"))
        db.add(favorite)
        db.commit()
        return {"status": "added"}
    except SQLAlchemyError:
        db.rollback()
        return {"status": "error", "message": "Unable to add favorite"}


@app.post("/reviews", status_code=201)
def create_review(payload: dict, db: Session = Depends(get_db)):
    try:
        review = Review(
            id=str(uuid.uuid4()),
            farmer_id=payload.get("farmer_id"),
            buyer_id=payload.get("buyer_id"),
            buyer_name=payload.get("buyer_name"),
            rating=payload.get("rating"),
            comment=payload.get("comment"),
            listing_id=payload.get("listing_id"),
        )
        db.add(review)
        db.commit()
        return {"status": "created", "review_id": review.id}
    except SQLAlchemyError:
        db.rollback()
        return {"status": "error", "message": "Unable to create review"}


@app.post("/checkins", status_code=201)
def create_checkin(payload: dict, db: Session = Depends(get_db)):
    try:
        checkin = FarmerCheckin(
            id=str(uuid.uuid4()),
            farmer_id=payload.get("farmer_id"),
            crop_type=payload.get("crop_type"),
            crop_stage=payload.get("crop_stage"),
            expected_harvest_qty=payload.get("expected_harvest_qty"),
            expected_harvest_date=payload.get("expected_harvest_date"),
            location=payload.get("location"),
        )
        db.add(checkin)
        db.commit()
        return {"status": "created", "checkin_id": checkin.id}
    except SQLAlchemyError:
        db.rollback()
        return {"status": "error", "message": "Unable to create checkin"}


@app.post("/alerts", status_code=201)
def create_alert(payload: dict, db: Session = Depends(get_db)):
    try:
        alert = PriceAlertNotification(
            id=str(uuid.uuid4()),
            user_id=payload.get("user_id"),
            title=payload.get("title"),
            message=payload.get("message"),
            crop_type=payload.get("crop_type"),
            type=payload.get("type"),
            read=False,
        )
        db.add(alert)
        db.commit()
        return {"status": "created", "alert_id": alert.id}
    except SQLAlchemyError:
        db.rollback()
        return {"status": "error", "message": "Unable to create alert"}


@app.get("/moments/{moment_id}/comments")
def get_moment_comments(moment_id: str, db: Session = Depends(get_db)):
    try:
        comments = db.query(MomentComment).filter(MomentComment.moment_id == moment_id).all()
        return [serialize_model(item) for item in comments]
    except SQLAlchemyError:
        return []


@app.post("/moments/{moment_id}/comments", status_code=201)
def create_moment_comment(moment_id: str, payload: dict, db: Session = Depends(get_db)):
    try:
        comment = MomentComment(
            id=str(uuid.uuid4()),
            moment_id=moment_id,
            buyer_name=payload.get("buyer_name"),
            comment=payload.get("comment"),
        )
        db.add(comment)
        db.commit()
        return {"status": "created", "comment_id": comment.id}
    except SQLAlchemyError:
        db.rollback()
        return {"status": "error", "message": "Unable to create comment"}


@app.get("/moments/{moment_id}/likes")
def get_moment_likes(moment_id: str, db: Session = Depends(get_db)):
    try:
        likes = db.query(MomentLike).filter(MomentLike.moment_id == moment_id).all()
        return [serialize_model(item) for item in likes]
    except SQLAlchemyError:
        return []


@app.post("/moments/{moment_id}/like", status_code=201)
def like_moment(moment_id: str, payload: dict, db: Session = Depends(get_db)):
    try:
        like = MomentLike(user_id=payload.get("user_id"), moment_id=moment_id)
        db.add(like)
        db.commit()
        return {"status": "liked"}
    except SQLAlchemyError:
        db.rollback()
        return {"status": "error", "message": "Unable to like moment"}