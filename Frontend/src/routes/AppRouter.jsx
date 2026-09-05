import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "../pages/LandingPage.jsx";
import HomePage from "../pages/HomePage.jsx";
import RegistroPage from "../pages/RegistroPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import AppLayout from "../components/layout/AppLayout.jsx";
import AdminLayout from "../components/layout/AdminLayout.jsx";
import AdminHomePage from "../pages/admin/AdminHomePage.jsx";
import GamesPage from "../pages/admin/GamesPage.jsx";

/**
 * Definicion central de rutas de la aplicacion.
 * Cada nueva pantalla se agrega aca como un <Route> apuntando a su page.
 */
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/registro" element={<RegistroPage />} />
        <Route path="/login" element={<LoginPage />} />

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

        {/* Área administrativa */}
        <Route path="/app/admin" element={<AdminLayout />}>
          <Route index element={<AdminHomePage />} />
          <Route path="games" element={<GamesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
