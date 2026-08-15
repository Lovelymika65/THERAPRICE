"""
Escrow orchestration logic. Called from routes — keeps the DB writes and
MoMo calls in one place so the payout math only lives here.
"""

import uuid
from sqlalchemy.orm import Session

from . import mtn_momo_client as momo
from .models_escrow import (
    Order, Payment, OrderStatus, PaymentDirection, PaymentPhase, PaymentStatus
)


class EscrowError(Exception):
    pass


async def start_collection(db: Session, order: Order, buyer_msisdn: str) -> Payment:
    """Kick off the buyer's full payment into escrow."""
    if order.status != OrderStatus.pending:
        raise EscrowError(f"Order {order.id} is not pending (status={order.status})")

    external_id = f"{order.id}-collect-{uuid.uuid4().hex[:8]}"
    reference_id = await momo.request_to_pay(
        amount=order.total_amount,
        currency=order.currency,
        payer_msisdn=buyer_msisdn,
        external_id=external_id,
    )

    payment = Payment(
        order_id=order.id,
        mtn_reference_id=reference_id,
        external_id=external_id,
        direction=PaymentDirection.collection,
        phase=PaymentPhase.full_collection,
        amount=order.total_amount,
        counterparty_msisdn=buyer_msisdn,
        status=PaymentStatus.pending,
    )
    db.add(payment)
    db.commit()
    return payment


async def confirm_collection(db: Session, payment: Payment, order: Order) -> bool:
    """
    Poll MoMo for the collection result. Call this from a webhook handler
    or a background poller — not inline in the checkout request, since
    MoMo confirmation can take a few seconds to a minute.
    """
    status = await momo.get_collection_status(payment.mtn_reference_id)
    if status == "SUCCESSFUL":
        payment.status = PaymentStatus.successful
        order.status = OrderStatus.paid
        db.commit()
        return True
    if status == "FAILED":
        payment.status = PaymentStatus.failed
        db.commit()
        return False
    return False  # still pending


async def release_farmer_40(db: Session, order: Order, farmer_msisdn: str) -> Payment:
    """Release the first 40% once the farmer accepts / confirms the order."""
    if order.status != OrderStatus.paid:
        raise EscrowError(f"Order {order.id} must be 'paid' before releasing 40% (status={order.status})")

    external_id = f"{order.id}-payout40-{uuid.uuid4().hex[:8]}"
    amount = order.farmer_40_amount
    reference_id = await momo.transfer(
        amount=amount,
        currency=order.currency,
        payee_msisdn=farmer_msisdn,
        external_id=external_id,
        payee_note="40% on order confirmation",
    )

    payment = Payment(
        order_id=order.id,
        mtn_reference_id=reference_id,
        external_id=external_id,
        direction=PaymentDirection.disbursement,
        phase=PaymentPhase.farmer_40,
        amount=amount,
        counterparty_msisdn=farmer_msisdn,
        status=PaymentStatus.pending,
    )
    db.add(payment)
    order.status = OrderStatus.confirmed
    db.commit()
    return payment


async def release_farmer_60(db: Session, order: Order, farmer_msisdn: str) -> Payment:
    """Release the remaining 60% once delivery is confirmed by the buyer."""
    if order.status not in (OrderStatus.confirmed, OrderStatus.in_delivery):
        raise EscrowError(
            f"Order {order.id} must be confirmed/in_delivery before releasing 60% "
            f"(status={order.status})"
        )

    external_id = f"{order.id}-payout60-{uuid.uuid4().hex[:8]}"
    amount = order.farmer_60_amount
    reference_id = await momo.transfer(
        amount=amount,
        currency=order.currency,
        payee_msisdn=farmer_msisdn,
        external_id=external_id,
        payee_note="60% on delivery confirmation",
    )

    payment = Payment(
        order_id=order.id,
        mtn_reference_id=reference_id,
        external_id=external_id,
        direction=PaymentDirection.disbursement,
        phase=PaymentPhase.farmer_60,
        amount=amount,
        counterparty_msisdn=farmer_msisdn,
        status=PaymentStatus.pending,
    )
    db.add(payment)
    order.status = OrderStatus.delivered
    db.commit()
    return payment


