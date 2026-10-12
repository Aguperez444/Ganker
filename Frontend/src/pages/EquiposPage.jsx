import { Link, useNavigate } from "react-router-dom";
import FiltrosEquiposComponent from "../components/equipos/FiltrosEquiposComponent";
import ModalUnirseEquipoComponent from "../components/equipos/ModalUnirseEquipoComponent";
import TarjetaEquipoComponent from "../components/equipos/TarjetaEquipoComponent";
import useBuscarEquipos from "../hooks/useBuscarEquipos";
import useMiEquipo from "../hooks/useMiEquipo";
import useUnirseEquipo from "../hooks/useUnirseEquipo";

const CLASES_BOTON_PRINCIPAL =
  "inline-block w-full shrink-0 rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto";

const CLASES_BOTON_PAGINA =
  "rounded-xl border border-white/10 bg-ganker-surface px-4 py-2 text-sm font-semibold text-ganker-text transition hover:border-ganker-purple/40 disabled:cursor-not-allowed disabled:opacity-40";

function MensajeResultados({ children, error = false }) {
  return (
    <div
      className={`rounded-2xl border p-10 text-center ${
        error
          ? "border-ganker-error/20 bg-ganker-error/10"
          : "border-white/10 bg-ganker-surface"
      }`}
    >
      <p
        className={`text-sm ${error ? "text-ganker-error" : "text-ganker-muted"}`}
      >
        {children}
      </p>
    </div>
  );
}

// Entrada a la seccion Equipos. Ofrece crear un equipo (US 14) o ir al
// propio si el jugador ya esta en uno, y buscar equipos con vacantes
// (US 17) para unirse desde cada tarjeta (US 18).
const EquiposPage = () => {
  const navigate = useNavigate();
  const { equipo, cargando, error } = useMiEquipo();
  const busqueda = useBuscarEquipos();
  const union = useUnirseEquipo({
    alActualizarEquipo: busqueda.actualizarEquipo,
  });

  const handleConfirmarUnion = async (vacanteId) => {
    const resultado = await union.unirse(vacanteId);
    if (!resultado) return;

    navigate("/app/equipos/mi-equipo", {
      state: { mensajeExito: resultado.message },
    });
  };

  let resultados;
  if (!busqueda.videojuegoId) {
    resultados = (
      <MensajeResultados>
        Seleccioná un videojuego para empezar a buscar equipos.
      </MensajeResultados>
    );
  } else if (busqueda.cargandoCatalogos || busqueda.errorCatalogos) {
    // Los filtros ya muestran que se estan cargando o el error.
    resultados = null;
  } else if (busqueda.cargandoEquipos) {
    resultados = <MensajeResultados>Buscando equipos...</MensajeResultados>;
  } else if (busqueda.errorEquipos) {
    resultados = (
      <MensajeResultados error>{busqueda.errorEquipos}</MensajeResultados>
    );
  } else if (busqueda.equipos.length === 0) {
    resultados = (
      <MensajeResultados>
        {busqueda.pagina > 1
          ? "No hay más equipos para mostrar."
          : "No se encontraron equipos con esos filtros. Probá cambiándolos o limpiándolos."}
      </MensajeResultados>
    );
  } else {
    resultados = (
      <div className="grid gap-4 md:grid-cols-2">
        {busqueda.equipos.map((equipoEncontrado) => (
          <TarjetaEquipoComponent
            key={equipoEncontrado.team_id}
            equipo={equipoEncontrado}
            onUnirse={union.abrir}
          />
        ))}
      </div>
    );
  }

  const mostrarPaginacion =
    busqueda.videojuegoId &&
    !busqueda.cargandoEquipos &&
    !busqueda.errorEquipos &&
    (busqueda.hayPaginaAnterior || busqueda.hayPaginaSiguiente);

  return (
    <section className="min-h-full bg-ganker-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header>
          <h1 className="font-heading text-3xl font-bold text-ganker-text sm:text-4xl">
            Equipos
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ganker-muted sm:text-base">
            Creá tu equipo o buscá uno con vacantes afín a tu rango y tus roles.
          </p>
        </header>

        <div className="rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
          {cargando ? (
            <p className="text-sm text-ganker-muted">Cargando...</p>
          ) : error ? (
            // Sin saber si ya tiene equipo no ofrecemos crear uno.
            <p className="text-sm text-ganker-error">{error}</p>
          ) : equipo ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-xl font-semibold text-ganker-text">
                  {equipo.team_name}
                </h2>
                <p className="mt-1 text-sm text-ganker-muted">
                  {equipo.videogame?.name} · {equipo.player_count}/
                  {equipo.max_players} jugadores
                </p>
              </div>
              <Link
                to="/app/equipos/mi-equipo"
                className={CLASES_BOTON_PRINCIPAL}
              >
                Ver mi equipo
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-xl font-semibold text-ganker-text">
                  Todavía no tenés equipo
                </h2>
                <p className="mt-1 text-sm text-ganker-muted">
                  Armá una sala y elegí qué roles y rangos buscás, o sumate a
                  uno de los equipos de abajo.
                </p>
              </div>
              <Link to="/app/equipos/crear" className={CLASES_BOTON_PRINCIPAL}>
                + Crear equipo
              </Link>
            </div>
          )}
        </div>

        <h2 className="font-heading text-2xl font-semibold text-ganker-text">
          Buscar equipos
        </h2>

        <FiltrosEquiposComponent busqueda={busqueda} />

        {resultados}

        {mostrarPaginacion && (
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={busqueda.paginaAnterior}
              disabled={!busqueda.hayPaginaAnterior}
              className={CLASES_BOTON_PAGINA}
            >
              Anterior
            </button>
            <span className="text-sm text-ganker-muted">
              Página {busqueda.pagina}
            </span>
            <button
              type="button"
              onClick={busqueda.paginaSiguiente}
              disabled={!busqueda.hayPaginaSiguiente}
              className={CLASES_BOTON_PAGINA}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {union.equipo && (
        <ModalUnirseEquipoComponent
          isOpen
          equipo={union.equipo}
          vacantes={union.vacantes}
          motivoNoPuedeUnirse={
            union.puedeUnirse ? null : union.motivoNoPuedeUnirse
          }
          isLoading={union.uniendose}
          error={union.errorUnion}
          onConfirm={handleConfirmarUnion}
          onCancel={union.cerrar}
        />
      )}
    </section>
  );
};

export default EquiposPage;
