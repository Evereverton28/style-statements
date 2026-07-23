"""Fix the super-admin account on an EXISTING database.

The seeder only runs on a brand-new database, so if your database was created
by an older version it may still hold an outdated name. This script updates the
account in place — your products, orders, and customers are untouched.

Usage (from the backend/ folder, with your venv active):

    python fix_admin.py                       # clear the name (no personal name)
    python fix_admin.py --name "Shine"        # set a display name
    python fix_admin.py --password newpass1   # reset the password
    python fix_admin.py --email me@shop.co.ke # change the login email
    python fix_admin.py --show                # just show the current account
"""
import argparse
from app.app import create_app
from app.config.database import db
from app.models.user import User


def main():
    ap = argparse.ArgumentParser(description="Fix the super-admin account.")
    ap.add_argument("--name", default=None, help='Display name (use "" for none)')
    ap.add_argument("--email", default=None, help="New login email")
    ap.add_argument("--password", default=None, help="New password (min 6 chars)")
    ap.add_argument("--show", action="store_true", help="Show current account only")
    args = ap.parse_args()

    app = create_app()
    with app.app_context():
        admin = User.query.filter_by(role="super_admin").first()
        if not admin:
            print("No super-admin account found in this database.")
            return

        if args.show:
            print(f"name:  {admin.full_name!r}\nemail: {admin.email}\nrole:  {admin.role}")
            return

        # Default action: clear the name entirely.
        admin.full_name = args.name if args.name is not None else ""

        if args.email:
            admin.email = args.email.lower()
        if args.password:
            if len(args.password) < 6:
                print("Password must be at least 6 characters.")
                return
            admin.set_password(args.password)

        db.session.commit()
        shown = admin.full_name or "(no name — the dashboard will show 'Super Admin')"
        print("Super-admin account updated.")
        print(f"  name:  {shown}")
        print(f"  email: {admin.email}")


if __name__ == "__main__":
    main()
