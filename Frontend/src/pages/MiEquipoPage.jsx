import { Link, useLocation } from "react-router-dom";
import AvisoComponent from "../components/common/AvisoComponent";
import FichaEquipoComponent from "../components/equipos/FichaEquipoComponent";
import IntegrantesEquipoComponent from "../components/equipos/IntegrantesEquipoComponent";
import useMiEquipo from "../hooks/useMiEquipo";

// US 14 - Crear equipo: vista del equipo a la que se redirige al crearlo.
const MiEquipoPage = () => {
  const location = useLocation();
  const mensajeExito = location.state?.mensajeExito;
  const { equipo, cargando, error } = useMiEquipo();

  let contenido;

  if (cargando) {
    contenido = <p className="text-sm text-ganker-muted">Cargando...</p>;
  } else if (error) {
    contenido = <p className="text-sm text-ganker-error">{error}</p>;
  } else if (!equipo) {
    contenido = (
      <AvisoComponent
        titulo="Todavía no estás en ningún equipo"
        accion={
          <Link
            to="/app/equipos/crear"
            className="inline-block rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Crear equipo
          </Link>
        }
      />
    );
  } else {
    contenido = (
      <div className="space-y-6">
        <FichaEquipoComponent equipo={equipo} />

        <div className="rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
          <h2 className="mb-4 font-heading text-lg font-semibold text-ganker-text">
            Integrantes
          </h2>
          <IntegrantesEquipoComponent integrantes={equipo.members} />
        </div>

        {/* El chat grupal (abrir la sala, enviar y ver mensajes) es de las
            US 43 y 44; esta tarjeta es su punto de entrada. */}
        {equipo.conversation_id && (
          <div className="rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
            <h2 className="font-heading text-lg font-semibold text-ganker-text">
              Chat del equipo
            </h2>
            <p className="mt-1 text-sm text-ganker-muted">
              La sala de chat se creó junto con el equipo. Los jugadores que se
              sumen entran automáticamente.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="min-h-full bg-ganker-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-ganker-text sm:text-4xl">
            Mi equipo
          </h1>
        </header>

        {mensajeExito && (
          <div
            role="status"
            className="mb-6 rounded-lg border border-ganker-success/20 bg-ganker-success/10 px-4 py-3"
          >
            <p className="text-sm text-ganker-success">✓ {mensajeExito}</p>
          </div>
        )}

        {contenido}
      </div>
    </section>
  );
};

export default MiEquipoPage;
