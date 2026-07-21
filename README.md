# Style Statements — Full-Stack E-Commerce Platform

Luxury fashion-accessories store for **Style Statements** (Nairobi, Kenya) —
*Your Style, Our Statement.* A React storefront + admin dashboard on a Flask API.

```
style-statements/
├── frontend/   React + Vite (customer storefront + admin dashboard)
├── backend/    Flask + SQLAlchemy API (SQLite by default, seeded)
└── docs/       API, database, and user-guide references
```

## Run it (two terminals)

**1 — Backend** (http://localhost:5000)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

**2 — Frontend** (http://localhost:5173)
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** for the storefront and **/admin** for the dashboard.

### Admin login (seeded)
```
owner@stylestatements.co.ke  /  changeme123     ← change after first login
```

**Accounts:** customers can sign up freely from the storefront (`/`, account icon).
Admin/staff accounts require an **invite code** to sign up — set `ADMIN_SIGNUP_CODE`
in `backend/.env` (default `SS-ADMIN-SETUP`). Enter it on the `/admin` signup form
to create a Manager/Staff/Super Admin account. Leave the code blank to disable
admin self-signup entirely.

**The store starts empty** — 0 products, 0 orders, 0 customers, 0 reviews, and all
dashboard metrics at zero. Only your admin login and the category structure
(Jewelry / Sunglasses / Perfumes) are created. Add real products from the admin
**Products → Add Product** screen; customers, orders, reviews, and revenue then
populate on their own as the store is used. To load the sample demo catalog
instead, set `SEED_SAMPLE_DATA=true` in `backend/.env` before first run (or delete
`backend/database/style_statements.db` and restart to re-seed).

## What's wired to the backend

| Area | Status |
|------|--------|
| Storefront catalog (list, filter, sort, detail) | **Live** — fetched from `/api/products` |
| Customer signup + login (storefront account) | **Live** — `/api/auth/register` + `/api/auth/login` |
| Admin login + signup (invite-code gated) | **Live** — `/api/auth/login` + `/api/auth/admin-register` |
| Admin dashboard KPIs (revenue, orders, customers, AOV) | **Live** — `/api/analytics/summary` |
| Admin products (list, add, edit, delete) | **Live** — `/api/products` CRUD |
| Admin orders (list + status pipeline) | **Live** — `/api/admin/orders` |
| Admin review moderation (approve/reject/delete) | **Live** — `/api/admin/reviews` |
| Cart / wishlist / checkout (order + M-Pesa trigger) | **Live** (M-Pesa simulates until credentials set) |
| Role-based access | **Live & enforced server-side** |

Both apps degrade gracefully: if the API is offline, the storefront and admin
render from built-in demo data and the admin shows an "offline" badge.

## Not yet built (clear next steps)

- Real M-Pesa credentials (Daraja), transactional email, cloud image hosting —
  all scaffolded, need live keys / providers.
- Per-route pages (`/shop`, `/product/:slug`, `/admin/orders`) — currently each
  app uses internal state-based navigation under top-level routes.
- Admin coupons / messages / customers / content / settings screens read/write —
  UI exists; a few endpoints remain to be added.

See `docs/` for the API reference, database notes, and a short user guide.

## Tech

React 18 · Vite · React Router · Tailwind · lucide-react · recharts ·
Flask · SQLAlchemy · Flask-JWT-Extended · SQLite (Postgres-ready).
# style-statements
