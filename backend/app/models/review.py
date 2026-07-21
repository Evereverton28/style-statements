"""Customer product reviews (moderated)."""
import uuid
from datetime import datetime
from app.config.database import db


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = db.Column(db.String(36), db.ForeignKey("products.id"), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"))
    author_name = db.Column(db.String(120), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    body = db.Column(db.Text)
    status = db.Column(db.String(20), default="pending")   # pending / approved / rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "author": self.author_name,
            "rating": self.rating,
            "body": self.body,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
