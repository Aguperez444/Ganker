import { Link } from "react-router-dom";
import IconSelectComponent from "../common/IconSelectComponent";
import { urlDeMedia } from "../../utils/media";
import {
  CUPOS_VACANTES_MAXIMO,
  CUPOS_VACANTES_MINIMO,
  LARGO_MAXIMO_DESCRIPCION_EQUIPO,
  LARGO_MAXIMO_NOMBRE_EQUIPO,
} from "../../utils/validacionesEquipos";

const clasesControl = (error) =>
  `w-full rounded-lg border ${
    error ? "border-ganker-error" : "border-white/10"
  } bg-ganker-surface-light px-3 py-2.5 text-sm text-ganker-text outline-none transition placeholder:text-ganker-muted focus:border-ganker-purple-light disabled:cursor-not-allowed disabled:opacity-50`;

const OPCIONES_CUPOS = Array.from(
  { length: CUPOS_VACANTES_MAXIMO - CUPOS_VACANTES_MINIMO + 1 },
  (_, indice) => CUPOS_VACANTES_MINIMO + indice
);

// US 14 - Crear equipo.
// Solo presentacion: el estado y las reglas viven en useCrearEquipo.
//
// Formulario por pasos: primero se elige el videojuego por su imagen y, a
// medida que se completa cada paso, se revela el siguiente:
//   1. Videojuego  ->  2. Datos de la sala
//   3. Region + Rango permitido  ->  4. Integrantes
// Asi el jugador no ve todo el contenido junto. Si un envio deja errores en
// un paso que todavia no se revelo, ese paso se muestra igual para que se
// vea el error (ver mostrarRegionRango / mostrarIntegrantes).
const CrearEquipoFormComponent = ({
  perfiles,
  formulario,
  errores,
  rangos,
  roles,
  regiones,
  rolesDelJugador,
  cargandoCatalogos,
  errorCatalogos,
  enviando,
  errorEnvio,
  onCampoChange,
  onVideojuegoChange,
  onCantidadVacantesChange,
  onRolVacanteChange,
  onSubmit,
}) => {
  const sinJuego = !formulario.videojuegoId;
  const catalogoDeshabilitado = sinJuego || cargandoCatalogos || enviando;

  // Paso "Datos de la sala": alcanza con el nombre (el mensaje es opcional).
  const datosSalaCompletos = formulario.nombre.trim().length > 0;

  // Paso "Region + Rango permitido": hay region (o se admiten otras) y ambos
  // rangos elegidos.
  const regionCompleta =
    Boolean(formulario.regionId) || formulario.admiteOtrasRegiones;
  const rangoCompleto =
    Boolean(formulario.rangoMinimoId) && Boolean(formulario.rangoMaximoId);

  const mostrarRegionRango =
    datosSalaCompletos ||
    Boolean(errores.nombre) ||
    Boolean(errores.region) ||
    Boolean(errores.rangoMinimo) ||
    Boolean(errores.rangoMaximo);

  const mostrarIntegrantes =
    Boolean(errores.rolCreador) ||
    Boolean(errores.rolesVacantes) ||
    (mostrarRegionRango && regionCompleta && rangoCompleto);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-6 rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6"
    >
      <div className="mb-6">
        <h2 className="font-heading text-xl font-semibold text-ganker-text sm:text-2xl">
          Nuevo equipo
        </h2>

        <p className="mt-1 text-sm text-ganker-muted">
          Elegí el videojuego para el que querés armar el equipo y configurá
          cómo van a verlo los jugadores.
        </p>
      </div>

      {/* Paso 1: videojuego, elegido por su imagen. */}
      <div>
        <label className="mb-3 block text-sm font-semibold text-ganker-text">
          Videojuego
        </label>

        <div className="flex flex-wrap gap-3">
          {perfiles.map((perfil) => {
            const game = perfil.videogame;
            const isSelected =
              String(game.id) === String(formulario.videojuegoId);
            const iconUrl = urlDeMedia(game.icon_url);

            return (
              <button
                key={game.id}
                type="button"
                onClick={() => onVideojuegoChange(String(game.id))}
                disabled={enviando}
                className={`flex w-28 flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${
                  isSelected
                    ? "border-ganker-purple-light bg-ganker-purple/20"
                    : "border-white/10 bg-ganker-surface-light hover:border-ganker-purple-light/50 hover:bg-white/5"
                } ${enviando ? "cursor-not-allowed opacity-90" : "cursor-pointer"}`}
              >
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-ganker-surface">
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt={game.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-lg font-bold text-ganker-purple-light">
                      {game.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <span className="line-clamp-2 text-xs font-medium text-ganker-text">
                  {game.name}
                </span>
              </button>
            );
          })}
        </div>

        {errores.videojuego && (
          <p className="mt-2 text-sm text-ganker-error">{errores.videojuego}</p>
        )}
      </div>

      {formulario.videojuegoId && (
        <div className="mt-8 border-t border-white/10 pt-6">
          {/* Paso 2: datos de la sala. */}
          <div>
            <div className="mb-4">
              <h3 className="font-heading text-lg font-semibold text-ganker-text">
                Datos de la sala
              </h3>

              <p className="mt-1 text-sm text-ganker-muted">
                Así van a ver tu equipo los jugadores que busquen uno.
              </p>
            </div>

            <div className="space-y-4">
              <div className="max-w-xl">
                <label
                  htmlFor="equipo-nombre"
                  className="mb-2 block text-sm font-semibold text-ganker-text"
                >
                  Nombre del equipo{" "}
                  <span className="text-ganker-orange">*</span>
                </label>

                <input
                  id="equipo-nombre"
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) => onCampoChange("nombre", e.target.value)}
                  maxLength={LARGO_MAXIMO_NOMBRE_EQUIPO}
                  placeholder="Ej: Los Gankers"
                  disabled={enviando}
                  className={clasesControl(errores.nombre)}
                />

                {errores.nombre && (
                  <p className="mt-1 text-xs text-ganker-error">
                    {errores.nombre}
                  </p>
                )}
              </div>

              <div className="max-w-xl">
                <label
                  htmlFor="equipo-descripcion"
                  className="mb-2 block text-sm font-semibold text-ganker-text"
                >
                  Mensaje de búsqueda
                </label>

                <textarea
                  id="equipo-descripcion"
                  rows={3}
                  value={formulario.descripcion}
                  onChange={(e) => onCampoChange("descripcion", e.target.value)}
                  maxLength={LARGO_MAXIMO_DESCRIPCION_EQUIPO}
                  placeholder="Ej: Buscamos jungla y support para jugar rankeds de noche"
                  disabled={enviando}
                  className={`${clasesControl(errores.descripcion)} resize-y`}
                />

                {errores.descripcion ? (
                  <p className="mt-1 text-xs text-ganker-error">
                    {errores.descripcion}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-ganker-muted">
                    Contá qué buscan: horarios, objetivos, estilo de juego.
                  </p>
                )}
              </div>
            </div>
          </div>

          {cargandoCatalogos && (
            <p className="mt-8 border-t border-white/10 pt-8 text-sm text-ganker-muted">
              Cargando información del videojuego...
            </p>
          )}

          {errorCatalogos && (
            <p className="mt-8 border-t border-white/10 pt-8 text-sm text-ganker-error">
              {errorCatalogos}
            </p>
          )}

          {!cargandoCatalogos &&
            !errorCatalogos &&
            (mostrarRegionRango || mostrarIntegrantes) && (
              <div className="mt-8 border-t border-white/10 pt-8">
                {mostrarRegionRango && (
                  <div className="space-y-8">
                    {/* Paso 3a: región. */}
                    <div>
                      <div className="mb-4">
                        <h3 className="font-heading text-lg font-semibold text-ganker-text">
                          Región
                        </h3>

                        <p className="mt-1 text-sm text-ganker-muted">
                          Indica en qué región juegan. Solo se pueden unir
                          jugadores de esa región, salvo que admitas otras.
                        </p>
                      </div>

                      <div className="max-w-xl">
                        <label htmlFor="equipo-region" className="sr-only">
                          Región
                        </label>

                        <select
                          id="equipo-region"
                          value={formulario.regionId}
                          onChange={(e) =>
                            onCampoChange("regionId", e.target.value, "region")
                          }
                          disabled={catalogoDeshabilitado}
                          className={clasesControl(errores.region)}
                        >
                          <option value="">Sin región</option>
                          {regiones.map((region) => (
                            <option
                              key={region.region_id}
                              value={region.region_id}
                            >
                              {region.name}
                            </option>
                          ))}
                        </select>

                        {errores.region && (
                          <p className="mt-1 text-xs text-ganker-error">
                            {errores.region}
                          </p>
                        )}
                      </div>

                      <label className="mt-4 flex max-w-xl cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-ganker-surface-light px-4 py-3">
                        <input
                          type="checkbox"
                          checked={formulario.admiteOtrasRegiones}
                          onChange={(e) =>
                            onCampoChange(
                              "admiteOtrasRegiones",
                              e.target.checked,
                              "region"
                            )
                          }
                          disabled={enviando}
                          className="mt-0.5 h-4 w-4 accent-ganker-purple"
                        />
                        <span>
                          <span className="block text-sm font-medium text-ganker-text">
                            Admitir jugadores de otras regiones
                          </span>
                          <span className="block text-xs text-ganker-muted">
                            Si no lo marcás, solo pueden unirse jugadores de la
                            región del equipo.
                          </span>
                        </span>
                      </label>
                    </div>

                    {/* Paso 3b: rango permitido. */}
                    <div className="border-t border-white/10 pt-8">
                      <div className="mb-4">
                        <h3 className="font-heading text-lg font-semibold text-ganker-text">
                          Rango permitido
                        </h3>

                        <p className="mt-1 text-sm text-ganker-muted">
                          Solo pueden unirse jugadores con un rango entre estos
                          dos. El tuyo también tiene que estar adentro.
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="equipo-rango-minimo"
                            className="mb-2 block text-sm font-semibold text-ganker-text"
                          >
                            Rango mínimo{" "}
                            <span className="text-ganker-orange">*</span>
                          </label>

                          <IconSelectComponent
                            id="equipo-rango-minimo"
                            value={formulario.rangoMinimoId}
                            onChange={(rangoId) =>
                              onCampoChange(
                                "rangoMinimoId",
                                rangoId,
                                "rangoMinimo"
                              )
                            }
                            options={rangos}
                            getOptionId={(rango) => rango.rank_id}
                            placeholder="Seleccioná un rango"
                            disabled={catalogoDeshabilitado}
                            error={Boolean(errores.rangoMinimo)}
                          />

                          {errores.rangoMinimo && (
                            <p className="mt-1 text-xs text-ganker-error">
                              {errores.rangoMinimo}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="equipo-rango-maximo"
                            className="mb-2 block text-sm font-semibold text-ganker-text"
                          >
                            Rango máximo{" "}
                            <span className="text-ganker-orange">*</span>
                          </label>

                          <IconSelectComponent
                            id="equipo-rango-maximo"
                            value={formulario.rangoMaximoId}
                            onChange={(rangoId) =>
                              onCampoChange(
                                "rangoMaximoId",
                                rangoId,
                                "rangoMaximo"
                              )
                            }
                            options={rangos}
                            getOptionId={(rango) => rango.rank_id}
                            placeholder="Seleccioná un rango"
                            disabled={catalogoDeshabilitado}
                            error={Boolean(errores.rangoMaximo)}
                          />

                          {errores.rangoMaximo && (
                            <p className="mt-1 text-xs text-ganker-error">
                              {errores.rangoMaximo}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Paso 4: integrantes. */}
                {mostrarIntegrantes && (
                  <div className="border-t border-white/10 pt-8">
                    <div className="mb-4">
                      <h3 className="font-heading text-lg font-semibold text-ganker-text">
                        Integrantes
                      </h3>

                      <p className="mt-1 text-sm text-ganker-muted">
                        Vos ocupás el primer lugar como líder. Elegí qué roles
                        buscás para el resto.
                      </p>
                    </div>

                    <div className="max-w-xl">
                      <label
                        htmlFor="equipo-rol-creador"
                        className="mb-2 block text-sm font-semibold text-ganker-text"
                      >
                        Tu rol en el equipo{" "}
                        <span className="text-ganker-orange">*</span>
                      </label>

                      <IconSelectComponent
                        id="equipo-rol-creador"
                        value={formulario.rolCreadorId}
                        onChange={(rolId) =>
                          onCampoChange("rolCreadorId", rolId, "rolCreador")
                        }
                        options={rolesDelJugador}
                        getOptionId={(perfilRol) => perfilRol.role.role_id}
                        getOptionLabel={(perfilRol) =>
                          `${perfilRol.role.name} (${perfilRol.rank.name})`
                        }
                        getOptionIcon={(perfilRol) => perfilRol.role.icon_url}
                        placeholder="Seleccioná tu rol"
                        disabled={catalogoDeshabilitado}
                        error={Boolean(errores.rolCreador)}
                      />

                      {errores.rolCreador ? (
                        <p className="mt-1 text-xs text-ganker-error">
                          {errores.rolCreador}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-ganker-muted">
                          Solo los roles de tu perfil de juego, con tu rango en
                          cada uno.
                        </p>
                      )}
                    </div>

                    <div className="mt-6 max-w-xl">
                      <label
                        htmlFor="equipo-cupos"
                        className="mb-2 block text-sm font-semibold text-ganker-text"
                      >
                        Cupos vacantes{" "}
                        <span className="text-ganker-orange">*</span>
                      </label>

                      {/* Select y no input numerico: asi la cantidad nunca
                          queda vacia o fuera de rango mientras el jugador la
                          edita. */}
                      <select
                        id="equipo-cupos"
                        value={formulario.rolesVacantesIds.length}
                        onChange={(e) =>
                          onCantidadVacantesChange(Number(e.target.value))
                        }
                        disabled={enviando}
                        className={`${clasesControl(false)} sm:w-32`}
                      >
                        {OPCIONES_CUPOS.map((cantidad) => (
                          <option key={cantidad} value={cantidad}>
                            {cantidad}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {formulario.rolesVacantesIds.map((rolId, indice) => (
                        <div key={indice}>
                          <label
                            htmlFor={`equipo-cupo-${indice}`}
                            className="mb-2 block text-sm font-semibold text-ganker-text"
                          >
                            Rol del cupo {indice + 1}{" "}
                            <span className="text-ganker-orange">*</span>
                          </label>

                          <IconSelectComponent
                            id={`equipo-cupo-${indice}`}
                            value={rolId}
                            onChange={(nuevoRolId) =>
                              onRolVacanteChange(indice, nuevoRolId)
                            }
                            options={roles}
                            getOptionId={(rol) => rol.role_id}
                            placeholder="Seleccioná un rol"
                            disabled={catalogoDeshabilitado}
                            error={Boolean(errores.rolesVacantes && !rolId)}
                          />
                        </div>
                      ))}
                    </div>

                    {errores.rolesVacantes && (
                      <p className="mt-2 text-xs text-ganker-error">
                        {errores.rolesVacantes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
        </div>
      )}

      {errorEnvio && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-ganker-error/30 bg-ganker-error/10 px-4 py-3"
        >
          <p className="text-sm text-ganker-error">{errorEnvio}</p>
        </div>
      )}

      <div className="mt-8 border-t border-white/10 pt-6">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/app/equipos"
            className="rounded-xl border border-white/10 px-5 py-3 text-center text-sm font-semibold text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={enviando || sinJuego}
            className="rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? "Creando equipo..." : "Crear equipo"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CrearEquipoFormComponent;
