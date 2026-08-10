from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sympy import product
from database import get_db
from models import ProduceListing

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "Theraprice backend is running"}

@app.get("/products")
def get_products(db: Session = Depends(get_db)):
    return db.query(ProduceListing).all()

from models import ProduceListing, PricePrediction

@app.get("/predictions/{crop_name}")
def get_prediction(crop_name: str, db: Session = Depends(get_db)):
    result = db.query(PricePrediction).filter(PricePrediction.crop_name == crop_name).all()
    return result

@app.get("/products/{product_id}")
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(ProduceListing).filter(ProduceListing.id == product_id).first()
    if not product:
      return {"error": "Product not found"}
    return product

from models import ProduceListing, PricePrediction, User

@app.get("/farmers/{farmer_id}")
def get_farmer(farmer_id: str, db: Session = Depends(get_db)):
    farmer = db.query(User).filter(User.id == farmer_id, User.role == "farmer").first()
    if not farmer:
        return {"error": "Farmer not found"}
    return farmer

from models import ProduceListing, PricePrediction, User, Moment, Order, OrderItem

@app.get("/moments")
def get_moments(db: Session = Depends(get_db)):
    return db.query(Moment).order_by(Moment.created_at.desc()).all()

from pydantic import BaseModel
from typing import List
import uuid

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

@app.post("/orders")
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    order_id = str(uuid.uuid4())
    new_order = Order(
        id=order_id,
        buyer_id=order.buyer_id,
        farmer_id=order.farmer_id,
        total_amount_xaf=order.total_amount_xaf,
        payment_method=order.payment_method,
        payment_phone=order.payment_phone,
        delivery_address=order.delivery_address,
        region=order.region,
        transaction_ref=order.transaction_ref,
    )
    db.add(new_order)

    for item in order.items:
        db.add(OrderItem(
            order_id=order_id,
            listing_id=item.listing_id,
            quantity=item.quantity,
            price_xaf_at_purchase=item.price_xaf_at_purchase,
        ))

    db.commit()
    return {"order_id": order_id, "status": "created"}

from models import ProduceListing, PricePrediction, User, Moment, Order, OrderItem, CartItem

class CartItemCreate(BaseModel):
    user_id: str
    listing_id: str
    quantity: int

@app.get("/cart/{user_id}")
def get_cart(user_id: str, db: Session = Depends(get_db)):
    return db.query(CartItem).filter(CartItem.user_id == user_id).all()

@app.post("/cart")
def add_to_cart(item: CartItemCreate, db: Session = Depends(get_db)):
    existing = db.query(CartItem).filter(
        CartItem.user_id == item.user_id,
        CartItem.listing_id == item.listing_id
    ).first()

    if existing:
        existing.quantity = item.quantity
    else:
        db.add(CartItem(user_id=item.user_id, listing_id=item.listing_id, quantity=item.quantity))

    db.commit()
    return {"status": "ok"}

@app.delete("/cart/{user_id}/{listing_id}")
def remove_from_cart(user_id: str, listing_id: str, db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(
        CartItem.user_id == user_id,
        CartItem.listing_id == listing_id
    ).first()
    if item:
        db.delete(item)
        db.commit()
    return {"status": "removed"}