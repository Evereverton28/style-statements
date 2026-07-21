"""Analytics computations for the admin dashboard."""
from sqlalchemy import func
from app.config.database import db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User


def dashboard_summary():
    paid = Order.query.filter(Order.payment_status == "paid")
    revenue_cents = db.session.query(func.coalesce(func.sum(Order.total_cents), 0)) \
        .filter(Order.payment_status == "paid").scalar() or 0
    order_count = Order.query.count()
    customer_count = User.query.filter_by(role="customer").count()
    aov = (revenue_cents / order_count) if order_count else 0

    low_stock = [p.to_dict() for p in Product.query.filter(Product.stock <= 5).all()]
    recent = [o.to_dict() for o in Order.query.order_by(Order.placed_at.desc()).limit(5).all()]

    return {
        "revenue_cents": int(revenue_cents),
        "orders": order_count,
        "customers": customer_count,
        "avg_order_value_cents": int(aov),
        "low_stock_count": len(low_stock),
        "low_stock": low_stock,
        "recent_orders": recent,
    }


def best_sellers(limit=5):
    rows = db.session.query(
        OrderItem.product_name,
        func.sum(OrderItem.quantity).label("sold"),
    ).group_by(OrderItem.product_name).order_by(func.sum(OrderItem.quantity).desc()).limit(limit).all()
    return [{"name": name, "sold": int(sold)} for name, sold in rows]
