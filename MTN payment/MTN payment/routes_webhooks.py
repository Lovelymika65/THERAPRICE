"""
MTN MoMo webhook callback receiver.

MoMo pushes a POST to your registered callback URL when a requesttopay
(collection) or transfer (disbursement) resolves, instead of you having
to poll. Register the callback URL via the MoMo developer portal (or by
sending an X-Callback-Url header on the original request, if your
sandbox/provider supports it — see mtn_momo_client.py changes below).

Mount with: app.include_router(webhook_router, prefix="/webhooks/momo")

SECURITY: MoMo's sandbox does not sign callbacks. In production, put this
behind IP allowlisting to MTN's published ranges, and/or require a shared
secret in the callback URL path (e.g. /webhooks/momo/<random-token>) since
there's no HMAC signature to verify against.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import get_db
from .models_escrow import Payment, Order, OrderStatus, PaymentStatus, PaymentPhase

webhook_router = APIRouter()


class MomoCallbackIn(BaseModel):
    referenceId: str
    status: str  # SUCCESSFUL | FAILED
    financialTransactionId: str | None = None
    reason: str | None = None  # present on failures


@webhook_router.post("/{callback_token}")
async def momo_callback(callback_token: str, payload: MomoCallbackIn,
                         db: Session = Depends(get_db)):
    # Verify the token matches your configured secret before trusting the body.
    from os import environ
    if callback_token != environ.get("MOMO_CALLBACK_TOKEN"):
        raise HTTPException(403, "Invalid callback token")

    payment = db.query(Payment).filter(
        Payment.mtn_reference_id == payload.referenceId
    ).first()
    if not payment:
        # MoMo will retry on non-2xx, so only 404 if you're sure this
        # reference will never arrive (e.g. wrong environment entirely).
        raise HTTPException(404, "Unknown payment reference")

    if payment.status != PaymentStatus.pending:
        # Already processed — MoMo callbacks can be delivered more than once.
        return {"ok": True, "already_processed": True}

    order = db.query(Order).filter(Order.id == payment.order_id).first()

    if payload.status == "SUCCESSFUL":
        payment.status = PaymentStatus.successful
        _advance_order_on_success(order, payment)
    elif payload.status == "FAILED":
        payment.status = PaymentStatus.failed
        payment.failure_reason = payload.reason or "unknown"
        _handle_failure(order, payment)
    else:
        return {"ok": True, "ignored_status": payload.status}

    db.commit()
    return {"ok": True}


def _advance_order_on_success(order: Order, payment: Payment) -> None:
    """
    Move the order's state forward based on which payment just succeeded.
    Note: this only updates status — it does NOT auto-trigger the next
    payout. The 40%/60% releases stay explicit actions (farmer confirms,
    buyer confirms) so money never moves without a human trigger.
    """
    if payment.phase == PaymentPhase.full_collection:
        order.status = OrderStatus.paid
    elif payment.phase == PaymentPhase.farmer_40:
        order.status = OrderStatus.confirmed
    elif payment.phase == PaymentPhase.farmer_60:
        order.status = OrderStatus.delivered
    elif payment.phase in (PaymentPhase.refund_full, PaymentPhase.refund_remainder):
        order.status = OrderStatus.cancelled


def _handle_failure(order: Order, payment: Payment) -> None:
    """
    On a failed collection, leave the order pending so the buyer can retry
    checkout. On a failed disbursement, DO NOT change order.status forward —
    leave it where it was so retry logic (see below) can pick it up; a
    failed farmer payout should never silently look like a successful one.
    """
    if payment.phase == PaymentPhase.full_collection:
        order.status = OrderStatus.pending
    # For farmer_40 / farmer_60 failures: order.status stays as-is.
    # A retry job (see escrow_service.retry_failed_disbursement) re-attempts
    # the transfer using the same external_id for idempotency.
