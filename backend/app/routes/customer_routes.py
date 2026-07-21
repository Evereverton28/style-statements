"""Customer management (admin)."""
from flask import Blueprint, jsonify
from sqlalchemy import func
from app.config.database import db
from app.models.user import User
from app.models.order import Order
from app.middleware.role_middleware import role_required

bp = Blueprint("customers", __name__, url_prefix="/api/customers")


@bp.get("")
@role_required("super_admin", "manager")
def list_customers():
    customers = User.query.filter_by(role="customer").all()
    out = []
    for c in customers:
        spent = db.session.query(func.coalesce(func.sum(Order.total_cents), 0)) \
            .filter(Order.user_id == c.id, Order.payment_status == "paid").scalar() or 0
        order_count = Order.query.filter_by(user_id=c.id).count()
        d = c.to_dict()
        d.update(orders=order_count, lifetime_spend_cents=int(spent))
        out.append(d)
    return jsonify(customers=out)
