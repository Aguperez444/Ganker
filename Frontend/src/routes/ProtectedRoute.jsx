import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Envuelve las rutas que requieren sesion iniciada.
// Se usa como ruta "layout" en AppRouter: las hijas se renderizan en <Outlet />.
function ProtectedRoute(/* { rolesPermitidos } */) {
  const { isAuthenticated, loading /*, user */ } = useAuth();
  const location = useLocation();

  // Mientras AuthContext lee localStorage todavia no sabemos si hay sesion.
  // Sin esta guarda expulsariamos a /login a un usuario que SI esta logueado,
  // en cada recarga de pagina.
  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    // "from" guarda a donde queria entrar, para poder devolverlo ahi despues
    // de que se loguee (leerlo en LoginPage con useLocation().state?.from).
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // -------------------------------------------------------------------------
  // ROLES: descomentar cuando el backend emita roles reales.
  //
  // Hoy NO se puede usar: el backend hardcodea role = "player" tanto en
  // register_player.py como en user_login.py, y no existe el concepto de admin
  // en ningun lado. Ademas AuthContext solo guarda { email }, sin el rol.
  //
  // Pasos necesarios, en orden:
  //   1. Backend: agregar un campo de rol real al jugador y emitirlo en el JWT
  //      (generate_tokens ya recibe el rol y lo mete en el payload).
  //   2. Backend: crear una dependencia get_current_admin, analoga a
  //      get_current_player_id, para los endpoints administrativos.
  //   3. Frontend: guardar user.role en AuthContext al iniciar sesion
  //      (el rol ya viaja dentro del JWT, se puede decodificar).
  //   4. Descomentar el parametro rolesPermitidos de arriba y este bloque,
  //      y pasar rolesPermitidos={["admin"]} en AppRouter.
  //
  // if (rolesPermitidos && !rolesPermitidos.includes(user?.role)) {
  //   return <Navigate to="/app" replace />;
  // }
  // -------------------------------------------------------------------------

  return <Outlet />;
}

export default ProtectedRoute;