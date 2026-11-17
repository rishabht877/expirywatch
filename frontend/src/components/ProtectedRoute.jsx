import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Renders the nested route only for logged in users; everyone else goes to /login.
function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p role="status">Checking your session…</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

ProtectedRoute.propTypes = {};

export default ProtectedRoute;
