"""Small input validators."""
import re

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def valid_email(email):
    return bool(email and EMAIL_RE.match(email))


def valid_password(pw):
    return bool(pw and len(pw) >= 6)


def require_fields(data, fields):
    """Return a list of missing field names."""
    return [f for f in fields if not data.get(f)]
