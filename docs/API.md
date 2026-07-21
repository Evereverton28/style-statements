# API Reference

Base URL: `http://localhost:5000`

## Auth
- `POST /api/auth/register` → `{full_name, email, password, phone?}` → `{token, user}`
- `POST /api/auth/login` → `{email, password}` → `{token, user}` (token carries role claim)
- `GET  /api/auth/me` (auth)

## Catalog (public)
- `GET /api/products?category=&q=&sort=low|high|rating&page=`
- `GET /api/products/<slug>` → `{product, related}`
- `GET /api/categories`

## Shopping (auth)
- `GET/POST/DELETE /api/cart`, `/api/cart/items`, `/api/cart/items/<id>`
- `POST /api/orders/checkout` → creates order, triggers M-Pesa STK push
- `GET  /api/orders` (own), `GET /api/orders/<order_number>` (track)
- `POST /api/reviews`, `GET /api/reviews/product/<id>`

## Admin (role-gated: super_admin / manager / staff)
- `POST/PUT/DELETE /api/products` (super_admin, manager)
- `GET /api/analytics/summary`, `GET /api/analytics/best-sellers`
- `GET /api/customers` (super_admin, manager)
- `GET/PATCH /api/admin/orders`, `/api/admin/orders/<id>`
- `GET/PATCH/DELETE /api/admin/reviews`

Money is returned both as `*_cents` (integer, source of truth) and a decimal `price`/`total` in KES.
