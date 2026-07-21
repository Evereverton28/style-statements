"""Orders and their line items."""
import uuid
from datetime import datetime
from app.config.database import db

ORDER_STATUSES = (
    "pending", "processing", "ready_for_delivery",
    "delivered", "cancelled", "refund_requested", "refunded",
)


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number = db.Column(db.String(20), unique=True, nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"))
    status = db.Column(db.String(30), default="pending")
    subtotal_cents = db.Column(db.Integer, default=0)
    discount_cents = db.Column(db.Integer, default=0)
    shipping_cents = db.Column(db.Integer, default=0)
    tax_cents = db.Column(db.Integer, default=0)
    total_cents = db.Column(db.Integer, default=0)
    payment_method = db.Column(db.String(20))          # mpesa / card / cash_on_delivery
    payment_status = db.Column(db.String(20), default="unpaid")
    shipping_address = db.Column(db.JSON, default=dict)
    notes = db.Column(db.Text)
    placed_at = db.Column(db.DateTime, default=datetime.utcnow)

    items = db.relationship("OrderItem", backref="order", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "order_number": self.order_number,
            "customer": self.user.full_name if self.user else "Guest",
            "status": self.status,
            "total_cents": self.total_cents,
            "total": self.total_cents / 100,
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "items": [i.to_dict() for i in self.items],
            "item_count": sum(i.quantity for i in self.items),
            "placed_at": self.placed_at.isoformat() if self.placed_at else None,
        }


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = db.Column(db.String(36), db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.String(36), db.ForeignKey("products.id"))
    product_name = db.Column(db.String(160), nullable=False)   # snapshot
    unit_cents = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)

    def to_dict(self):
        return {
            "product_id": self.product_id,
            "product_name": self.product_name,
            "unit_cents": self.unit_cents,
            "quantity": self.quantity,
            "line_total": self.unit_cents * self.quantity,
        }
