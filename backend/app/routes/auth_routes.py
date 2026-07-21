"""Authentication endpoints."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.user import User
from app.services.auth_service import create_user, authenticate
from app.utils.validators import valid_email, valid_password, require_fields

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

ADMIN_ROLES = ("super_admin", "manager", "staff")


@bp.post("/admin-register")
def admin_register():
    """Create a staff/manager/admin account — requires a valid invite code.
    Prevents public self-signup into privileged roles."""
    data = request.get_json() or {}
    code = data.get("invite_code")
    expected = current_app.config.get("ADMIN_SIGNUP_CODE")
    if not expected or code != expected:
        return jsonify(error="Invalid or missing admin invite code"), 403

    missing = require_fields(data, ["full_name", "email", "password"])
    if missing:
        return jsonify(error=f"Missing: {', '.join(missing)}"), 400
    if not valid_email(data["email"]):
        return jsonify(error="Invalid email"), 400
    if not valid_password(data["password"]):
        return jsonify(error="Password must be at least 6 characters"), 400
    if User.query.filter_by(email=data["email"].lower()).first():
        return jsonify(error="Email already registered"), 409

    role = data.get("role", "manager")
    if role not in ADMIN_ROLES:
        role = "manager"
    user = create_user(data["full_name"], data["email"], data["password"], data.get("phone"), role=role)
    token = create_access_token(identity=user.id, additional_claims={"role": user.role})
    return jsonify(token=token, user=user.to_dict()), 201


@bp.post("/register")
def register():
    data = request.get_json() or {}
    missing = require_fields(data, ["full_name", "email", "password"])
    if missing:
        return jsonify(error=f"Missing: {', '.join(missing)}"), 400
    if not valid_email(data["email"]):
        return jsonify(error="Invalid email"), 400
    if not valid_password(data["password"]):
        return jsonify(error="Password must be at least 6 characters"), 400
    if User.query.filter_by(email=data["email"].lower()).first():
        return jsonify(error="Email already registered"), 409

    user = create_user(data["full_name"], data["email"], data["password"], data.get("phone"))
    token = create_access_token(identity=user.id, additional_claims={"role": user.role})
    return jsonify(token=token, user=user.to_dict()), 201


@bp.post("/login")
def login():
    data = request.get_json() or {}
    user = authenticate(data.get("email"), data.get("password"))
    if not user:
        return jsonify(error="Invalid credentials"), 401
    token = create_access_token(identity=user.id, additional_claims={"role": user.role})
    return jsonify(token=token, user=user.to_dict())


@bp.get("/me")
@jwt_required()
def me():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify(error="Not found"), 404
    return jsonify(user=user.to_dict())
