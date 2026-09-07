import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Envuelve las rutas que requieren sesion iniciada.
// Se usa como ruta "layout" en AppRouter: las hijas se renderizan en <Outlet />.
function ProtectedRoute(/* { rolesPermitidos } */) {
  const { isAuthenticated, loading } = useAuth();

  // Mientras AuthContext lee localStorage todavia no sabemos si hay sesion.
  // Sin esta guarda expulsariamos a la landing page a un usuario que SI esta logueado,
  // en cada recarga de pagina.
  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // -------------------------------------------------------------------------
  // ROLES: ya estan dados los pasos de backend. `user.role` llega en /me con
  // uno de los valores del enum UserRole (OWNER / ADMIN / PLAYER), y el backend
  // protege sus endpoints con require_admin / require_owner.
  //
  // Queda sin activar a proposito: todavia no hay forma de crear cuentas admin
  // desde la app, asi que activarlo dejaria el area administrativa inaccesible
  // para todos. Mientras tanto /app/admin solo exige sesion iniciada.
  //
  // Para activarlo cuando existan cuentas admin: descomentar el parametro
  // rolesPermitidos de la firma de arriba y este bloque, y pasar
  // rolesPermitidos={["ADMIN", "OWNER"]} en AppRouter.
  //
  // if (rolesPermitidos && !rolesPermitidos.includes(user?.role)) {
  //   return <Navigate to="/app" replace />;
  // }
  // -------------------------------------------------------------------------

  return <Outlet />;
}

export default ProtectedRoute;
