"""Transactional email — stub. Wire an SMTP provider (e.g. SendGrid) when ready."""


def send_order_confirmation(to_email, order_number):
    # TODO: integrate real email provider.
    print(f"[email] order {order_number} confirmation -> {to_email}")
    return True
