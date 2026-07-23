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

**Accounts:** customers sign themselves up from the storefront (`/`, account icon).
**There is no admin signup** — Manager and Staff accounts are created *for* them by
a Super Admin (or, for Staff, by a Manager) under **Users & Roles**. Team members
then simply log in with the email and temporary password they were given.

Each person sees only their own role's permissions; there is no role switching.

### Account creation hierarchy

| Role | Can create & manage | Where they sign in |
|------|---------------------|--------------------|
| **Super Admin** | Managers **and** Staff | storefront login → redirected to `/admin` |
| **Manager** | Staff only | storefront login → redirected to `/admin` |
| **Staff** | Nobody | storefront login → redirected to `/admin` |
| **Customer** | — (self-registers) | storefront Sign Up / login → stays on shop |

Everyone uses the **same login**; the account's role decides where they land and
what they can do. Admins manage their team under **Users & Roles** in the
dashboard, where "Add Team Member" only offers the roles that account is allowed
to create. Customers can **never** be created from the admin panel — they must
register themselves on the public Sign Up page.

Deactivating an account immediately blocks that person from logging in.

> Enforcement is server-side: every request re-checks the hierarchy, so a Manager
> cannot create a Manager or Super Admin even by calling the API directly. The
> hidden buttons in the UI are convenience, not the security boundary.
> Rules live in `backend/app/utils/hierarchy.py`.

> **Seeing an old name on the super admin?** The seeder only runs on a brand-new
> database, so a database created by an earlier version can still hold outdated
> details. Fix it in place without losing data:
> ```bash
> cd backend && source .venv/bin/activate
> python fix_admin.py                  # clear the name
> python fix_admin.py --show           # inspect the account
> python fix_admin.py --password new1  # rotate the password
> ```

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
| Admin login (Manager/Staff created by a superior) | **Live** — `/api/auth/login` + `/api/admin/users` |
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

## Responsive & theming

- **Mobile-ready:** both the storefront and admin adapt to phones and tablets —
  the storefront nav collapses to a menu, grids reflow to 1–2 columns, and the
  admin sidebar becomes a slide-over drawer on small screens.
- **Light & dark mode:** dark is the default; tap the sun/moon icon (storefront
  nav, or admin topbar) to switch. The choice is remembered across visits. All
  theme colors live in one `.ss-theme` / `.ss-theme.light` block at the top of
  each page component, so the palette is easy to fine-tune.

## Tech

React 18 · Vite · React Router · Tailwind · lucide-react · recharts ·
Flask · SQLAlchemy · Flask-JWT-Extended · SQLite (Postgres-ready).
