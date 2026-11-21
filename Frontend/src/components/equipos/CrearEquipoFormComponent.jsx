import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Campo from "../common/CampoFormularioComponent";
import IconSelectComponent from "../common/IconSelectComponent";
import Seccion from "../common/SeccionFormularioComponent";
import {
  CUPOS_VACANTES_MAXIMO,
  CUPOS_VACANTES_MINIMO,
  LARGO_MAXIMO_DESCRIPCION_EQUIPO,
  LARGO_MAXIMO_NOMBRE_EQUIPO,
  TAMANO_MAXIMO_ICONO_EQUIPO_MB,
  TIPOS_IMAGEN_ICONO_EQUIPO,
} from "../../utils/validacionesEquipos";

const CLASES_CONTROL =
  "w-full rounded-lg border bg-ganker-surface-light px-4 py-3 text-ganker-text outline-none transition-all duration-200 placeholder:text-ganker-muted focus:border-ganker-purple-light focus:ring-2 focus:ring-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50";

const clasesControl = (error) =>
  `${CLASES_CONTROL} ${error ? "border-ganker-error" : "border-white/10"}`;

const OPCIONES_CUPOS = Array.from(
  { length: CUPOS_VACANTES_MAXIMO - CUPOS_VACANTES_MINIMO + 1 },
  (_, indice) => CUPOS_VACANTES_MINIMO + indice
);

