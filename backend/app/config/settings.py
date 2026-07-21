"""Application configuration, read from environment (.env)."""
import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

    # Invite code required to self-register an admin/staff account.
    # Change this in .env; if blank, admin signup is disabled entirely.
    ADMIN_SIGNUP_CODE = os.getenv("ADMIN_SIGNUP_CODE", "SS-ADMIN-SETUP")

    # Load the sample Style Statements catalog on first run? Off = empty store.
    SEED_SAMPLE_DATA = os.getenv("SEED_SAMPLE_DATA", "false").lower() == "true"

    # SQLite by default (matches the project tree: database/style_statements.db)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///" + os.path.join(BASE_DIR, "database", "style_statements.db"),
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads", "product_images")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

    # M-Pesa (Daraja) — placeholders, wire real values in .env when ready
    MPESA_CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY", "")
    MPESA_CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET", "")
    MPESA_SHORTCODE = os.getenv("MPESA_SHORTCODE", "")
    MPESA_PASSKEY = os.getenv("MPESA_PASSKEY", "")
    MPESA_CALLBACK_URL = os.getenv("MPESA_CALLBACK_URL", "")


class ProductionConfig(Config):
    DEBUG = False


class DevelopmentConfig(Config):
    DEBUG = True


config_map = {"production": ProductionConfig, "development": DevelopmentConfig}


def get_config():
    return config_map.get(os.getenv("FLASK_ENV", "development"), DevelopmentConfig)
