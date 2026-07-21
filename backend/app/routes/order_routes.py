"""Order + checkout endpoints."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.config.database import db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.services.payment_service import initiate_stk_push
from app.utils.helpers import new_order_number

bp = Blueprint("orders", __name__, url_prefix="/api/orders")

SHIPPING_FREE_THRESHOLD = 500000   # KES 5,000 in cents
NAIROBI_SHIPPING = 30000           # KES 300 in cents


@bp.post("/checkout")
@jwt_required(optional=True)
def checkout():
    """Body: {items:[{product_id, quantity}], shipping_address, payment_method, phone}"""
    d = request.get_json() or {}
    items = d.get("items", [])
    if not items:
        return jsonify(error="Cart is empty"), 400

    subtotal = 0
    line_items = []
    for it in items:
        p = Product.query.get(it.get("product_id"))
        if not p:
            continue
        qty = max(1, int(it.get("quantity", 1)))
        subtotal += p.price_cents * qty
        line_items.append((p, qty))

    if not line_items:
        return jsonify(error="No valid products"), 400

    shipping = 0 if subtotal >= SHIPPING_FREE_THRESHOLD else NAIROBI_SHIPPING
    total = subtotal + shipping

    order = Order(
        order_number=new_order_number(),
        user_id=get_jwt_identity(),
        subtotal_cents=subtotal, shipping_cents=shipping, total_cents=total,
        payment_method=d.get("payment_method", "mpesa"),
        shipping_address=d.get("shipping_address", {}),
        status="pending",
    )
    for p, qty in line_items:
        order.items.append(OrderItem(
            product_id=p.id, product_name=p.name, unit_cents=p.price_cents, quantity=qty
        ))
    db.session.add(order)
    db.session.commit()

    payment = None
    if order.payment_method == "mpesa" and d.get("phone"):
        payment = initiate_stk_push(d["phone"], total / 100, order.order_number)

    return jsonify(order=order.to_dict(), payment=payment), 201


@bp.get("")
@jwt_required()
def my_orders():
    orders = Order.query.filter_by(user_id=get_jwt_identity()) \
        .order_by(Order.placed_at.desc()).all()
    return jsonify(orders=[o.to_dict() for o in orders])


@bp.get("/<order_number>")
def track_order(order_number):
    o = Order.query.filter_by(order_number=order_number).first()
    if not o:
        return jsonify(error="Not found"), 404
    return jsonify(order=o.to_dict())
