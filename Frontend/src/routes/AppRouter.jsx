import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage.jsx";
import RegistroPage from "../pages/RegistroPage.jsx";
// import LoginPage from "../pages/LoginPage.jsx";

/**
 * Definicion central de rutas de la aplicacion.
 * Cada nueva pantalla se agrega aca como un <Route> apuntando a su page.
 */
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/registro" element={<RegistroPage />} />
        {/* El link "Iniciar sesion" de RegistroPage.jsx ya apunta a "/login".
            Cuando exista pages/LoginPage.jsx, descomentar el import de arriba
            y esta linea, y queda conectado. */}
        {/* <Route path="/login" element={<LoginPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
