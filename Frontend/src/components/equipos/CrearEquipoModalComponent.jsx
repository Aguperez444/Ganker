import { useEffect, useState } from "react";
import CampoTexto from "../common/CampoTexto";
import IconSelectComponent from "../common/IconSelectComponent";
import ModalRecortarAvatar from "../jugadores/ModalRecortarAvatarComponent";
import { getRegionsByGame } from "../../api/regionApi";
import { getRanksByGame } from "../../api/rankApi";
import { getRolesByGame } from "../../api/roleApi";
import { buscarPerfilDeJuegoDeUsuario } from "../../utils/validacionesEquipos";

/**
 * Modal para el registro de un nuevo equipo (US 01).
 */
export function CrearEquipoModalComponent({
  isOpen,
  onClose,
  games = [],
  user = null,
  estaEnEquipoActivo = false,
  onSubmit,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamIconFile, setTeamIconFile] = useState(null);
  const [previewIconUrl, setPreviewIconUrl] = useState(null);
  const [modalRecorteAbierto, setModalRecorteAbierto] = useState(false);
  const [imagenParaRecortar, setImagenParaRecortar] = useState(null);
  const [nombreArchivoOriginal, setNombreArchivoOriginal] =
    useState("team_icon.png");
  const [errorImagen, setErrorImagen] = useState(null);

  const [videogameId, setVideogameId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [allowOtherRegions, setAllowOtherRegions] = useState(false);
  const [minRankId, setMinRankId] = useState("");
  const [maxRankId, setMaxRankId] = useState("");
  const [creatorGameRoleId, setCreatorGameRoleId] = useState("");
  const [numVacantes, setNumVacantes] = useState(1);
  const [vacantGameRoleIds, setVacantGameRoleIds] = useState([""]);

  // Catálogos dinámicos para el videojuego seleccionado
  const [regiones, setRegiones] = useState([]);
  const [rangos, setRangos] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);

  const [errores, setErrores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cerrar con Escape
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

  const handleGameChange = (newGameId) => {
    setVideogameId(newGameId);
    setRegiones([]);
    setRangos([]);
    setRoles([]);
    setRegionId("");
    setMinRankId("");
    setMaxRankId("");
    setCreatorGameRoleId("");
  };

  // Al seleccionar videojuego, cargar regiones, rangos y roles
  useEffect(() => {
    if (!videogameId) return;

    let cancelado = false;

    const cargarDatosJuego = async () => {
      try {
        setIsLoadingCatalogs(true);
        const [reg, ran, rol] = await Promise.all([
          getRegionsByGame(videogameId).catch(() => []),
          getRanksByGame(videogameId).catch(() => []),
          getRolesByGame(videogameId).catch(() => []),
        ]);

        if (cancelado) return;
        setRegiones(reg ?? []);
        setRangos(ran ?? []);
        setRoles(rol ?? []);
      } catch (err) {
        console.error("Error al cargar opciones del videojuego:", err);
      } finally {
        if (!cancelado) setIsLoadingCatalogs(false);
      }
    };

    cargarDatosJuego();
    return () => {
      cancelado = true;
    };
  }, [videogameId]);

  // Sincronizar array de vacantes con numVacantes
  const handleCambioNumVacantes = (nuevoNum) => {
    const cantidad = Math.max(1, Math.min(9, Number(nuevoNum) || 1));
    setNumVacantes(cantidad);

    setVacantGameRoleIds((prev) => {
      const actualizados = [...prev];
      if (actualizados.length < cantidad) {
        while (actualizados.length < cantidad) actualizados.push("");
      } else {
        actualizados.length = cantidad;
      }
      return actualizados;
    });
  };

  const handleSeleccionarRolVacante = (index, roleId) => {
    setVacantGameRoleIds((prev) => {
      const copia = [...prev];
      copia[index] = roleId;
      return copia;
    });
  };

  const handleSeleccionarArchivo = (e) => {
    setErrorImagen(null);
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      setErrorImagen(
        "Por favor seleccioná un archivo de imagen válido (JPG, PNG o WEBP)."
      );
      e.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(archivo);
    setImagenParaRecortar(objectUrl);
    setNombreArchivoOriginal(archivo.name || "team_icon.png");
    setModalRecorteAbierto(true);
    e.target.value = "";
  };

  const handleConfirmarRecorte = (file, previewUrl) => {
    if (imagenParaRecortar) {
      URL.revokeObjectURL(imagenParaRecortar);
      setImagenParaRecortar(null);
    }
    setModalRecorteAbierto(false);
    setTeamIconFile(file);
    setPreviewIconUrl(previewUrl);
  };

  const handleCerrarModalRecorte = () => {
    if (imagenParaRecortar) {
      URL.revokeObjectURL(imagenParaRecortar);
      setImagenParaRecortar(null);
    }
    setModalRecorteAbierto(false);
  };

  const handleQuitarIcono = () => {
    if (previewIconUrl) {
      URL.revokeObjectURL(previewIconUrl);
    }
    setTeamIconFile(null);
    setPreviewIconUrl(null);
    setErrorImagen(null);
  };

  const handleCerrar = () => {
    if (isSubmitting) return;
    if (imagenParaRecortar) {
      URL.revokeObjectURL(imagenParaRecortar);
      setImagenParaRecortar(null);
    }
    onClose();
  };

  // Obtener perfil del usuario para el juego seleccionado para previsualizar su rango
  const perfilUsuario = buscarPerfilDeJuegoDeUsuario(user, videogameId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrores({});

    const formData = {
      name,
      description,
      team_icon: teamIconFile,
      videogame_id: videogameId,
      region_id: allowOtherRegions ? regionId || null : regionId,
      allow_other_regions: allowOtherRegions,
      min_rank_id: minRankId,
      max_rank_id: maxRankId,
      creator_game_role_id: creatorGameRoleId,
      vacant_game_role_ids: vacantGameRoleIds.filter(Boolean),
    };

    setIsSubmitting(true);
    const resultado = await onSubmit(formData, rangos);
    setIsSubmitting(false);

    if (!resultado.success) {
      setErrores(resultado.errores || { general: resultado.error });
    } else {
      if (previewIconUrl) {
        URL.revokeObjectURL(previewIconUrl);
      }
      setTeamIconFile(null);
      setPreviewIconUrl(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-crear-equipo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto"
    >
      <div className="my-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2
            id="titulo-modal-crear-equipo"
            className="font-heading text-xl font-bold text-ganker-text sm:text-2xl"
          >
            Registrar un equipo
          </h2>
          <button
            type="button"
            onClick={handleCerrar}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-ganker-muted transition hover:bg-white/5 hover:text-ganker-text"
          >
            ✕
          </button>
        </div>

        {errores.general && (
          <div className="mt-4 rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
            <p className="text-sm text-ganker-error">{errores.general}</p>
          </div>
        )}

        {estaEnEquipoActivo && (
          <div className="mt-4 rounded-lg border border-ganker-warning/20 bg-ganker-warning/10 px-4 py-3">
            <p className="text-sm text-ganker-warning">
              ⚠️ Ya formas parte de un equipo activo. Debes dejarlo antes de
              crear uno nuevo.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Logo del equipo con recorte circular */}
          <div className="flex flex-col gap-4 rounded-xl border border-white/5 bg-ganker-surface-light/40 p-4 sm:flex-row sm:items-center">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-ganker-purple/40 bg-gradient-to-br from-ganker-orange to-ganker-purple font-heading text-2xl font-bold text-white shadow-md">
              {previewIconUrl ? (
                <img
                  src={previewIconUrl}
                  alt="Vista previa del logo del equipo"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span>
                  {name.trim() ? name.trim().charAt(0).toUpperCase() : "🛡️"}
                </span>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <label
                  htmlFor="input-team-icon"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-ganker-surface-light px-3.5 py-2 font-heading text-xs font-bold text-ganker-text transition hover:border-ganker-orange/50 hover:bg-white/5"
                >
                  <svg
                    className="h-4 w-4 text-ganker-orange"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {previewIconUrl ? "Cambiar logo" : "Subir logo del equipo"}
                </label>

                {previewIconUrl && (
                  <button
                    type="button"
                    onClick={handleQuitarIcono}
                    className="cursor-pointer rounded-lg border border-ganker-error/30 bg-ganker-error/10 px-3 py-2 font-heading text-xs font-semibold text-ganker-error transition hover:bg-ganker-error/20"
                  >
                    Descartar logo
                  </button>
                )}

                <input
                  id="input-team-icon"
                  type="file"
                  accept="image/*"
                  onChange={handleSeleccionarArchivo}
                  className="sr-only"
                />
              </div>

              <p className="text-xs text-ganker-muted">
                Logo o escudo del equipo (opcional). Podrás encuadrarlo con
                recorte circular. Si se omite, se asignará un ícono por defecto.
              </p>

              {errorImagen && (
                <p
                  role="alert"
                  className="text-xs font-medium text-ganker-error"
                >
                  {errorImagen}
                </p>
              )}
            </div>
          </div>

          {/* Nombre del equipo */}
          <CampoTexto
            label="Nombre del equipo *"
            placeholder="Ej: Los Tryhards Nocturnos"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errores.name}
            required
          />

          {/* Mensaje descriptivo / búsqueda de la sala */}
          <div>
            <label className="mb-1 block text-xs font-semibold tracking-wide text-ganker-text font-body">
              Mensaje descriptivo de búsqueda
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Buscamos mid y soporte con ganas de subir a Diamante..."
              className="w-full rounded-lg border border-ganker-purple bg-ganker-surface px-3 py-2 text-sm text-ganker-text font-body placeholder:text-ganker-muted focus:outline-none focus:ring-2 focus:ring-ganker-purple"
            />
          </div>

          {/* Videojuego */}
          <div>
            <label className="mb-1 block text-xs font-semibold tracking-wide text-ganker-text font-body">
              Videojuego *
            </label>
            <IconSelectComponent
              value={videogameId}
              onChange={handleGameChange}
              options={games}
              placeholder="Seleccioná un videojuego"
              getOptionId={(g) => g.id}
            />
            {errores.videogame_id && (
              <p className="mt-1 text-xs text-ganker-error">
                {errores.videogame_id}
              </p>
            )}
          </div>

          {videogameId && (
            <>
              {isLoadingCatalogs ? (
                <p className="py-2 text-sm text-ganker-muted">
                  Cargando opciones del videojuego...
                </p>
              ) : (
                <>
                  {/* Región y opción de permitir otras regiones */}
                  <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
                    <div>
                      <label className="mb-1 block text-xs font-semibold tracking-wide text-ganker-text font-body">
                        Región {allowOtherRegions ? "(Opcional)" : "*"}
                      </label>
                      <IconSelectComponent
                        value={regionId}
                        onChange={setRegionId}
                        options={regiones}
                        placeholder={
                          allowOtherRegions
                            ? "Cualquiera / Sin región fija"
                            : "Seleccioná la región"
                        }
                        getOptionId={(r) => r.region_id}
                      />
                      {errores.region_id && (
                        <p className="mt-1 text-xs text-ganker-error">
                          {errores.region_id}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center pt-6">
                      <label className="flex cursor-pointer items-center gap-2.5 text-xs text-ganker-text font-medium">
                        <input
                          type="checkbox"
                          checked={allowOtherRegions}
                          onChange={(e) =>
                            setAllowOtherRegions(e.target.checked)
                          }
                          className="h-4 w-4 rounded border-white/20 bg-ganker-surface text-ganker-purple focus:ring-ganker-purple"
                        />
                        <span>Admitir jugadores de otras regiones</span>
                      </label>
                    </div>
                  </div>

                  {/* Rango mínimo y Rango máximo */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold tracking-wide text-ganker-text font-body">
                        Rango mínimo requerido *
                      </label>
                      <IconSelectComponent
                        value={minRankId}
                        onChange={setMinRankId}
                        options={rangos}
                        placeholder="Rango mínimo"
                        getOptionId={(r) => r.rank_id}
                      />
                      {errores.min_rank_id && (
                        <p className="mt-1 text-xs text-ganker-error">
                          {errores.min_rank_id}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold tracking-wide text-ganker-text font-body">
                        Rango máximo requerido *
                      </label>
                      <IconSelectComponent
                        value={maxRankId}
                        onChange={setMaxRankId}
                        options={rangos}
                        placeholder="Rango máximo"
                        getOptionId={(r) => r.rank_id}
                      />
                      {errores.max_rank_id && (
                        <p className="mt-1 text-xs text-ganker-error">
                          {errores.max_rank_id}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rol del creador */}
                  <div className="rounded-xl border border-white/10 bg-ganker-surface-light p-4">
                    <label className="mb-1 block text-xs font-semibold tracking-wide text-ganker-text font-body">
                      Tu rol en el equipo (Líder) *
                    </label>
                    <p className="mb-3 text-xs text-ganker-muted">
                      Al crearse el equipo serás el líder y primer integrante
                      ocupando este rol.
                    </p>

                    <IconSelectComponent
                      value={creatorGameRoleId}
                      onChange={setCreatorGameRoleId}
                      options={roles}
                      placeholder="Seleccioná tu rol"
                      getOptionId={(r) => r.role_id}
                    />

                    {perfilUsuario && creatorGameRoleId && (
                      <div className="mt-2 text-xs text-ganker-muted">
                        {(() => {
                          const rp = perfilUsuario.role_profiles?.find(
                            (x) =>
                              Number(x.role?.role_id) ===
                              Number(creatorGameRoleId)
                          );
                          if (rp) {
                            return (
                              <span className="text-ganker-purple-light font-medium">
                                Tu rango actual con este rol es: {rp.rank?.name}
                              </span>
                            );
                          }
                          return (
                            <span className="text-ganker-error">
                              No tienes este rol configurado en tu perfil de
                              juego.
                            </span>
                          );
                        })()}
                      </div>
                    )}

                    {errores.creator_game_role_id && (
                      <p className="mt-1 text-xs text-ganker-error">
                        {errores.creator_game_role_id}
                      </p>
                    )}
                  </div>

                  {/* Configuración de cupos vacantes */}
                  <div className="rounded-xl border border-white/10 bg-ganker-surface-light p-4 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="block text-xs font-semibold tracking-wide text-ganker-text font-body">
                          Cantidad de cupos vacantes *
                        </label>
                        <p className="text-xs text-ganker-muted">
                          ¿Cuántos compañeros buscas para completar el equipo?
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleCambioNumVacantes(numVacantes - 1)
                          }
                          disabled={numVacantes <= 1}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-ganker-surface text-sm font-bold text-ganker-text hover:bg-white/5 disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-heading font-bold text-ganker-purple-light">
                          {numVacantes}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCambioNumVacantes(numVacantes + 1)
                          }
                          disabled={numVacantes >= 9}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-ganker-surface text-sm font-bold text-ganker-text hover:bg-white/5 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {errores.vacant_slots && (
                      <p className="text-xs text-ganker-error">
                        {errores.vacant_slots}
                      </p>
                    )}

                    {/* Selector de rol para cada cupo vacante */}
                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-semibold text-ganker-muted uppercase tracking-wider">
                        Rol buscado para cada cupo vacante:
                      </p>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {vacantGameRoleIds.map((roleId, idx) => (
                          <div key={`vacante-input-${idx}`}>
                            <label className="mb-1 block text-[11px] font-medium text-ganker-muted">
                              Cupo vacante #{idx + 1} *
                            </label>
                            <IconSelectComponent
                              value={roleId}
                              onChange={(val) =>
                                handleSeleccionarRolVacante(idx, val)
                              }
                              options={roles}
                              placeholder="Elegí el rol buscado"
                              getOptionId={(r) => r.role_id}
                            />
                          </div>
                        ))}
                      </div>

                      {errores.vacant_roles && (
                        <p className="mt-1 text-xs text-ganker-error">
                          {errores.vacant_roles}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={handleCerrar}
              disabled={isSubmitting}
              className="cursor-pointer rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-ganker-muted transition hover:bg-white/5 hover:text-ganker-text disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ganker-purple/20 transition hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Registrando equipo..." : "Registrar equipo"}
            </button>
          </div>
        </form>
      </div>

      <ModalRecortarAvatar
        isOpen={modalRecorteAbierto}
        imagenSrc={imagenParaRecortar}
        nombreArchivoOriginal={nombreArchivoOriginal}
        onClose={handleCerrarModalRecorte}
        onConfirm={handleConfirmarRecorte}
        titulo="Encuadrar logo del equipo"
        descripcion="Arrastrá y ajustá el zoom para centrar el logo en el círculo."
      />
    </div>
  );
}

export default CrearEquipoModalComponent;
