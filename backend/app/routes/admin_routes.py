"""Admin-only management endpoints (orders pipeline, review moderation)."""
from flask import Blueprint, request, jsonify
from app.config.database import db
from app.models.order import Order, ORDER_STATUSES
from app.models.review import Review
from app.middleware.role_middleware import role_required, admin_required

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


# ---- Orders ----
@bp.get("/orders")
@admin_required
def all_orders():
    status = request.args.get("status")
    q = Order.query
    if status and status != "All":
        q = q.filter_by(status=status)
    orders = q.order_by(Order.placed_at.desc()).all()
    return jsonify(orders=[o.to_dict() for o in orders])


@bp.patch("/orders/<order_id>")
@admin_required
def update_order_status(order_id):
    o = Order.query.get(order_id)
    if not o:
        return jsonify(error="Not found"), 404
    status = (request.get_json() or {}).get("status")
    if status not in ORDER_STATUSES:
        return jsonify(error="Invalid status"), 400
    o.status = status
    db.session.commit()
    return jsonify(order=o.to_dict())


# ---- Reviews moderation ----
@bp.get("/reviews")
@admin_required
def all_reviews():
    reviews = Review.query.order_by(Review.created_at.desc()).all()
    return jsonify(reviews=[r.to_dict() for r in reviews])


@bp.patch("/reviews/<review_id>")
@admin_required
def moderate_review(review_id):
    r = Review.query.get(review_id)
    if not r:
        return jsonify(error="Not found"), 404
    status = (request.get_json() or {}).get("status")
    if status not in ("approved", "rejected", "pending"):
        return jsonify(error="Invalid status"), 400
    r.status = status
    db.session.commit()
    return jsonify(review=r.to_dict())


@bp.delete("/reviews/<review_id>")
@role_required("super_admin", "manager")
def delete_review(review_id):
    r = Review.query.get(review_id)
    if not r:
        return jsonify(error="Not found"), 404
    db.session.delete(r)
    db.session.commit()
    return jsonify(deleted=review_id)
