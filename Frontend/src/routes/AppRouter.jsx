import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "../pages/LandingPage.jsx";
import HomePage from "../pages/HomePage.jsx";
import RegistroPage from "../pages/RegistroPage.jsx";
import CuentaPage from "../pages/CuentaPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import AppLayout from "../components/layout/AppLayout.jsx";
import AdminLayout from "../components/layout/AdminLayout.jsx";
import AdminHomePage from "../pages/admin/AdminHomePage.jsx";
import GamesPage from "../pages/admin/GamesPage.jsx";
import RanksPage from "../pages/admin/RanksPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import PublicOnlyRoute from "./PublicOnlyRoute.jsx";
import { ROLES_ADMIN } from "../utils/rutas.js";

/**
 * Definicion central de rutas de la aplicacion.
 * Cada nueva pantalla se agrega aca como un <Route> apuntando a su page.
 */
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing: accesible siempre, con o sin sesion iniciada */}
        <Route path="/" element={<LandingPage />} />

        {/* Solo accesibles SIN sesion: si ya esta logueado, se lo manda a /app */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Privadas: requieren sesion iniciada */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            {/* US 02 - Modificar mis datos. Es el boton "Cuenta" del sidebar. */}
            <Route path="cuenta" element={<CuentaPage />} />
            {/*
              Las próximas User Stories se incorporarán acá.

              Ejemplo:

              <Route
                path="jugadores"
                element={<BuscarJugadoresPage />}
              />
              */}
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
          </Route>
        </Route>

        {/* Cualquier URL desconocida vuelve al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
