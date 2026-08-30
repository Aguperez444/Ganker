import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage.jsx";
import RegisterGamePage from "../pages/admin/RegisterGamePage.jsx";

/**
 * Definicion central de rutas de la aplicacion.
 * Cada nueva pantalla se agrega aca como un <Route> apuntando a su page.
 */
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/games/register" element={<RegisterGamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
