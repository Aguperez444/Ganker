import CampoTexto from "../common/CampoTexto";
import IconSelectComponent from "../common/IconSelectComponent";
import { OPCIONES_VACANTES_MINIMAS } from "../../hooks/useBuscarEquipos";

const CLASES_ETIQUETA =
  "mb-2 block text-xs font-semibold text-ganker-muted uppercase";

const CLASES_SELECT =
  "w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2.5 text-sm text-ganker-text outline-none transition focus:border-ganker-purple-light";

// US 17 - Buscar equipos: filtros del listado. Recibe lo que devuelve
// useBuscarEquipos (mismo esquema que los filtros de Buscar jugadores).
const FiltrosEquiposComponent = ({ busqueda }) => {
  const {
    videojuegos,
    cargandoVideojuegos,
    errorVideojuegos,
    videojuegoId,
    seleccionarVideojuego,
    regiones,
    rangos,
    roles,
    cargandoCatalogos,
    errorCatalogos,
    filtros,
    cambiarFiltro,
    limpiarFiltros,
    hayFiltrosOpcionales,
  } = busqueda;

  return (
    <div className="rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
      <div>
        <label className="mb-3 block text-sm font-semibold text-ganker-text">
          Videojuego
        </label>

        {cargandoVideojuegos ? (
          <p className="text-sm text-ganker-muted">Cargando videojuegos...</p>
        ) : (
          <div className="max-w-sm">
            <IconSelectComponent
              value={videojuegoId}
              onChange={seleccionarVideojuego}
              options={videojuegos}
              placeholder="Seleccioná un videojuego"
              getOptionId={(juego) => juego.id}
            />
          </div>
        )}

        {errorVideojuegos && (
          <p className="mt-2 text-sm text-ganker-error">{errorVideojuegos}</p>
        )}
      </div>

      {videojuegoId && (
        <div className="mt-6 border-t border-white/10 pt-6">
          {cargandoCatalogos ? (
            <p className="text-sm text-ganker-muted">
              Cargando regiones, rangos y roles...
            </p>
          ) : errorCatalogos ? (
            <p className="text-sm text-ganker-error">{errorCatalogos}</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <CampoTexto
                  label="Buscar"
                  placeholder="Nombre o descripción del equipo..."
                  value={filtros.texto}
                  onChange={(e) => cambiarFiltro("texto", e.target.value)}
                />

                <div>
                  <label htmlFor="filtro-region" className={CLASES_ETIQUETA}>
                    Región
                  </label>
                  <select
                    id="filtro-region"
                    value={filtros.regionId}
                    onChange={(e) => cambiarFiltro("regionId", e.target.value)}
                    className={CLASES_SELECT}
                  >
                    <option value="">Cualquiera</option>
                    {regiones.map((region) => (
                      <option key={region.region_id} value={region.region_id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={CLASES_ETIQUETA}>Rango</label>
                  <IconSelectComponent
                    value={filtros.rangoId}
                    onChange={(valor) => cambiarFiltro("rangoId", valor)}
                    options={rangos}
                    placeholder="Cualquiera"
                    incluirOpcionCualquiera
                    getOptionId={(rango) => rango.rank_id}
                  />
                </div>

                <div>
                  <label className={CLASES_ETIQUETA}>Rol buscado</label>
                  <IconSelectComponent
                    value={filtros.rolId}
                    onChange={(valor) => cambiarFiltro("rolId", valor)}
                    options={roles}
                    placeholder="Cualquiera"
                    incluirOpcionCualquiera
                    getOptionId={(rol) => rol.role_id}
                  />
                </div>

                <div>
                  <label htmlFor="filtro-vacantes" className={CLASES_ETIQUETA}>
                    Vacantes libres
                  </label>
                  <select
                    id="filtro-vacantes"
                    value={filtros.vacantesMinimas}
                    onChange={(e) =>
                      cambiarFiltro("vacantesMinimas", e.target.value)
                    }
                    className={CLASES_SELECT}
                  >
                    {OPCIONES_VACANTES_MINIMAS.map((cantidad) => (
                      <option key={cantidad} value={cantidad}>
                        {cantidad === "1" ? "Al menos 1" : `${cantidad} o más`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  disabled={!hayFiltrosOpcionales}
                  className="text-sm font-semibold text-ganker-purple-light transition hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Limpiar filtros
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FiltrosEquiposComponent;
