"""Product catalog endpoints (public reads + admin writes)."""
from flask import Blueprint, request, jsonify
from app.config.database import db
from app.models.product import Product
from app.models.category import Category
from app.middleware.role_middleware import role_required
from app.utils.helpers import slugify, paginate

bp = Blueprint("products", __name__, url_prefix="/api/products")


@bp.get("")
def list_products():
    q = Product.query.filter_by(is_active=True)

    category = request.args.get("category")
    if category and category != "All":
        cat = Category.query.filter(
            (Category.name == category) | (Category.slug == slugify(category))
        ).first()
        if cat:
            q = q.filter_by(category_id=cat.id)

    search = request.args.get("q")
    if search:
        like = f"%{search}%"
        q = q.filter(db.or_(Product.name.ilike(like), Product.subcategory.ilike(like)))

    sort = request.args.get("sort", "featured")
    if sort == "low":
        q = q.order_by(Product.price_cents.asc())
    elif sort == "high":
        q = q.order_by(Product.price_cents.desc())
    elif sort == "rating":
        q = q.order_by(Product.rating_avg.desc())
    else:
        q = q.order_by(Product.is_featured.desc(), Product.created_at.desc())

    result = paginate(q, request.args.get("page", 1))
    return jsonify(
        products=[p.to_dict() for p in result["items"]],
        page=result["page"], pages=result["pages"], total=result["total"],
    )


@bp.get("/<slug>")
def get_product(slug):
    p = Product.query.filter_by(slug=slug).first()
    if not p:
        return jsonify(error="Not found"), 404
    related = Product.query.filter(
        Product.category_id == p.category_id, Product.id != p.id, Product.is_active
    ).limit(4).all()
    return jsonify(product=p.to_dict(), related=[r.to_dict() for r in related])


@bp.post("")
@role_required("super_admin", "manager")
def create_product():
    d = request.get_json() or {}
    if not d.get("name"):
        return jsonify(error="Name required"), 400
    cat = Category.query.filter_by(name=d.get("category")).first()
    p = Product(
        name=d["name"], slug=slugify(d["name"]) + "-" + str(db.func.random())[:0] or slugify(d["name"]),
        category_id=cat.id if cat else None, subcategory=d.get("subcategory"),
        description=d.get("description"), specs=d.get("specs", {}),
        price_cents=int(d.get("price_cents", 0)), stock=int(d.get("stock", 0)),
        badge=d.get("badge"), image_url=d.get("image_url"),
    )
    # ensure unique slug
    p.slug = slugify(d["name"])
    if Product.query.filter_by(slug=p.slug).first():
        p.slug = f"{p.slug}-{Product.query.count() + 1}"
    db.session.add(p)
    db.session.commit()
    return jsonify(product=p.to_dict()), 201


@bp.put("/<pid>")
@role_required("super_admin", "manager")
def update_product(pid):
    p = Product.query.get(pid)
    if not p:
        return jsonify(error="Not found"), 404
    d = request.get_json() or {}
    for field in ("name", "description", "subcategory", "badge", "image_url"):
        if field in d:
            setattr(p, field, d[field])
    if "price_cents" in d:
        p.price_cents = int(d["price_cents"])
    if "stock" in d:
        p.stock = int(d["stock"])
    if "specs" in d:
        p.specs = d["specs"]
    db.session.commit()
    return jsonify(product=p.to_dict())


@bp.delete("/<pid>")
@role_required("super_admin", "manager")
def delete_product(pid):
    p = Product.query.get(pid)
    if not p:
        return jsonify(error="Not found"), 404
    db.session.delete(p)
    db.session.commit()
    return jsonify(deleted=pid)
