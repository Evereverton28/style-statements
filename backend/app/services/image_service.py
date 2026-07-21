"""Product image uploads — saves to uploads/product_images and returns a URL path.
For production, swap for Cloudinary / Firebase Storage and store the returned URL."""
import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

ALLOWED = {"png", "jpg", "jpeg", "webp"}


def save_image(file_storage):
    name = secure_filename(file_storage.filename or "")
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext not in ALLOWED:
        return None
    fname = f"{uuid.uuid4().hex}.{ext}"
    folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(folder, exist_ok=True)
    file_storage.save(os.path.join(folder, fname))
    return f"/uploads/product_images/{fname}"
