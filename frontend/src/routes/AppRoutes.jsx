import { Routes, Route } from "react-router-dom";
import StorefrontApp from "../pages/customer/StorefrontApp.jsx";
import AdminApp from "../pages/admin/AdminApp.jsx";

// The storefront and admin each manage their own internal navigation (state-based
// views / sidebar). Top-level routing selects which experience to show. Splitting
// the internal views into dedicated /shop, /product/:slug, /admin/orders routes is
// the natural next refactor — the page components already exist to slot in.
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/*" element={<StorefrontApp />} />
    </Routes>
  );
}
