"""Server-persisted cart endpoints."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.config.database import db
from app.models.cart import CartItem

bp = Blueprint("cart", __name__, url_prefix="/api/cart")


@bp.get("")
@jwt_required()
def get_cart():
    items = CartItem.query.filter_by(user_id=get_jwt_identity()).all()
    return jsonify(items=[i.to_dict() for i in items])


@bp.post("/items")
@jwt_required()
def add_item():
    d = request.get_json() or {}
    uid = get_jwt_identity()
    existing = CartItem.query.filter_by(user_id=uid, product_id=d.get("product_id")).first()
    if existing:
        existing.quantity += int(d.get("quantity", 1))
    else:
        db.session.add(CartItem(
            user_id=uid, product_id=d["product_id"], quantity=int(d.get("quantity", 1))
        ))
    db.session.commit()
    return jsonify(message="Added"), 201


@bp.delete("/items/<product_id>")
@jwt_required()
def remove_item(product_id):
    CartItem.query.filter_by(user_id=get_jwt_identity(), product_id=product_id).delete()
    db.session.commit()
    return jsonify(message="Removed")
