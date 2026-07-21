"""Product review endpoints."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.config.database import db
from app.models.review import Review
from app.models.product import Product

bp = Blueprint("reviews", __name__, url_prefix="/api/reviews")


@bp.post("")
@jwt_required(optional=True)
def submit_review():
    d = request.get_json() or {}
    if not d.get("product_id") or not d.get("rating"):
        return jsonify(error="product_id and rating required"), 400
    r = Review(
        product_id=d["product_id"], user_id=get_jwt_identity(),
        author_name=d.get("author_name", "Anonymous"),
        rating=int(d["rating"]), body=d.get("body"), status="pending",
    )
    db.session.add(r)
    db.session.commit()
    return jsonify(review=r.to_dict(), message="Submitted for moderation"), 201


@bp.get("/product/<product_id>")
def product_reviews(product_id):
    reviews = Review.query.filter_by(product_id=product_id, status="approved") \
        .order_by(Review.created_at.desc()).all()
    return jsonify(reviews=[r.to_dict() for r in reviews])
