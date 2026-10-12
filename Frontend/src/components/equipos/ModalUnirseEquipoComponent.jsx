import { useEffect, useState } from "react";

// US 18 - Unirse a equipo.
// Cada vacante busca un rol puntual, asi que antes de unirse el jugador
// elige cual ocupar. `vacantes` viene de useUnirseEquipo: las que tienen
// `motivo` no las puede ocupar y se muestran deshabilitadas con el porque.
//
// US 17 - Buscar equipos: el boton de las tarjetas abre este modal aunque el
// jugador no cumpla los requisitos. En ese caso `motivoNoPuedeUnirse` dice
// por que y no se puede confirmar.
const ModalUnirseEquipoComponent = ({
  isOpen,
  equipo,
  vacantes,
  motivoNoPuedeUnirse = null,
  isLoading = false,
  error = "",
  onConfirm,
  onCancel,
}) => {
  const disponibles = motivoNoPuedeUnirse
    ? []
    : vacantes.filter((vacante) => !vacante.motivo);
  const [elegidaId, setElegidaId] = useState(null);

  // Si la elegida deja de estar disponible (se recargo el equipo tras un
  // error), o hay una sola posible, se ajusta sola.
  const vacanteId = disponibles.some((v) => v.team_member_role_id === elegidaId)
    ? elegidaId
    : disponibles.length === 1
      ? disponibles[0].team_member_role_id
      : null;

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape" && !isLoading) onCancel();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-unirse"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-2xl">
        <h3
          id="titulo-modal-unirse"
          className="font-heading text-lg font-bold text-ganker-text"
        >
          Unirse a {equipo.team_name}
        </h3>

        {motivoNoPuedeUnirse ? (
          <div className="rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
            <p className="text-sm font-semibold text-ganker-error">
              No cumplís los requisitos para unirte a este equipo
            </p>
            <p className="mt-1 text-sm text-ganker-error">
              {motivoNoPuedeUnirse}
            </p>
          </div>
        ) : (
          <p className="text-sm text-ganker-muted">
            Elegí la vacante que vas a ocupar. Al unirte vas a entrar
            automáticamente al chat del equipo.
          </p>
        )}

        <fieldset className="space-y-2">
          <legend className="sr-only">Vacantes</legend>
          {vacantes.map((vacante) => {
            const perfilRol = vacante.active_game_profile.active_role_profile;
            const deshabilitada =
              Boolean(vacante.motivo || motivoNoPuedeUnirse) || isLoading;

            return (
              <label
                key={vacante.team_member_role_id}
                className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
                  vacante.motivo || motivoNoPuedeUnirse
                    ? "cursor-not-allowed border-white/5 opacity-60"
                    : vacanteId === vacante.team_member_role_id
                      ? "cursor-pointer border-ganker-orange/50 bg-ganker-orange/10"
                      : "cursor-pointer border-white/10 hover:bg-white/5"
                }`}
              >
                <input
                  type="radio"
                  name="vacante"
                  className="mt-1 accent-ganker-orange"
                  value={vacante.team_member_role_id}
                  checked={vacanteId === vacante.team_member_role_id}
                  disabled={deshabilitada}
                  onChange={() => setElegidaId(vacante.team_member_role_id)}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ganker-text">
                    {perfilRol.role_name}
                  </span>
                  {vacante.motivo && (
                    <span className="block text-xs text-ganker-muted">
                      {vacante.motivo}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </fieldset>

        {error && (
          <div className="rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
            <p className="text-sm text-ganker-error">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="cursor-pointer rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-ganker-muted transition hover:bg-white/5 hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => onConfirm(vacanteId)}
            disabled={isLoading || vacanteId === null}
            className="cursor-pointer rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Uniéndote..." : "Unirme"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalUnirseEquipoComponent;
