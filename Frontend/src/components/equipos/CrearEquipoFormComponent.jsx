import { Link } from "react-router-dom";
import Campo from "../common/CampoFormularioComponent";
import Seccion from "../common/SeccionFormularioComponent";
import {
  CUPOS_VACANTES_MAXIMO,
  CUPOS_VACANTES_MINIMO,
  LARGO_MAXIMO_DESCRIPCION_EQUIPO,
  LARGO_MAXIMO_NOMBRE_EQUIPO,
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
  onCantidadVacantesChange,
  onRolVacanteChange,
  onSubmit,
}) => {
  const sinJuego = !formulario.videojuegoId;
  const catalogoDeshabilitado = sinJuego || cargandoCatalogos || enviando;

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
      </Seccion>

      <Seccion titulo="Videojuego y región">
        <Campo
          id="equipo-videojuego"
          label="Videojuego"
          obligatorio
          error={errores.videojuego}
          ayuda="Solo aparecen los videojuegos en los que tenés perfil."
        >
          <select
            id="equipo-videojuego"
            value={formulario.videojuegoId}
            onChange={(e) => onVideojuegoChange(e.target.value)}
            disabled={enviando}
            className={clasesControl(errores.videojuego)}
          >
            <option value="" disabled>
              Seleccioná un videojuego
            </option>
            {perfiles.map((perfil) => (
              <option key={perfil.videogame.id} value={perfil.videogame.id}>
                {perfil.videogame.name}
              </option>
            ))}
          </select>
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
            <select
              id="equipo-rango-minimo"
              value={formulario.rangoMinimoId}
              onChange={(e) =>
                onCampoChange("rangoMinimoId", e.target.value, "rangoMinimo")
              }
              disabled={catalogoDeshabilitado}
              className={clasesControl(errores.rangoMinimo)}
            >
              <option value="" disabled>
                Seleccioná un rango
              </option>
              {rangos.map((rango) => (
                <option key={rango.rank_id} value={rango.rank_id}>
                  {rango.name}
                </option>
              ))}
            </select>
          </Campo>

          <Campo
            id="equipo-rango-maximo"
            label="Rango máximo"
            obligatorio
            error={errores.rangoMaximo}
          >
            <select
              id="equipo-rango-maximo"
              value={formulario.rangoMaximoId}
              onChange={(e) =>
                onCampoChange("rangoMaximoId", e.target.value, "rangoMaximo")
              }
              disabled={catalogoDeshabilitado}
              className={clasesControl(errores.rangoMaximo)}
            >
              <option value="" disabled>
                Seleccioná un rango
              </option>
              {rangos.map((rango) => (
                <option key={rango.rank_id} value={rango.rank_id}>
                  {rango.name}
                </option>
              ))}
            </select>
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
          <select
            id="equipo-rol-creador"
            value={formulario.rolCreadorId}
            onChange={(e) =>
              onCampoChange("rolCreadorId", e.target.value, "rolCreador")
            }
            disabled={catalogoDeshabilitado}
            className={clasesControl(errores.rolCreador)}
          >
            <option value="" disabled>
              Seleccioná tu rol
            </option>
            {rolesDelJugador.map((perfilRol) => (
              <option
                key={perfilRol.role_profile_id}
                value={perfilRol.role.role_id}
              >
                {perfilRol.role.name} ({perfilRol.rank.name})
              </option>
            ))}
          </select>
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
              <select
                id={`equipo-cupo-${indice}`}
                value={rolId}
                onChange={(e) => onRolVacanteChange(indice, e.target.value)}
                disabled={catalogoDeshabilitado}
                className={clasesControl(errores.rolesVacantes && !rolId)}
              >
                <option value="" disabled>
                  Seleccioná un rol
                </option>
                {roles.map((rol) => (
                  <option key={rol.role_id} value={rol.role_id}>
                    {rol.name}
                  </option>
                ))}
              </select>
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
