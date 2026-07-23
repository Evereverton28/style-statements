"""Application factory."""
import os
from flask import Flask, jsonify, send_from_directory
from app.config.settings import get_config
from app.config.database import db, jwt, cors


def create_app():
    app = Flask(__name__)
    app.config.from_object(get_config())

    # extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    # blueprints
    from app.routes.auth_routes import bp as auth_bp
    from app.routes.product_routes import bp as product_bp
    from app.routes.category_routes import bp as category_bp
    from app.routes.cart_routes import bp as cart_bp
    from app.routes.order_routes import bp as order_bp
    from app.routes.review_routes import bp as review_bp
    from app.routes.customer_routes import bp as customer_bp
    from app.routes.analytics_routes import bp as analytics_bp
    from app.routes.admin_routes import bp as admin_bp
    from app.routes.user_routes import bp as team_bp

    for bp in (auth_bp, product_bp, category_bp, cart_bp, order_bp,
               review_bp, customer_bp, analytics_bp, admin_bp, team_bp):
        app.register_blueprint(bp)

    @app.get("/")
    def health():
        return jsonify(name="Style Statements API", status="ok", version="1.0")

    @app.get("/uploads/product_images/<path:filename>")
    def uploaded(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # create tables + seed on first run
    with app.app_context():
        os.makedirs(os.path.dirname(app.config["SQLALCHEMY_DATABASE_URI"].replace("sqlite:///", "")), exist_ok=True)
        db.create_all()
        from app.seeds import seed_if_empty
        seed_if_empty()

    return app
