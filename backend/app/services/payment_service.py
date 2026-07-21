"""M-Pesa (Daraja) payment integration — scaffold.

Real STK Push requires live Safaricom Daraja credentials in .env.
Until those are set, initiate_stk_push returns a simulated response so the
checkout flow is testable end to end.
"""
import base64
import datetime
from flask import current_app

try:
    import requests
except ImportError:                      # requests optional until real integration
    requests = None

DARAJA_BASE = "https://sandbox.safaricom.co.ke"


def _get_access_token():
    key = current_app.config.get("MPESA_CONSUMER_KEY")
    secret = current_app.config.get("MPESA_CONSUMER_SECRET")
    if not (key and secret and requests):
        return None
    r = requests.get(
        f"{DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials",
        auth=(key, secret), timeout=15,
    )
    return r.json().get("access_token")


def initiate_stk_push(phone, amount_kes, order_number):
    """Trigger an STK push. Falls back to a simulated response if not configured."""
    token = _get_access_token()
    shortcode = current_app.config.get("MPESA_SHORTCODE")
    passkey = current_app.config.get("MPESA_PASSKEY")

    if not (token and shortcode and passkey):
        # Not configured yet — simulate so the flow is testable.
        return {
            "simulated": True,
            "status": "pending",
            "message": "M-Pesa not configured. Set MPESA_* in .env to go live.",
            "order_number": order_number,
        }

    ts = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    password = base64.b64encode(f"{shortcode}{passkey}{ts}".encode()).decode()
    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": ts,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount_kes),
        "PartyA": phone,
        "PartyB": shortcode,
        "PhoneNumber": phone,
        "CallBackURL": current_app.config.get("MPESA_CALLBACK_URL"),
        "AccountReference": order_number,
        "TransactionDesc": "Style Statements order",
    }
    r = requests.post(
        f"{DARAJA_BASE}/mpesa/stkpush/v1/processrequest",
        json=payload, headers={"Authorization": f"Bearer {token}"}, timeout=20,
    )
    return r.json()
