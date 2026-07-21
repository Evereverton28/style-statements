# Database

**Default:** SQLite at `backend/database/style_statements.db`, created and seeded
automatically on first run (categories, catalog, and a super-admin user).

**Models** (`backend/app/models/`): user, category, product, order (+ order_items),
cart (+ wishlist), review, visitor. Money is stored as integer **cents**.

**Switching to PostgreSQL:** set `DATABASE_URL` in `backend/.env` to a Postgres URL.
A reference Postgres schema (with enums, constraints, and future-scalability tables)
is included as `postgres_schema_reference.sql`.

**Roles:** `super_admin`, `manager`, `staff`, `customer` — enforced by the
`role_required` decorator in `backend/app/middleware/role_middleware.py`.
