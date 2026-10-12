import { useState } from "react";
import AvatarUsuarioComponent from "../common/AvatarUsuarioComponent";
import AvisoComponent from "../common/AvisoComponent";
import ModalEditarEquipoComponent from "./ModalEditarEquipoComponent";
import { useMiEquipo } from "../../hooks/useMiEquipo";
import { urlDeMedia } from "../../utils/media";

// US 04 - Panel "Mi equipo": muestra el equipo activo del jugador y, si es el
// líder, permite modificarlo. `recargaToken` lo recarga desde afuera (por
// ejemplo cuando el jugador se une a un equipo desde el buscador) y
// `onEquipoActualizado` avisa a la página para que refresque el listado de
// búsqueda cuando se guarda un cambio.
function MiEquipoPanelComponent({
  recargaToken = 0,
  onEquipoActualizado = null,
}) {
  const { equipo, isLoading, error, guardando, actualizar } =
    useMiEquipo(recargaToken);

  const [editando, setEditando] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState("");
  const [aviso, setAviso] = useState(null);

  const esLider = Boolean(equipo?.consultant_player_info?.is_leader);
  const iconoEquipo = urlDeMedia(equipo?.icon_url);

  const abrirEdicion = () => {
    setErrorEdicion("");
    setEditando(true);
  };

  const manejarGuardar = async (payload) => {
    const resultado = await actualizar(payload);

    if (resultado.ok) {
      setAviso({ tipo: "exito", texto: resultado.mensaje });
      setErrorEdicion("");
      setEditando(false);
      // El listado general puede mostrar este equipo: que se refresque.
      if (onEquipoActualizado) onEquipoActualizado();
    } else {
      setErrorEdicion(resultado.mensaje);
    }
  };

  // El placeholder de carga y el de error solo se muestran en la primera
  // carga: si ya hay un equipo, un refresco (por ejemplo, disparado por el
  // feed en vivo) no debe reemplazar el panel ni desmontar el modal abierto.
  if (isLoading && !equipo) {
    return (
      <div className="rounded-2xl border border-white/10 bg-ganker-surface p-6">
        <p className="text-sm text-ganker-muted">Cargando tu equipo...</p>
      </div>
    );
  }

  if (error && !equipo) {
    return (
      <div className="rounded-2xl border border-ganker-error/20 bg-ganker-error/10 p-6">
        <p className="text-sm text-ganker-error">{error}</p>
      </div>
    );
  }

  if (!equipo) {
    return (
      <div className="rounded-2xl border border-white/10 bg-ganker-surface p-6">
        <h2 className="font-heading text-lg font-bold text-ganker-text">
          Mi equipo
        </h2>
        <p className="mt-2 text-sm text-ganker-muted">
          No pertenecés a ningún equipo activo. Buscá uno más abajo para unirte
          a una de sus vacantes.
        </p>
      </div>
    );
  }

  const miembros = equipo.members ?? [];
  const vacantes = miembros.filter((miembro) => miembro.is_vacant);
  const ocupados = miembros.filter((miembro) => !miembro.is_vacant);
  const rangoMin = equipo.min_rank?.name;
  const rangoMax = equipo.max_rank?.name;

  return (
    <div className="rounded-2xl border border-white/10 bg-ganker-surface p-6">
      <div className="mb-4">
        <AvisoComponent aviso={aviso} onCerrar={() => setAviso(null)} />
      </div>

      <div className="flex flex-wrap items-start gap-4">
        {iconoEquipo ? (
          <img
            src={iconoEquipo}
            alt=""
            className="h-14 w-14 shrink-0 rounded-xl object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-xl font-bold text-ganker-text">
              {equipo.team_name}
            </h2>
            <span className="rounded-full border border-white/10 bg-ganker-surface-light px-2.5 py-1 text-xs font-semibold text-ganker-text">
              {equipo.player_count}/{equipo.max_players} jugadores
            </span>
            {vacantes.length > 0 && (
              <span className="rounded-full border border-ganker-purple/30 bg-ganker-purple/10 px-2.5 py-1 text-xs font-semibold text-ganker-purple-light">
                {vacantes.length} vacante{vacantes.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-ganker-muted">
            {equipo.videogame?.name ?? "Videojuego"}
            {equipo.region?.region_name
              ? ` · ${equipo.region.region_name}`
              : " · Sin región"}
            {rangoMin && rangoMax ? ` · ${rangoMin} – ${rangoMax}` : ""}
          </p>

          {equipo.description && (
            <p className="mt-2 text-sm text-ganker-muted">
              {equipo.description}
            </p>
          )}
        </div>

        {esLider ? (
          <button
            type="button"
            onClick={abrirEdicion}
            className="cursor-pointer rounded-xl border border-ganker-purple/40 bg-ganker-purple/15 px-4 py-2.5 text-sm font-semibold text-ganker-purple-light transition hover:bg-ganker-purple/25"
          >
            Editar equipo
          </button>
        ) : (
          <span className="rounded-xl border border-white/10 bg-ganker-surface-light px-4 py-2.5 text-xs text-ganker-muted">
            Solo el líder puede editar
          </span>
        )}
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {ocupados.map((miembro) => (
          <li
            key={miembro.team_member_role_id ?? miembro.user_id}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-ganker-surface-light py-1 pr-3 pl-1"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ganker-bg text-xs font-semibold text-ganker-purple-light">
              <AvatarUsuarioComponent user={miembro} />
            </span>
            <span className="text-xs font-semibold text-ganker-text">
              {miembro.name}
            </span>
            {miembro.is_leader && (
              <span className="text-xs text-amber-300">Líder</span>
            )}
          </li>
        ))}

        {vacantes.map((vacante) => (
          <li
            key={vacante.team_member_role_id}
            className="flex items-center gap-2 rounded-full border border-dashed border-ganker-purple/40 bg-ganker-purple/5 px-3 py-1.5"
          >
            <span className="text-xs text-ganker-muted">
              Vacante de{" "}
              {vacante.active_game_profile?.active_role_profile?.role_name ??
                "rol libre"}
            </span>
          </li>
        ))}
      </ul>

      {editando && (
        <ModalEditarEquipoComponent
          key={equipo.team_id}
          equipo={equipo}
          onGuardar={manejarGuardar}
          onCancelar={() => setEditando(false)}
          guardando={guardando}
          errorExterno={errorEdicion}
        />
      )}
    </div>
  );
}

export default MiEquipoPanelComponent;
