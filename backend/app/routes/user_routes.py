"""Team account management (admin panel).

Hierarchy enforced on every request:
  super_admin -> manages managers + staff
  manager     -> manages staff only
  staff       -> manages nobody
  customer    -> self-registration only; never created or managed here
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app.config.database import db
from app.models.user import User
from app.services.auth_service import create_user
from app.utils.validators import valid_email, valid_password, require_fields
from app.utils.hierarchy import can_manage, manageable_roles, ADMIN_CREATABLE

bp = Blueprint("team", __name__, url_prefix="/api/admin/users")

STAFF_ROLES = ("super_admin", "manager", "staff")


def _actor():
    return get_jwt().get("role"), get_jwt_identity()


@bp.get("")
@jwt_required()
def list_team():
    """List staff accounts this actor may see. Customers are never listed here."""
    role, _ = _actor()
    if role not in STAFF_ROLES:
        return jsonify(error="forbidden"), 403

    if role == "super_admin":
        visible = User.query.filter(User.role.in_(STAFF_ROLES)).all()
    elif role == "manager":
        # A manager sees staff, plus themselves for context.
        visible = User.query.filter(User.role == "staff").all()
    else:
        visible = []  # staff see no team list

    return jsonify(
        users=[u.to_dict() for u in visible],
        can_create=manageable_roles(role),   # drives the frontend UI
    )


@bp.post("")
@jwt_required()
def create_team_member():
    """Create a Manager or Staff account, subject to the hierarchy."""
    actor_role, _ = _actor()
    data = request.get_json() or {}
    target_role = data.get("role", "staff")

    # Customers must self-register — never created from the admin panel.
    if target_role == "customer":
        return jsonify(error="Customers must register themselves via the public Sign Up page"), 400
    if target_role not in ADMIN_CREATABLE:
        return jsonify(error="Invalid role"), 400
    if not can_manage(actor_role, target_role):
        return jsonify(error=f"A {actor_role} cannot create a {target_role} account"), 403

    missing = require_fields(data, ["full_name", "email", "password"])
    if missing:
        return jsonify(error=f"Missing: {', '.join(missing)}"), 400
    if not valid_email(data["email"]):
        return jsonify(error="Invalid email"), 400
    if not valid_password(data["password"]):
        return jsonify(error="Password must be at least 6 characters"), 400
    if User.query.filter_by(email=data["email"].lower()).first():
        return jsonify(error="Email already registered"), 409

    user = create_user(data["full_name"], data["email"], data["password"],
                       data.get("phone"), role=target_role)
    return jsonify(user=user.to_dict()), 201


@bp.put("/<user_id>")
@jwt_required()
def update_team_member(user_id):
    """Edit a team member's details, or change their role within the hierarchy."""
    actor_role, actor_id = _actor()
    target = User.query.get(user_id)
    if not target:
        return jsonify(error="Not found"), 404
    if target.role == "customer":
        return jsonify(error="Customer accounts are not managed here"), 403
    if not can_manage(actor_role, target.role):
        return jsonify(error=f"A {actor_role} cannot manage a {target.role} account"), 403

    data = request.get_json() or {}

    # Role changes must also land inside the actor's authority.
    if "role" in data and data["role"] != target.role:
        new_role = data["role"]
        if not can_manage(actor_role, new_role):
            return jsonify(error=f"A {actor_role} cannot assign the {new_role} role"), 403
        target.role = new_role

    for field in ("full_name", "phone"):
        if field in data:
            setattr(target, field, data[field])
    if data.get("email"):
        if not valid_email(data["email"]):
            return jsonify(error="Invalid email"), 400
        clash = User.query.filter_by(email=data["email"].lower()).first()
        if clash and clash.id != target.id:
            return jsonify(error="Email already registered"), 409
        target.email = data["email"].lower()
    if data.get("password"):
        if not valid_password(data["password"]):
            return jsonify(error="Password must be at least 6 characters"), 400
        target.set_password(data["password"])

    db.session.commit()
    return jsonify(user=target.to_dict())


@bp.patch("/<user_id>/status")
@jwt_required()
def set_active(user_id):
    """Activate or deactivate an account (deactivated users cannot log in)."""
    actor_role, actor_id = _actor()
    target = User.query.get(user_id)
    if not target:
        return jsonify(error="Not found"), 404
    if target.id == actor_id:
        return jsonify(error="You cannot deactivate your own account"), 400
    if target.role == "customer":
        return jsonify(error="Customer accounts are not managed here"), 403
    if not can_manage(actor_role, target.role):
        return jsonify(error=f"A {actor_role} cannot manage a {target.role} account"), 403

    target.is_active = bool((request.get_json() or {}).get("is_active", True))
    db.session.commit()
    return jsonify(user=target.to_dict())


@bp.delete("/<user_id>")
@jwt_required()
def delete_team_member(user_id):
    actor_role, actor_id = _actor()
    target = User.query.get(user_id)
    if not target:
        return jsonify(error="Not found"), 404
    if target.id == actor_id:
        return jsonify(error="You cannot delete your own account"), 400
    if target.role == "customer":
        return jsonify(error="Customer accounts are not managed here"), 403
    if not can_manage(actor_role, target.role):
        return jsonify(error=f"A {actor_role} cannot delete a {target.role} account"), 403

    db.session.delete(target)
    db.session.commit()
    return jsonify(deleted=user_id)
