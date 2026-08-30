import { Link } from "react-router-dom";
import JugadorForm from "../components/jugadores/JugadorForm";
import { useRegistrarJugador } from "../hooks/useRegistrarJugador";

function RegistroPage() {
  const { valores, errores, cargando, errorServidor, handleChange, handleBlur, handleSubmit } =
    useRegistrarJugador();

  async function onSubmit(e) {
    const tokens = await handleSubmit(e);
    if (tokens) {
      // TODO: cuando exista la sesión global en context/, guardar los tokens
      // acá y redirigir con useNavigate("/").
    }
  }

  return (
    <main className="grid min-h-screen bg-primary lg:grid-cols-2">
      <section className="flex flex-col items-center justify-center gap-6 px-8 py-12 text-center">
        <img
            src="/images/logo-ganker.png"
            alt="Ganker — Encuentra. Conecta. Compite."
            className="w-full max-w-sm"
        />
        <p className="text-sm text-text-secondary font-body">
            ¿Ya tenés cuenta?{" "}
            <Link to="/login" className="text-orange-400 hover:underline">
            {/* text-orange-400: sin token de acento en @theme todavia */}
            Iniciar sesión
            </Link>
        </p>
      </section>

      <section className="flex flex-col justify-center px-8 py-12">
        <div className="mx-auto w-full max-w-xl">
          <h2 className="text-2xl font-bold text-text-primary font-heading">Registrar jugador</h2>
          <p className="mb-6 mt-1 text-sm text-text-secondary font-body">Creá tu cuenta y unite a la comunidad</p>
          <JugadorForm
            valores={valores}
            errores={errores}
            cargando={cargando}
            errorServidor={errorServidor}
            onChange={handleChange}
            onBlur={handleBlur}
            onSubmit={onSubmit}
          />
        </div>
      </section>
    </main>
  );
}

export default RegistroPage;