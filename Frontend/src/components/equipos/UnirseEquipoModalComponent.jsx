import { useEffect, useState } from "react";
import { urlDeMedia } from "../../utils/media";
import { validarUnirseEquipo } from "../../utils/validacionesEquipos";

/**
 * Modal para postularse y unirse a un cupo vacante en un equipo (US 02).
 */
export function UnirseEquipoModalComponent({
  isOpen,
  team,
  user,
  ranks = [],
  estaEnEquipoActivo = false,
  onClose,
  onConfirm,
}) {
  const vacantes = team?.members?.filter((m) => m.user_id === null) ?? [];
  const primerRolId =
    vacantes[0]?.active_game_profile?.active_role_profile?.role_id ?? null;

  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorLocal, setErrorLocal] = useState("");

  const roleIdActivo = selectedRoleId ?? primerRolId;

  // Manejar Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !team) return null;

  // Evaluar elegibilidad para el rol actualmente seleccionado
  const validacionActual = validarUnirseEquipo({
    team,
    user,
    targetRoleId: roleIdActivo,
    ranks,
    estaEnEquipoActivo,
  });

  const handleConfirmar = async () => {
    if (!roleIdActivo) {
      setErrorLocal("Por favor selecciona un cupo vacante.");
      return;
    }

    if (!validacionActual.esValido) {
      setErrorLocal(validacionActual.error);
      return;
    }

    setIsSubmitting(true);
    setErrorLocal("");

    const res = await onConfirm(team, roleIdActivo);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorLocal(res.error || "No se pudo unir al equipo.");
    } else {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-unirse-equipo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg space-y-5 rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3
              id="titulo-modal-unirse-equipo"
              className="font-heading text-xl font-bold text-ganker-text"
            >
              Unirse a {team.team_name}
            </h3>
            <p className="mt-1 text-xs text-ganker-muted">
              Selecciona el cupo vacante al que deseas integrarte.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-ganker-muted transition hover:bg-white/5 hover:text-ganker-text"
          >
            ✕
          </button>
        </div>

        {/* Resumen de requisitos del equipo */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/5 bg-ganker-surface-light p-3.5 text-xs">
          <div>
            <span className="text-ganker-muted">Rango requerido:</span>
            <p className="font-semibold text-ganker-text">
              {team.min_rank_name && team.max_rank_name
                ? `${team.min_rank_name} - ${team.max_rank_name}`
                : "Sin restricción de rango"}
            </p>
          </div>

          <div>
            <span className="text-ganker-muted">Región:</span>
            <p className="font-semibold text-ganker-text">
              {team.allow_other_regions
                ? "Permite otras regiones"
                : team.region_name || "Misma región requerida"}
            </p>
          </div>
        </div>

        {/* Lista de vacantes disponibles */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-ganker-muted uppercase tracking-wider">
            Cupos vacantes ({vacantes.length})
          </label>

          {vacantes.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-ganker-muted">
              Este equipo no cuenta con cupos vacantes disponibles.
            </div>
          ) : (
            <div className="grid gap-2">
              {vacantes.map((v, idx) => {
                const roleProfile = v.active_game_profile?.active_role_profile;
                const roleId = roleProfile?.role_id;
                const roleName = roleProfile?.role_name || "Rol libre";
                const icon = v.icon_url ? urlDeMedia(v.icon_url) : null;
                const isSelected = roleIdActivo === roleId;

                return (
                  <button
                    key={`vacante-slot-${idx}`}
                    type="button"
                    onClick={() => {
                      setSelectedRoleId(roleId);
                      setErrorLocal("");
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? "border-ganker-purple bg-ganker-purple/20 text-ganker-text"
                        : "border-white/10 bg-ganker-surface-light text-ganker-muted hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-ganker-surface">
                        {icon ? (
                          <img
                            src={icon}
                            alt=""
                            className="h-5 w-5 object-contain"
                          />
                        ) : (
                          <span className="text-xs">⚔️</span>
                        )}
                      </div>
                      <div>
                        <span className="block font-semibold text-ganker-text">
                          Rol: {roleName}
                        </span>
                        <span className="text-[11px] text-ganker-muted">
                          Cupo #{idx + 1}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-semibold ${
                        isSelected
                          ? "text-ganker-purple-light"
                          : "text-ganker-muted"
                      }`}
                    >
                      {isSelected ? "Seleccionado ✓" : "Elegir"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Feedback de validación de requisitos */}
        {roleIdActivo && (
          <div>
            {validacionActual.esValido ? (
              <div className="rounded-xl border border-ganker-success/30 bg-ganker-success/10 p-3 text-xs text-ganker-success">
                ✓ Cumples con todos los requisitos para postularte a esta
                vacante.
              </div>
            ) : (
              <div className="rounded-xl border border-ganker-error/30 bg-ganker-error/10 p-3 text-xs text-ganker-error">
                ✕ {validacionActual.error}
              </div>
            )}
          </div>
        )}

        {errorLocal && (
          <div className="rounded-xl border border-ganker-error/30 bg-ganker-error/10 p-3 text-xs text-ganker-error">
            {errorLocal}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-ganker-muted transition hover:bg-white/5 hover:text-ganker-text disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            disabled={
              isSubmitting ||
              vacantes.length === 0 ||
              !roleIdActivo ||
              !validacionActual.esValido
            }
            className="cursor-pointer rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ganker-purple/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? "Uniéndote..." : "Unirme al equipo"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnirseEquipoModalComponent;
