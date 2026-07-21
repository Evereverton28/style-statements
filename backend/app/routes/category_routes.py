"""Category endpoints."""
from flask import Blueprint, jsonify
from app.models.category import Category

bp = Blueprint("categories", __name__, url_prefix="/api/categories")


@bp.get("")
def list_categories():
    top = Category.query.filter_by(parent_id=None).order_by(Category.sort_order).all()
    return jsonify(categories=[c.to_dict() for c in top])
