import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage.jsx";
import RegistroPage from "../pages/RegistroPage.jsx";
// import LoginPage from "../pages/LoginPage.jsx";
import RegisterGamePage from "../pages/admin/GamesPage.jsx";
import AppLayout from "../components/layout/AppLayout.jsx";
import AdminLayout from "../components/layout/AdminLayout.jsx";
import AdminHomePage from "../pages/admin/AdminHomePage.jsx";

/**
 * Definicion central de rutas de la aplicacion.
 * Cada nueva pantalla se agrega aca como un <Route> apuntando a su page.
 */
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/registro" element={<RegistroPage />} />
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
        {/* El link "Iniciar sesion" de RegistroPage.jsx ya apunta a "/login".
            Cuando exista pages/LoginPage.jsx, descomentar el import de arriba
            y esta linea, y queda conectado. */}
        {/* <Route path="/login" element={<LoginPage />} /> */}
        <Route path="/admin/games/register" element={<RegisterGamePage />} />

        {/* Área administrativa */}
        <Route path="/app/admin" element={<AdminLayout />}>
          <Route index element={<AdminHomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
