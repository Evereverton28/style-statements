"""Product categories and subcategories (Jewelry > Rings, etc.)."""
import uuid
from app.config.database import db


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(80), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    parent_id = db.Column(db.String(36), db.ForeignKey("categories.id"))
    sort_order = db.Column(db.Integer, default=0)

    children = db.relationship("Category", backref=db.backref("parent", remote_side=[id]), lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "parent_id": self.parent_id,
            "subcategories": [c.name for c in self.children],
        }
