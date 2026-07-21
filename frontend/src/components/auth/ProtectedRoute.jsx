// ProtectedRoute — guards admin routes by role.
// Usage: <Route element={<ProtectedRoute roles={["super_admin","manager"]} />}> ... </Route>
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ProtectedRoute({ roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/account/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
