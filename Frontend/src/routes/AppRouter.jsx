import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "../pages/LandingPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import RouteMetadata from "../components/common/RouteMetadata.jsx";
import HomePage from "../pages/HomePage.jsx";
import RegistroPage from "../pages/RegistroPage.jsx";
import ConfirmarRegistroPage from "../pages/ConfirmarRegistroPage.jsx";
import CuentaPage from "../pages/CuentaPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import CallbackFederadoPage from "../pages/CallbackFederadoPage.jsx";
import CompletarRegistroFederadoPage from "../pages/CompletarRegistroFederadoPage.jsx";
import AppLayout from "../components/layout/AppLayout.jsx";
import AdminLayout from "../components/layout/AdminLayout.jsx";
import AdminHomePage from "../pages/admin/AdminHomePage.jsx";
import GamesPage from "../pages/admin/GamesPage.jsx";
import RanksPage from "../pages/admin/RanksPage.jsx";
import RolesPage from "../pages/admin/RolesPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import PublicOnlyRoute from "./PublicOnlyRoute.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import BuscarJugadoresPage from "../pages/BuscarJugadoresPage.jsx";
import JugadorPerfilPage from "../pages/JugadorPerfilPage.jsx";
import DiscordCallbackPage from "../pages/DiscordCallbackPage.jsx";
import EquiposPage from "../pages/EquiposPage.jsx";
import CrearEquipoPage from "../pages/CrearEquipoPage.jsx";
import MiEquipoPage from "../pages/MiEquipoPage.jsx";
import EquipoPage from "../pages/EquipoPage.jsx";
import CharactersPage from "../pages/admin/CharactersPage.jsx";
import ModeracionPage from "../pages/admin/ModeracionPage.jsx";
import RegionsPage from "../pages/admin/RegionsPage.jsx";
import RecuperarContrasenaPage from "../pages/RecuperarContrasenaPage.jsx";
import RestablecerContrasenaPage from "../pages/RestablecerContrasenaPage.jsx";
import ReportesPage from "../pages/admin/ReportesPage.jsx";
import ReporteUsoPage from "../pages/admin/ReporteUsoPage.jsx";
import UsuariosPage from "../pages/admin/UsuariosPage.jsx";
import { ROLES_ADMIN } from "../utils/rutas.js";

/**
 * Definicion central de rutas de la aplicacion.
 * Cada nueva pantalla se agrega aca como un <Route> apuntando a su page.
 */
function AppRouter() {
  return (
    <BrowserRouter>
      <RouteMetadata />
      <Routes>
        {/* Landing: accesible siempre, con o sin sesion iniciada */}
        <Route path="/" element={<LandingPage />} />

        {/* US 34 - Cambiar contraseña. Accesibles con o sin sesion: se entra
            desde el login o desde Mi cuenta, y el link del mail
            ({FRONTEND_URL}/reset-password?token=...) lo arma el backend. */}
        <Route
          path="/recuperar-contrasena"
          element={<RecuperarContrasenaPage />}
        />
        <Route path="/reset-password" element={<RestablecerContrasenaPage />} />
        <Route
          path="/confirm-registration"
          element={<ConfirmarRegistroPage />}
        />

        {/* Solo accesibles SIN sesion: si ya esta logueado, se lo manda a /app */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/auth/callback/:provider"
            element={<CallbackFederadoPage />}
          />
          <Route
            path="/completar-registro"
            element={<CompletarRegistroFederadoPage />}
          />
        </Route>

        {/* Privadas: requieren sesion iniciada */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="perfil" element={<ProfilePage />} />
            {/* US 02 - Modificar mis datos. Es el boton "Cuenta" del sidebar. */}
            <Route path="cuenta" element={<CuentaPage />} />
            {/* Vuelta de "Conectar con Discord" (redirect cargado en el
                Discord Developer Portal). */}
            <Route path="discord/callback" element={<DiscordCallbackPage />} />
            {/* Páginas placeholder para funcionalidades en próximos sprints */}
            <Route path="jugadores" element={<BuscarJugadoresPage />} />
            {/* Perfil de otro jugador con todos sus perfiles de juego. Se
                entra desde Buscar jugadores, el chat o un equipo. */}
            <Route
              path="jugadores/:jugadorId"
              element={<JugadorPerfilPage />}
            />
            <Route
              path="buscar"
              element={<Navigate to="/app/jugadores" replace />}
            />
            <Route path="equipos" element={<EquiposPage />} />
            {/* US 14 - Crear equipo, y la vista a la que redirige al crearlo. */}
            <Route path="equipos/crear" element={<CrearEquipoPage />} />
            <Route path="equipos/mi-equipo" element={<MiEquipoPage />} />
            {/* US 18 - Unirse a equipo. React Router prioriza las rutas fijas
                de arriba ("crear", "mi-equipo") sobre este parametro. */}
            <Route path="equipos/:equipoId" element={<EquipoPage />} />
          </Route>
        </Route>

        {/*
          Area administrativa. Solo admin y owner: un jugador que fuerce la URL
          vuelve a su home. El backend ademas protege sus endpoints con
          require_admin, asi que esto es la mitad de la defensa, no toda.

          Los admin no quedan encerrados aca: pueden usar /app como cualquier
          jugador y volver al panel desde el menu del avatar.
        */}
        <Route element={<ProtectedRoute rolesPermitidos={ROLES_ADMIN} />}>
          <Route path="/app/admin" element={<AdminLayout />}>
            <Route index element={<AdminHomePage />} />
            <Route path="games" element={<GamesPage />} />
            <Route path="ranks" element={<RanksPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="regions" element={<RegionsPage />} />
            {/* US 37 - Reporte de jugadores por videojuego. */}
            <Route path="reportes" element={<ReportesPage />} />
            {/* US 38 - Reporte de uso (rangos, personajes, equipos). */}
            <Route path="reportes/uso" element={<ReporteUsoPage />} />
            {/* US 50 - Eliminar cuenta de usuario. */}
            <Route path="usuarios" element={<UsuariosPage />} />
            {/* Módulos administrativos placeholder */}
            <Route path="characters" element={<CharactersPage />} />
            <Route
              path="personajes"
              element={<Navigate to="/app/admin/characters" replace />}
            />
            <Route path="moderacion" element={<ModeracionPage />} />
          </Route>
        </Route>

        {/* Conserva la URL para identificar el recurso que no existe. */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
