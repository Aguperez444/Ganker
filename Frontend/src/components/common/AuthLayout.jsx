import { Link } from "react-router-dom";
import AuthTabs from "./AuthTabs";
import Footer from "./Footer";

// Envuelve las pantallas de autenticacion (registro, y login cuando exista).
// El panel izquierdo (logo + eslogan + juegos) y el selector de pestañas
// quedan acá una sola vez; cada page solo aporta su propio formulario.
function AuthLayout({ children }) {
  return (
    <main className="grid min-h-screen grid-rows-[1fr_auto] bg-ganker-bg">
      <div className="grid lg:grid-cols-2">
        <section className="flex flex-col items-center justify-center px-8 py-12">
          {/* El logo lleva de vuelta a la landing. */}
          <Link
            to="/"
            aria-label="Volver al inicio"
            className="w-full max-w-lg rounded-lg transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ganker-purple-light"
          >
            <img
              src="/images/Logo_y_letras_blanco_con_subtitulo_y_juegos_blanco.svg"
              alt="Ganker — Encuentra. Conecta. Compite."
              className="w-full"
            />
          </Link>
        </section>

        <section className="flex flex-col justify-center px-8 py-12">
          <div className="mx-auto w-full max-w-xl">
            <AuthTabs />
            {children}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}

export default AuthLayout;
