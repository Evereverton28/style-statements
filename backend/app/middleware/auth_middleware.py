"""Helpers for resolving the authenticated user from the JWT."""
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.user import User


def current_user(optional=False):
    """Return the User for the current token, or None."""
    verify_jwt_in_request(optional=optional)
    uid = get_jwt_identity()
    if not uid:
        return None
    return User.query.get(uid)
