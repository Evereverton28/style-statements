# Style Statements — Frontend (React + Vite)

The customer storefront and admin dashboard for Style Statements, built with
React, Vite, React Router, Tailwind, lucide-react, and recharts.

## Quick start

```bash
cd frontend
npm install
npm run dev
```

Open the printed URL (default **http://localhost:5173**).

- `/`       → customer storefront
- `/admin`  → admin dashboard

## Connecting to the backend

The storefront loads its catalog from the backend API. Set the API URL in `.env`:

```
VITE_API_URL=http://localhost:5000
```

Start the backend first (`cd ../backend && python run.py`), then the storefront
will fetch live products from `/api/products`. **If the backend isn't running,
the storefront still renders** using a built-in seed catalog (see
`SEED_PRODUCTS` in `src/pages/customer/StorefrontApp.jsx`) — so you can develop
the UI standalone.

## Structure

```
src/
├── main.jsx  App.jsx
├── routes/AppRoutes.jsx        # React Router: / (store) and /admin
├── services/                   # API layer
│   ├── api.js                  # fetch wrapper + JWT injection
│   ├── productService.js       # list/detail + API→UI mapping
│   ├── authService.js  orderService.js
├── context/                    # AuthContext, CartContext
├── hooks/useProducts.js        # live catalog with offline fallback
├── pages/
│   ├── customer/StorefrontApp.jsx   # full storefront (fetches products)
│   └── admin/AdminApp.jsx           # full admin dashboard
└── styles/globals.css
```

## Notes & next steps

- **What's live:** the storefront's catalog is wired to the backend via
  `useProducts`. Auth, cart, and order services are implemented and ready to call.
- **Admin data:** the admin dashboard currently runs on in-memory demo data. The
  `orderService.analyticsSummary()` / `allOrders()` / `updateStatus()` calls are
  ready — wire them into the dashboard views the same way `useProducts` wires the
  storefront.
- **Router:** top-level routes select storefront vs admin; each app handles its own
  internal navigation with state. Splitting those into dedicated routes
  (`/shop`, `/product/:slug`, `/admin/orders`, …) is the natural next refactor.
- **Bundle size:** recharts makes the admin bundle large; code-split `/admin`
  with `React.lazy` + dynamic import when you optimize.
```
