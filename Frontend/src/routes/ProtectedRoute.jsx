import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Envuelve las rutas que requieren sesion iniciada.
// Se usa como ruta "layout" en AppRouter: las hijas se renderizan en <Outlet />.
function ProtectedRoute({ rolesPermitidos }) {
  const { isAuthenticated, loading, user } = useAuth();

  // Mientras AuthContext lee localStorage todavia no sabemos si hay sesion.
  // Sin esta guarda expulsariamos a la landing page a un usuario que SI esta logueado,
  // en cada recarga de pagina.
  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Roles. `rolesPermitidos` son los valores del enum UserRole del backend, en
  // minuscula ("owner" / "admin" / "player"); ver utils/rutas.js.
  //
  // Al jugador lo mandamos a su home en vez de a /login: tiene sesion valida,
  // lo que le falta son permisos. Sacarlo a la pantalla de login daria a
  // entender que su sesion vencio.
  if (rolesPermitidos && !rolesPermitidos.includes(user?.role)) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