async def retry_failed_disbursement(db: Session, payment: Payment) -> Payment:
    """
    Re-attempt a farmer_40 / farmer_60 disbursement that failed (network
    error, insufficient float in the merchant account, wrong MSISDN, etc).
    Reuses the same external_id so MoMo treats it as idempotent — call
    this from a retry queue/cron, not automatically inside the webhook.
    """
    if payment.status != PaymentStatus.failed:
        raise EscrowError(f"Payment {payment.id} is not in a failed state (status={payment.status})")
    if payment.direction != PaymentDirection.disbursement:
        raise EscrowError("Only disbursements can be retried through this path")

    reference_id = await momo.transfer(
        amount=payment.amount,
        currency=payment.order.currency,
        payee_msisdn=payment.counterparty_msisdn,
        external_id=payment.external_id,  # same external_id -> idempotent on MoMo's side
    )
    payment.mtn_reference_id = reference_id
    payment.status = PaymentStatus.pending
    payment.retry_count = str(int(payment.retry_count) + 1)
    db.commit()
    return payment


async def resolve_dispute(db: Session, order: Order, resolution: str, buyer_msisdn: str) -> dict:
    """
    Called by an admin/support flow once a dispute is investigated.
    resolution is one of:
      - "release_to_farmer": delivery did happen, release the 60% as normal
      - "refund_buyer": delivery didn't happen, refund the unearned 60%
        (the 40% already sent to the farmer is NOT auto-clawed-back — MoMo
        disbursements can't be reversed; recovering it is a manual/legal
        matter between platform and farmer, tracked outside this table)
    """
    if order.status != OrderStatus.disputed:
        raise EscrowError(f"Order {order.id} is not under dispute (status={order.status})")

    if resolution == "release_to_farmer":
        farmer_payment = next(
            (p for p in order.payments if p.phase.value == "farmer_40"), None
        )
        farmer_msisdn = farmer_payment.counterparty_msisdn if farmer_payment else None
        if not farmer_msisdn:
            raise EscrowError("No prior farmer payout found to determine payout MSISDN")
        payment = await release_farmer_60(db, order, farmer_msisdn)
        return {"resolution": "release_to_farmer", "payment_id": payment.id}

    if resolution == "refund_buyer":
        payment = await refund_remainder(db, order, buyer_msisdn)
        return {"resolution": "refund_buyer", "payment_id": payment.id}

    raise EscrowError(f"Unknown resolution: {resolution}")


async def refund_remainder(db: Session, order: Order, buyer_msisdn: str) -> Payment:
    """
    If delivery fails/disputes after the 40% went out, refund the buyer
    the unearned 60% (the 40% already paid to the farmer is not clawed
    back automatically — that needs a manual dispute resolution flow).
    """
    if order.status not in (OrderStatus.confirmed, OrderStatus.disputed):
        raise EscrowError(f"Order {order.id} is not eligible for a remainder refund (status={order.status})")

    external_id = f"{order.id}-refund60-{uuid.uuid4().hex[:8]}"
    amount = order.farmer_60_amount
    # NOTE: MoMo disbursement here is a simplification — refunding from your
    # merchant collections balance back to a buyer typically also goes
    # through the Disbursements product to the buyer's own MSISDN.
    reference_id = await momo.transfer(
        amount=amount,
        currency=order.currency,
        payee_msisdn=buyer_msisdn,
        external_id=external_id,
        payee_note="Refund: delivery not completed",
    )

    payment = Payment(
        order_id=order.id,
        mtn_reference_id=reference_id,
        external_id=external_id,
        direction=PaymentDirection.refund,
        phase=PaymentPhase.refund_remainder,
        amount=amount,
        counterparty_msisdn=buyer_msisdn,
        status=PaymentStatus.pending,
    )
    db.add(payment)
    order.status = OrderStatus.cancelled
    db.commit()
    return payment
