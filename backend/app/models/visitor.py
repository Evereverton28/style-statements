"""Lightweight visit events for analytics (traffic source, path)."""
from datetime import datetime
from app.config.database import db


class VisitEvent(db.Model):
    __tablename__ = "visit_events"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    session_id = db.Column(db.String(64))
    path = db.Column(db.String(255))
    referrer = db.Column(db.String(255))
    occurred_at = db.Column(db.DateTime, default=datetime.utcnow)
