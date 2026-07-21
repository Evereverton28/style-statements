"""Server-persisted cart and wishlist."""
import uuid
from datetime import datetime
from app.config.database import db


class CartItem(db.Model):
    __tablename__ = "cart_items"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    product_id = db.Column(db.String(36), db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship("Product", lazy=True)

    def to_dict(self):
        p = self.product
        return {
            "product_id": self.product_id,
            "name": p.name if p else None,
            "price_cents": p.price_cents if p else 0,
            "image_url": p.image_url if p else None,
            "quantity": self.quantity,
        }


class WishlistItem(db.Model):
    __tablename__ = "wishlist_items"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), primary_key=True)
    product_id = db.Column(db.String(36), db.ForeignKey("products.id"), primary_key=True)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
