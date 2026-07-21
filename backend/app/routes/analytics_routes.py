"""Analytics endpoints (admin)."""
from flask import Blueprint, jsonify
from app.middleware.role_middleware import role_required
from app.services.analytics_service import dashboard_summary, best_sellers

bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")


@bp.get("/summary")
@role_required("super_admin", "manager", "staff")
def summary():
    return jsonify(dashboard_summary())


@bp.get("/best-sellers")
@role_required("super_admin", "manager")
def bestsellers():
    return jsonify(best_sellers=best_sellers())
