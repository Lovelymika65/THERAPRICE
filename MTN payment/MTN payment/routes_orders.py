"""
FastAPI routes for the order/escrow flow.
Mount with: app.include_router(router, prefix="/orders", tags=["orders"])
Adjust get_db / get_current_user imports to match your existing auth setup.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import get_db          # your existing DB session dependency
from .auth import get_current_user    # your existing auth dependency
from .models_escrow import Order, OrderStatus
from . import escrow_service as escrow

router = APIRouter()


class CreateOrderIn(BaseModel):
    farmer_id: str
    product_id: str
    total_amount: float
    currency: str = "XAF"
    buyer_msisdn: str


class MsisdnIn(BaseModel):
    msisdn: str


@router.post("/")
async def create_order(payload: CreateOrderIn, db: Session = Depends(get_db),
                        current_user=Depends(get_current_user)):
    order = Order(
        buyer_id=current_user.id,
        farmer_id=payload.farmer_id,
        product_id=payload.product_id,
        total_amount=payload.total_amount,
        currency=payload.currency,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    payment = await escrow.start_collection(db, order, payload.buyer_msisdn)
    return {"order_id": order.id, "payment_reference": payment.mtn_reference_id, "status": order.status}


@router.get("/{order_id}/payment-status")
async def check_payment_status(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")

    collection_payment = next(
        (p for p in order.payments if p.phase.value == "full_collection"), None
    )
    if not collection_payment:
        raise HTTPException(400, "No collection payment found for this order")

    confirmed = await escrow.confirm_collection(db, collection_payment, order)
    return {"order_id": order.id, "status": order.status, "collection_confirmed": confirmed}


@router.post("/{order_id}/confirm")
async def confirm_order(order_id: str, payload: MsisdnIn, db: Session = Depends(get_db),
                         current_user=Depends(get_current_user)):
    """Farmer confirms the order -> triggers the 40% payout."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.farmer_id != current_user.id:
        raise HTTPException(403, "Only the assigned farmer can confirm this order")

    try:
        payment = await escrow.release_farmer_40(db, order, payload.msisdn)
    except escrow.EscrowError as e:
        raise HTTPException(400, str(e))

    return {"order_id": order.id, "status": order.status, "payout_reference": payment.mtn_reference_id}


@router.post("/{order_id}/confirm-delivery")
async def confirm_delivery(order_id: str, payload: MsisdnIn, db: Session = Depends(get_db),
                            current_user=Depends(get_current_user)):
    """Buyer confirms delivery -> triggers the 60% payout."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.buyer_id != current_user.id:
        raise HTTPException(403, "Only the buyer can confirm delivery")

    try:
        payment = await escrow.release_farmer_60(db, order, payload.msisdn)
    except escrow.EscrowError as e:
        raise HTTPException(400, str(e))

    return {"order_id": order.id, "status": order.status, "payout_reference": payment.mtn_reference_id}


@router.post("/{order_id}/dispute")
async def raise_dispute(order_id: str, reason: str, db: Session = Depends(get_db),
                         current_user=Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    if current_user.id not in (order.buyer_id, order.farmer_id):
        raise HTTPException(403, "Not a party to this order")

    order.status = OrderStatus.disputed
    order.dispute_reason = reason
    db.commit()
    return {"order_id": order.id, "status": order.status}


class ResolveDisputeIn(BaseModel):
    resolution: str  # "release_to_farmer" | "refund_buyer"
    buyer_msisdn: str


@router.post("/{order_id}/resolve-dispute")
async def resolve_dispute(order_id: str, payload: ResolveDisputeIn, db: Session = Depends(get_db),
                           current_user=Depends(get_current_user)):
    """Admin-only — gate this with a role check in get_current_user or a separate dependency."""
    if getattr(current_user, "role", None) != "admin":
        raise HTTPException(403, "Admin only")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")

    try:
        result = await escrow.resolve_dispute(db, order, payload.resolution, payload.buyer_msisdn)
    except escrow.EscrowError as e:
        raise HTTPException(400, str(e))

    return {"order_id": order.id, "status": order.status, **result}
