import AuthTabs from "./AuthTabs";

// Envuelve las pantallas de autenticacion (registro, y login cuando exista).
// El panel izquierdo (logo + eslogan + juegos) y el selector de pestañas
// quedan acá una sola vez; cada page solo aporta su propio formulario.
function AuthLayout({ children }) {
  return (
    <main className="grid min-h-screen bg-primary lg:grid-cols-2">
      <section className="flex flex-col items-center justify-center px-8 py-12">
        <img
          src="/images/Logo_y_letras_blanco_con_subtitulo_y_juegos_blanco.svg"
          alt="Ganker — Encuentra. Conecta. Compite."
          className="w-full max-w-lg"
        />
      </section>

      <section className="flex flex-col justify-center px-8 py-12">
        <div className="mx-auto w-full max-w-xl">
          <AuthTabs />
          {children}
        </div>
      </section>
    </main>
  );
}

export default AuthLayout;
