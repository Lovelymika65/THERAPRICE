"""
Minimal MTN MoMo API client (sandbox + production compatible).

MTN MoMo has separate products with separate subscription keys:
  - Collections   -> used to pull money FROM the buyer
  - Disbursements -> used to push money TO the farmer

Both follow the same request-to-pay / transfer pattern:
  1. POST the request, get back 202 Accepted (async)
  2. Poll GET .../{referenceId} until status is SUCCESSFUL or FAILED
     (or receive a webhook callback if you've registered one)

Env vars expected (put these in your .env / secrets manager, never in code):
  MOMO_BASE_URL              e.g. https://sandbox.momodeveloper.mtn.com
  MOMO_COLLECTIONS_SUB_KEY
  MOMO_COLLECTIONS_API_USER
  MOMO_COLLECTIONS_API_KEY
  MOMO_DISBURSEMENTS_SUB_KEY
  MOMO_DISBURSEMENTS_API_USER
  MOMO_DISBURSEMENTS_API_KEY
  MOMO_TARGET_ENVIRONMENT     "sandbox" or "mtncameroon" (prod)
"""

import os
import uuid
import base64
import httpx

BASE_URL = os.environ["MOMO_BASE_URL"]
TARGET_ENV = os.environ.get("MOMO_TARGET_ENVIRONMENT", "sandbox")


class MomoAuthError(Exception):
    pass


class MomoRequestError(Exception):
    pass


def _basic_auth_header(api_user: str, api_key: str) -> str:
    token = base64.b64encode(f"{api_user}:{api_key}".encode()).decode()
    return f"Basic {token}"


async def _get_access_token(product: str, sub_key: str, api_user: str, api_key: str) -> str:
    """product is 'collection' or 'disbursement' — matches MoMo's URL path naming."""
    url = f"{BASE_URL}/{product}/token/"
    headers = {
        "Ocp-Apim-Subscription-Key": sub_key,
        "Authorization": _basic_auth_header(api_user, api_key),
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=headers)
    if resp.status_code != 200:
        raise MomoAuthError(f"MoMo auth failed ({product}): {resp.status_code} {resp.text}")
    return resp.json()["access_token"]


def _callback_url() -> str | None:
    """
    Returns the full webhook URL to register on each request, built from
    MOMO_CALLBACK_BASE_URL + MOMO_CALLBACK_TOKEN (matches routes_webhooks.py's
    /{callback_token} route). Returns None if not configured, in which case
    you must poll get_collection_status/get_disbursement_status instead.
    """
    base = os.environ.get("MOMO_CALLBACK_BASE_URL")
    token = os.environ.get("MOMO_CALLBACK_TOKEN")
    if not base or not token:
        return None
    return f"{base.rstrip('/')}/webhooks/momo/{token}"


async def request_to_pay(*, amount: float, currency: str, payer_msisdn: str,
                          external_id: str, payer_message: str = "Theraprice order payment",
                          payee_note: str = "Order payment") -> str:
    """
    Collections: pull `amount` from the buyer's MoMo wallet.
    Returns the MoMo reference_id — store this on the Payment row. If
    MOMO_CALLBACK_BASE_URL is set, MoMo will POST the result to your webhook;
    otherwise fall back to polling get_collection_status().
    """
    sub_key = os.environ["MOMO_COLLECTIONS_SUB_KEY"]
    api_user = os.environ["MOMO_COLLECTIONS_API_USER"]
    api_key = os.environ["MOMO_COLLECTIONS_API_KEY"]

    token = await _get_access_token("collection", sub_key, api_user, api_key)
    reference_id = str(uuid.uuid4())

    url = f"{BASE_URL}/collection/v1_0/requesttopay"
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Reference-Id": reference_id,
        "X-Target-Environment": TARGET_ENV,
        "Ocp-Apim-Subscription-Key": sub_key,
        "Content-Type": "application/json",
    }
    callback = _callback_url()
    if callback:
        headers["X-Callback-Url"] = callback
    payload = {
        "amount": str(amount),
        "currency": currency,
        "externalId": external_id,
        "payer": {"partyIdType": "MSISDN", "partyId": payer_msisdn},
        "payerMessage": payer_message,
        "payeeNote": payee_note,
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=headers, json=payload)
    if resp.status_code != 202:
        raise MomoRequestError(f"requesttopay failed: {resp.status_code} {resp.text}")
    return reference_id


async def get_collection_status(reference_id: str) -> str:
    """Returns one of: PENDING, SUCCESSFUL, FAILED."""
    sub_key = os.environ["MOMO_COLLECTIONS_SUB_KEY"]
    api_user = os.environ["MOMO_COLLECTIONS_API_USER"]
    api_key = os.environ["MOMO_COLLECTIONS_API_KEY"]
    token = await _get_access_token("collection", sub_key, api_user, api_key)

    url = f"{BASE_URL}/collection/v1_0/requesttopay/{reference_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Target-Environment": TARGET_ENV,
        "Ocp-Apim-Subscription-Key": sub_key,
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
    resp.raise_for_status()
    return resp.json()["status"]


async def transfer(*, amount: float, currency: str, payee_msisdn: str,
                    external_id: str, payer_message: str = "Theraprice farmer payout",
                    payee_note: str = "Order payout") -> str:
    """
    Disbursements: push `amount` to the farmer's MoMo wallet.
    Used for both the 40% and 60% releases — call twice per order, once
    per phase, each with its own external_id for idempotency.
    """
    sub_key = os.environ["MOMO_DISBURSEMENTS_SUB_KEY"]
    api_user = os.environ["MOMO_DISBURSEMENTS_API_USER"]
    api_key = os.environ["MOMO_DISBURSEMENTS_API_KEY"]

    token = await _get_access_token("disbursement", sub_key, api_user, api_key)
    reference_id = str(uuid.uuid4())

    url = f"{BASE_URL}/disbursement/v1_0/transfer"
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Reference-Id": reference_id,
        "X-Target-Environment": TARGET_ENV,
        "Ocp-Apim-Subscription-Key": sub_key,
        "Content-Type": "application/json",
    }
    callback = _callback_url()
    if callback:
        headers["X-Callback-Url"] = callback
    payload = {
        "amount": str(amount),
        "currency": currency,
        "externalId": external_id,
        "payee": {"partyIdType": "MSISDN", "partyId": payee_msisdn},
        "payerMessage": payer_message,
        "payeeNote": payee_note,
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=headers, json=payload)
    if resp.status_code != 202:
        raise MomoRequestError(f"transfer failed: {resp.status_code} {resp.text}")
    return reference_id


async def get_disbursement_status(reference_id: str) -> str:
    """Returns one of: PENDING, SUCCESSFUL, FAILED."""
    sub_key = os.environ["MOMO_DISBURSEMENTS_SUB_KEY"]
    api_user = os.environ["MOMO_DISBURSEMENTS_API_USER"]
    api_key = os.environ["MOMO_DISBURSEMENTS_API_KEY"]
    token = await _get_access_token("disbursement", sub_key, api_user, api_key)

    url = f"{BASE_URL}/disbursement/v1_0/transfer/{reference_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Target-Environment": TARGET_ENV,
        "Ocp-Apim-Subscription-Key": sub_key,
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
    resp.raise_for_status()
    return resp.json()["status"]
