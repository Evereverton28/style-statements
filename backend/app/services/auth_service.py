"""Authentication business logic."""
from app.config.database import db
from app.models.user import User


def create_user(full_name, email, password, phone=None, role="customer"):
    user = User(full_name=full_name, email=email.lower(), phone=phone, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user


def authenticate(email, password):
    user = User.query.filter_by(email=(email or "").lower()).first()
    if user and user.is_active and user.check_password(password):
        return user
    return None
