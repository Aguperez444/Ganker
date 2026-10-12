import { useEffect } from "react";
import { urlDeMedia } from "../../utils/media";

// Modal para elegir a qué vacante (rol) unirse cuando el equipo tiene más de
// una. El backend aloja al jugador en un slot puntual (target_team_member_role_id),
// así que el rol no se puede decidir después.
//
// Props:
//   - equipo: el equipo al que se quiere unir (o null para no mostrar nada).
//   - procesandoUnirse: true mientras se procesa el pedido.
//   - onSeleccionarVacante(vacante): se une a esa vacante.
//   - onCancelar: cierra el modal.
function ModalElegirRolEquipo({
  equipo,
  procesandoUnirse = false,
  onSeleccionarVacante,
  onCancelar,
}) {
  useEffect(() => {
    if (!equipo) return;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !procesandoUnirse) {
        onCancelar();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [equipo, procesandoUnirse, onCancelar]);

  if (!equipo) return null;

  const vacantes = (equipo.members ?? []).filter((miembro) => miembro.is_vacant);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-elegir-rol"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={() => !procesandoUnirse && onCancelar()}
    >
      <div
        className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3
          id="titulo-elegir-rol"
          className="font-heading text-lg font-bold text-ganker-text"
        >
          Elegí tu rol en {equipo.team_name}
        </h3>

        <p className="text-sm text-ganker-muted">
          El rol define el espacio que vas a ocupar en el equipo. Elegí la
          vacante que quieras cubrir.
        </p>

        <ul className="max-h-72 space-y-2 overflow-auto">
          {vacantes.map((vacante) => {
            const rol = vacante.active_game_profile?.active_role_profile;
            const icono = urlDeMedia(vacante.icon_url);

            return (
              <li key={vacante.team_member_role_id}>
                <button
                  type="button"
                  onClick={() => onSeleccionarVacante(vacante)}
                  disabled={procesandoUnirse}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-ganker-surface-light px-4 py-3 text-left transition hover:border-ganker-purple/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {icono ? (
                    <img
                      src={icono}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-ganker-surface text-xs font-semibold text-ganker-purple-light">
                      {rol?.role_name?.charAt(0).toUpperCase() ?? "?"}
                    </span>
                  )}

                  <span className="truncate font-semibold text-ganker-text">
                    {rol?.role_name ?? "Rol libre"}
                  </span>

                  <span className="ml-auto shrink-0 text-sm font-semibold text-ganker-purple-light">
                    Unirse
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancelar}
            disabled={procesandoUnirse}
            className="cursor-pointer rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-ganker-muted transition hover:bg-white/5 hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalElegirRolEquipo;