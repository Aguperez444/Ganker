import { Link, useNavigate, useParams } from "react-router-dom";
import AvisoComponent from "../components/common/AvisoComponent";
import FichaEquipoComponent from "../components/equipos/FichaEquipoComponent";
import IntegrantesEquipoComponent from "../components/equipos/IntegrantesEquipoComponent";
import ModalUnirseEquipoComponent from "../components/equipos/ModalUnirseEquipoComponent";
import useEquipo from "../hooks/useEquipo";
import useIconosDeRoles from "../hooks/useIconosDeRoles";
import useUnirseEquipo from "../hooks/useUnirseEquipo";
import { elegibilidadDelEquipo } from "../utils/validacionesEquipos";
import { rutaPerfilJugador } from "../utils/rutas";

const CLASES_BOTON_PRINCIPAL =
  "inline-block w-full shrink-0 cursor-pointer rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto";

// US 18 - Unirse a equipo: vista de un equipo ajeno con el boton para unirse.
const EquipoPage = () => {
  const { equipoId } = useParams();
  const navigate = useNavigate();
  const { equipo, cargando, error, reemplazarEquipo } = useEquipo(equipoId);
  const union = useUnirseEquipo({ alActualizarEquipo: reemplazarEquipo });
  const iconosDeRoles = useIconosDeRoles(equipo?.videogame?.videogame_id);

  const handleConfirmar = async (vacanteId) => {
    const resultado = await union.unirse(vacanteId);
    if (!resultado) return;

    navigate("/app/equipos/mi-equipo", {
      state: { mensajeExito: resultado.message },
    });
  };

  let contenido;

  if (cargando) {
    contenido = <p className="text-sm text-ganker-muted">Cargando...</p>;
  } else if (error) {
    contenido = (
      <AvisoComponent
        titulo={error}
        accion={
          <Link
            to="/app/equipos"
            className="text-sm font-semibold text-ganker-orange-light hover:underline"
          >
            Volver a Equipos
          </Link>
        }
      />
    );
  } else {
    const esMiembro = Boolean(equipo.consultant_player_info?.is_member);
    const { puedeUnirse, motivo } = elegibilidadDelEquipo(equipo);

    contenido = (
      <div className="space-y-6">
        <FichaEquipoComponent equipo={equipo} />

        <div className="rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
          {esMiembro ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ganker-muted">
                Ya sos miembro de este equipo.
              </p>
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
                <h2 className="font-heading text-lg font-semibold text-ganker-text">
                  {puedeUnirse
                    ? "Cumplís los requisitos del equipo"
                    : "No podés unirte a este equipo"}
                </h2>
                {!puedeUnirse && (
                  <p className="mt-1 text-sm text-ganker-error">{motivo}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => union.abrir(equipo)}
                disabled={!puedeUnirse}
                className={CLASES_BOTON_PRINCIPAL}
              >
                Unirse al equipo
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
          <h2 className="mb-4 font-heading text-lg font-semibold text-ganker-text">
            Integrantes
          </h2>
          <IntegrantesEquipoComponent
            integrantes={equipo.members}
            iconosDeRoles={iconosDeRoles}
            onVerPerfil={(userId) => navigate(rutaPerfilJugador(userId))}
          />
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-full bg-ganker-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8">
          <Link
            to="/app/equipos"
            className="text-sm text-ganker-muted transition hover:text-ganker-text"
          >
            ← Equipos
          </Link>
        </header>

        {contenido}
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
          onConfirm={handleConfirmar}
          onCancel={union.cerrar}
        />
      )}
    </section>
  );
};

export default EquipoPage;
