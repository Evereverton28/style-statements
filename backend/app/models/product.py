"""Products — the core catalog item. Money stored as integer cents (KES)."""
import uuid
from datetime import datetime
from app.config.database import db


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(160), nullable=False)
    slug = db.Column(db.String(180), unique=True, nullable=False)
    category_id = db.Column(db.String(36), db.ForeignKey("categories.id"))
    subcategory = db.Column(db.String(80))
    description = db.Column(db.Text)
    specs = db.Column(db.JSON, default=dict)          # {"Material": "...", ...}
    price_cents = db.Column(db.Integer, nullable=False, default=0)
    compare_at_cents = db.Column(db.Integer)
    stock = db.Column(db.Integer, nullable=False, default=0)
    low_stock_at = db.Column(db.Integer, default=5)
    is_active = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    badge = db.Column(db.String(40))                  # 'New', 'Best seller'
    image_url = db.Column(db.String(400))
    gallery = db.Column(db.JSON, default=list)        # extra image URLs
    rating_avg = db.Column(db.Float, default=0)
    rating_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    category = db.relationship("Category", lazy=True)

    @property
    def price(self):
        return self.price_cents / 100

    @property
    def is_low_stock(self):
        return self.stock <= (self.low_stock_at or 5)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "category": self.category.name if self.category else None,
            "subcategory": self.subcategory,
            "description": self.description,
            "specs": self.specs or {},
            "price_cents": self.price_cents,
            "price": self.price,
            "stock": self.stock,
            "low_stock": self.is_low_stock,
            "is_active": self.is_active,
            "is_featured": self.is_featured,
            "badge": self.badge,
            "image_url": self.image_url,
            "gallery": self.gallery or [],
            "rating": self.rating_avg,
            "reviews": self.rating_count,
        }
