import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "../pages/LandingPage.jsx";
import HomePage from "../pages/HomePage.jsx";
import RegistroPage from "../pages/RegistroPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterGamePage from "../pages/admin/GamesPage.jsx";
import AppLayout from "../components/layout/AppLayout.jsx";
import AdminLayout from "../components/layout/AdminLayout.jsx";
import AdminHomePage from "../pages/admin/AdminHomePage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import PublicOnlyRoute from "./PublicOnlyRoute.jsx";

/**
 * Definicion central de rutas de la aplicacion.
 * Cada nueva pantalla se agrega aca como un <Route> apuntando a su page.
 */
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Solo accesibles SIN sesion: si ya esta logueado, se lo manda a /app */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Privadas: requieren sesion iniciada */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<HomePage />} />
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
          Area administrativa.

          Por ahora exige solamente sesion iniciada, igual que el resto: el
          backend no distingue admin de jugador (role = "player" hardcodeado),
          asi que no hay nada real contra que validar todavia.

          Cuando existan roles, cambiar la linea de abajo por:
            <Route element={<ProtectedRoute rolesPermitidos={["admin"]} />}>
        */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app/admin" element={<AdminLayout />}>
            <Route index element={<AdminHomePage />} />
          </Route>
          <Route path="/admin/games/register" element={<RegisterGamePage />} />
        </Route>

        {/* Cualquier URL desconocida vuelve al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;