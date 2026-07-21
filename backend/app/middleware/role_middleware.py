"""Role-based access control decorator.

The client hiding a menu item is UX; this decorator is the real boundary.
Usage:
    @role_required("super_admin", "manager")
    def delete_product(...): ...
"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def role_required(*allowed_roles):
    def wrapper(fn):
        @wraps(fn)
        def inner(*args, **kwargs):
            verify_jwt_in_request()
            role = get_jwt().get("role")
            if role not in allowed_roles:
                return jsonify(error="forbidden", message="Insufficient permissions"), 403
            return fn(*args, **kwargs)
        return inner
    return wrapper


# Any authenticated staff member (not a plain customer)
def admin_required(fn):
    return role_required("super_admin", "manager", "staff")(fn)
