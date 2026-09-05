import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Espejo de ProtectedRoute: envuelve las rutas que solo tienen sentido SIN
// sesion iniciada (landing, login, registro). Si el usuario ya esta logueado
// lo mandamos al dashboard en vez de mostrarle un formulario que no necesita.
function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();

  // Misma guarda que en ProtectedRoute: mientras AuthContext lee localStorage
  // todavia no sabemos si hay sesion. Sin esto, un usuario logueado veria la
  // landing por un instante antes de que lo redirijan (parpadeo feo).
  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;