// US 14 - Crear equipo.
// Solo presentacion: el estado y las reglas viven en useCrearEquipo.
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
  onIconoChange,
  onQuitarIcono,
  onCantidadVacantesChange,
  onRolVacanteChange,
  onSubmit,
}) => {
  const sinJuego = !formulario.videojuegoId;
  const catalogoDeshabilitado = sinJuego || cargandoCatalogos || enviando;

  // Vista previa del icono elegido; la URL temporal se libera al cambiarlo.
  const previewIcono = useMemo(
    () => (formulario.icono ? URL.createObjectURL(formulario.icono) : null),
    [formulario.icono]
  );
  useEffect(
    () => () => {
      if (previewIcono) URL.revokeObjectURL(previewIcono);
    },
    [previewIcono]
  );

  const handleSeleccionarIcono = (event) => {
    onIconoChange(event.target.files?.[0] ?? null);
    // Permite volver a elegir el mismo archivo despues de quitarlo.
    event.target.value = "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6 rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6"
    >
      <Seccion
        titulo="Datos de la sala"
        descripcion="Así van a ver tu equipo los jugadores que busquen uno."
      >
        <Campo
          id="equipo-nombre"
          label="Nombre del equipo"
          obligatorio
          error={errores.nombre}
        >
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
        </Campo>

        <Campo
          id="equipo-descripcion"
          label="Mensaje de búsqueda"
          error={errores.descripcion}
          ayuda="Contá qué buscan: horarios, objetivos, estilo de juego."
        >
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
        </Campo>

        <Campo
          id="equipo-icono"
          label="Imagen del equipo"
          error={errores.icono}
          ayuda={`Opcional. PNG, JPG o WEBP de hasta ${TAMANO_MAXIMO_ICONO_EQUIPO_MB} MB. Si no subís una, se usa la imagen por defecto.`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-ganker-surface-light">
              {previewIcono ? (
                <img
                  src={previewIcono}
                  alt="Vista previa de la imagen del equipo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg
                  className="h-7 w-7 text-ganker-muted"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="equipo-icono"
                className={`inline-flex items-center gap-2 rounded-lg border border-white/10 bg-ganker-surface-light px-3.5 py-2 font-heading text-xs font-bold text-ganker-text transition ${
                  enviando
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:border-ganker-orange/50 hover:bg-white/5"
                }`}
              >
                {previewIcono ? "Cambiar imagen" : "Subir imagen"}
              </label>

              {previewIcono && (
                <button
                  type="button"
                  onClick={onQuitarIcono}
                  disabled={enviando}
                  className="cursor-pointer rounded-lg border border-ganker-error/30 bg-ganker-error/10 px-3 py-2 font-heading text-xs font-semibold text-ganker-error transition hover:bg-ganker-error/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Quitar imagen
                </button>
              )}

              <input
                id="equipo-icono"
                type="file"
                accept={TIPOS_IMAGEN_ICONO_EQUIPO.join(",")}
                onChange={handleSeleccionarIcono}
                disabled={enviando}
                className="sr-only"
              />
            </div>
          </div>
        </Campo>
      </Seccion>

      <Seccion titulo="Videojuego y región">
        <Campo
          id="equipo-videojuego"
          label="Videojuego"
          obligatorio
          error={errores.videojuego}
          ayuda="Solo aparecen los videojuegos en los que tenés perfil."
        >
          <IconSelectComponent
            id="equipo-videojuego"
            value={formulario.videojuegoId}
            onChange={onVideojuegoChange}
            options={perfiles.map((perfil) => perfil.videogame)}
            placeholder="Seleccioná un videojuego"
            disabled={enviando}
            error={Boolean(errores.videojuego)}
          />
        </Campo>

        {errorCatalogos && (
          <p className="text-sm text-ganker-error">{errorCatalogos}</p>
        )}

        <Campo id="equipo-region" label="Región" error={errores.region}>
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
              <option key={region.region_id} value={region.region_id}>
                {region.name}
              </option>
            ))}
          </select>
        </Campo>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-ganker-surface-light px-4 py-3">
          <input
            type="checkbox"
            checked={formulario.admiteOtrasRegiones}
            onChange={(e) =>
              onCampoChange("admiteOtrasRegiones", e.target.checked, "region")
            }
            disabled={enviando}
            className="mt-0.5 h-4 w-4 accent-ganker-purple"
          />
          <span>
            <span className="block text-sm font-medium text-ganker-text">
              Admitir jugadores de otras regiones
            </span>
            <span className="block text-xs text-ganker-muted">
              Si no lo marcás, solo pueden unirse jugadores de la región del
              equipo.
            </span>
          </span>
        </label>
      </Seccion>

      <Seccion
        titulo="Rango permitido"
        descripcion="Solo pueden unirse jugadores con un rango entre estos dos. El tuyo también tiene que estar adentro."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            id="equipo-rango-minimo"
            label="Rango mínimo"
            obligatorio
            error={errores.rangoMinimo}
          >
            <IconSelectComponent
              id="equipo-rango-minimo"
              value={formulario.rangoMinimoId}
              onChange={(rangoId) =>
                onCampoChange("rangoMinimoId", rangoId, "rangoMinimo")
              }
              options={rangos}
              getOptionId={(rango) => rango.rank_id}
              placeholder="Seleccioná un rango"
              disabled={catalogoDeshabilitado}
              error={Boolean(errores.rangoMinimo)}
            />
          </Campo>

          <Campo
            id="equipo-rango-maximo"
            label="Rango máximo"
            obligatorio
            error={errores.rangoMaximo}
          >
            <IconSelectComponent
              id="equipo-rango-maximo"
              value={formulario.rangoMaximoId}
              onChange={(rangoId) =>
                onCampoChange("rangoMaximoId", rangoId, "rangoMaximo")
              }
              options={rangos}
              getOptionId={(rango) => rango.rank_id}
              placeholder="Seleccioná un rango"
              disabled={catalogoDeshabilitado}
              error={Boolean(errores.rangoMaximo)}
            />
          </Campo>
        </div>
      </Seccion>

      <Seccion
        titulo="Integrantes"
        descripcion="Vos ocupás el primer lugar como líder. Elegí qué roles buscás para el resto."
      >
        <Campo
          id="equipo-rol-creador"
          label="Tu rol en el equipo"
          obligatorio
          error={errores.rolCreador}
          ayuda="Solo los roles de tu perfil de juego, con tu rango en cada uno."
        >
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
        </Campo>

        <Campo
          id="equipo-cupos"
          label="Cupos vacantes"
          obligatorio
          ayuda="Sin contarte a vos."
        >
          {/* Select y no input numerico: asi la cantidad nunca queda vacia o
              fuera de rango mientras el jugador la edita. */}
          <select
            id="equipo-cupos"
            value={formulario.rolesVacantesIds.length}
            onChange={(e) => onCantidadVacantesChange(Number(e.target.value))}
            disabled={enviando}
            className={`${clasesControl(false)} sm:w-32`}
          >
            {OPCIONES_CUPOS.map((cantidad) => (
              <option key={cantidad} value={cantidad}>
                {cantidad}
              </option>
            ))}
          </select>
        </Campo>

        <div className="grid gap-3 sm:grid-cols-2">
          {formulario.rolesVacantesIds.map((rolId, indice) => (
            <Campo
              key={indice}
              id={`equipo-cupo-${indice}`}
              label={`Rol del cupo ${indice + 1}`}
              obligatorio
            >
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
            </Campo>
          ))}
        </div>

        {errores.rolesVacantes && (
          <p className="text-xs text-ganker-error">{errores.rolesVacantes}</p>
        )}
      </Seccion>

      {errorEnvio && (
        <div
          role="alert"
          className="rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3"
        >
          <p className="text-sm text-ganker-error">{errorEnvio}</p>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
        <Link
          to="/app/equipos"
          className="rounded-xl border border-white/10 px-5 py-3 text-center text-sm font-semibold text-ganker-muted transition hover:bg-white/5 hover:text-ganker-text"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={enviando}
          className="rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? "Creando equipo..." : "Crear equipo"}
        </button>
      </div>
    </form>
  );
};

export default CrearEquipoFormComponent;
