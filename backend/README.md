# Style Statements — Backend API (Flask)

A runnable Flask + SQLAlchemy API for the Style Statements storefront and admin
dashboard. Uses **SQLite** out of the box (no database server needed) and seeds
itself with the full product catalog on first run.

## Quick start

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # then edit SECRET_KEY / JWT_SECRET_KEY
python run.py
```

API runs at **http://localhost:5000**. On first run it creates
`database/style_statements.db`, builds all tables, and loads the catalog.

### Seeded admin login
```
email:    owner@stylestatements.co.ke
password: changeme123          ← change this after first login
```

## Endpoint reference

### Auth
| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/register` | `{full_name, email, password, phone}` → token |
| POST | `/api/auth/login` | `{email, password}` → token (with role claim) |
| GET  | `/api/auth/me` | current user (auth) |

### Catalog (public)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/products` | `?category=&q=&sort=low\|high\|rating&page=` |
| GET | `/api/products/<slug>` | product + related |
| GET | `/api/categories` | categories with subcategories |

### Shopping (auth)
| Method | Path |
|--------|------|
| GET/POST/DELETE | `/api/cart` , `/api/cart/items` , `/api/cart/items/<id>` |
| POST | `/api/orders/checkout` → creates order, triggers M-Pesa |
| GET  | `/api/orders` (own) |
| GET  | `/api/orders/<order_number>` (track) |
| POST | `/api/reviews` , GET `/api/reviews/product/<id>` |

### Admin (role-gated)
| Method | Path | Roles |
|--------|------|-------|
| POST/PUT/DELETE | `/api/products` | super_admin, manager |
| GET | `/api/analytics/summary` | + staff |
| GET | `/api/customers` | super_admin, manager |
| GET/PATCH | `/api/admin/orders` | staff+ |
| GET/PATCH/DELETE | `/api/admin/reviews` | staff+ (delete = manager+) |

## Notes

- **Money** is stored as integer **cents** (`price_cents`); divide by 100 for KES.
- **Roles:** `super_admin`, `manager`, `staff`, `customer` — enforced by the
  `role_required` decorator in `app/middleware/role_middleware.py`.
- **M-Pesa:** checkout returns a *simulated* payment until you set the `MPESA_*`
  values in `.env`; then it performs a real Daraja STK Push.
- **Postgres:** set `DATABASE_URL` in `.env` to a Postgres URL to switch off SQLite.
- Set a strong `JWT_SECRET_KEY` (32+ chars) in `.env` — the dev default triggers a
  short-key warning.

## Connecting the React frontend

Point the storefront/admin at `http://localhost:5000`. Replace the hardcoded
product arrays with a fetch, e.g.:

```js
const res = await fetch("http://localhost:5000/api/products?category=Perfumes");
const { products } = await res.json();
```
