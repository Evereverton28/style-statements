"""General helpers."""
import re
import random
from datetime import datetime


def slugify(text):
    text = (text or "").lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def new_order_number():
    """e.g. SS-1042 — random-ish but readable."""
    return "SS-" + str(random.randint(1000, 9999))


def paginate(query, page, per_page=12):
    page = max(1, int(page or 1))
    items = query.limit(per_page).offset((page - 1) * per_page).all()
    total = query.count()
    return {
        "items": items,
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": (total + per_page - 1) // per_page,
    }
