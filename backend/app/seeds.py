"""Seed the database with the Style Statements catalog on first run."""
import os
from app.config.database import db
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.utils.helpers import slugify

CATEGORIES = {
    "Jewelry": ["Rings", "Earrings", "Necklaces", "Bracelets", "Anklets"],
    "Sunglasses": ["Aviator", "Cat Eye", "Oversized", "Classic"],
    "Perfumes": ["Men's", "Women's", "Unisex", "Gift Sets"],
}

PRODUCTS = [
    ("Aurora Clover Studs", "Jewelry", "Earrings", 250000, 4, "New", 4.9, 41,
     "Gold-plated clover studs with a soft brushed finish.",
     {"Material": "18k gold plate over brass", "Fastening": "Hypoallergenic post"}),
    ("Cyan Drop Necklace", "Jewelry", "Necklaces", 380000, 22, "Best seller", 4.8, 63,
     "A single teal-cyan drop on a fine gold chain.",
     {"Material": "Gold-fill chain", "Length": "42cm + 5cm extender"}),
    ("Éclat Tennis Bracelet", "Jewelry", "Bracelets", 420000, 12, None, 4.7, 28,
     "A continuous line of set stones.",
     {"Material": "Rhodium plate, CZ", "Fit": "18cm"}),
    ("Solène Signet Ring", "Jewelry", "Rings", 290000, 8, "New", 4.6, 19,
     "A modern signet with a matte-gold face.",
     {"Material": "Steel, gold PVD", "Sizes": "6-9"}),
    ("Nadia Anklet", "Jewelry", "Anklets", 180000, 20, None, 4.8, 34,
     "Delicate gold anklet with a teal charm.",
     {"Material": "Gold-fill", "Length": "24cm + extender"}),
    ("Marlowe Aviator", "Sunglasses", "Aviator", 350000, 3, "Best seller", 4.9, 52,
     "Classic aviator with gradient teal lenses.",
     {"Frame": "Metal alloy", "Lens": "UV400 polarized"}),
    ("Lumen Cat Eye", "Sunglasses", "Cat Eye", 320000, 14, "New", 4.7, 30,
     "Sculpted cat-eye frames.",
     {"Frame": "Acetate", "Lens": "UV400"}),
    ("Vera Oversized", "Sunglasses", "Oversized", 360000, 9, None, 4.6, 22,
     "Oversized coverage, featherlight feel.",
     {"Frame": "Acetate", "Lens": "UV400 gradient"}),
    ("Ellis Classic", "Sunglasses", "Classic", 280000, 18, None, 4.8, 44,
     "The everyday classic.",
     {"Frame": "Polycarbonate", "Lens": "UV400"}),
    ("Noir Statement", "Perfumes", "Men's", 550000, 15, "Best seller", 4.9, 71,
     "Leather, cedar and a whisper of bergamot.",
     {"Type": "Eau de Parfum", "Size": "100ml"}),
    ("Velvet Teal", "Perfumes", "Women's", 580000, 2, "New", 4.8, 58,
     "Peony, amber and soft musk.",
     {"Type": "Eau de Parfum", "Size": "100ml"}),
    ("Aura Unisex", "Perfumes", "Unisex", 620000, 11, None, 4.7, 39,
     "A clean, luminous signature.",
     {"Type": "Eau de Parfum", "Size": "100ml"}),
    ("Signature Gift Set", "Perfumes", "Gift Sets", 890000, 9, None, 5.0, 26,
     "Two travel sprays and a full bottle in a keepsake box.",
     {"Includes": "100ml + 2x10ml", "Packaging": "Magnetic gift box"}),
]


def seed_if_empty():
    from flask import current_app
    if User.query.first():
        return  # already initialised

    # ---- default super admin only (your login; not fake data) ----
    # No personal name by default — it's the store owner account, not a person.
    # Set ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD in .env to customise.
    admin = User(
        full_name=os.getenv("ADMIN_NAME", ""),
        email=os.getenv("ADMIN_EMAIL", "owner@stylestatements.co.ke"),
        phone=os.getenv("ADMIN_PHONE", "0704358866"),
        role="super_admin",
    )
    admin.set_password(os.getenv("ADMIN_PASSWORD", "changeme123"))
    db.session.add(admin)

    # ---- category structure (the store taxonomy; needed by the Add Product form) ----
    cat_map = {}
    for name, subs in CATEGORIES.items():
        c = Category(name=name, slug=slugify(name))
        db.session.add(c)
        db.session.flush()
        cat_map[name] = c
        for i, sub in enumerate(subs):
            db.session.add(Category(name=sub, slug=slugify(f"{name}-{sub}"),
                                    parent_id=c.id, sort_order=i))

    # ---- sample products: OFF by default. Set SEED_SAMPLE_DATA=true in .env to load them. ----
    if current_app.config.get("SEED_SAMPLE_DATA"):
        for (name, cat, sub, price, stock, badge, rating, reviews, desc, specs) in PRODUCTS:
            db.session.add(Product(
                name=name, slug=slugify(name), category_id=cat_map[cat].id, subcategory=sub,
                description=desc, specs=specs, price_cents=price, stock=stock,
                badge=badge, is_featured=(badge == "Best seller"),
                rating_avg=rating, rating_count=reviews,
            ))
        print("[seed] admin + categories + SAMPLE products loaded.")
    else:
        print("[seed] admin + categories created. Store starts empty (0 products/orders/customers).")

    db.session.commit()
