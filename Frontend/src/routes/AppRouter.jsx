import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../components/common/RegisterPage.jsx";

/**
 * Definicion central de rutas de la aplicacion.
 * Cada nueva pantalla se agrega aca como un <Route> apuntando a su page.
 */
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
