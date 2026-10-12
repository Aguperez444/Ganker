import { useEffect, useState } from "react";
import IconSelectComponent from "../common/IconSelectComponent";
import { getRegionsByGame } from "../../api/regionApi";
import { getRanksByGame } from "../../api/rankApi";

const LARGO_MAXIMO_NOMBRE = 100;
const LARGO_MAXIMO_DESCRIPCION = 500;

// US 04 - Formulario de modificación de un equipo. Se monta solo cuando hay un
// equipo para editar (el padre lo renderiza condicionalmente), así el estado
// inicial se puede derivar directo de las props sin un efecto de sincronización.
//
// El videojuego no se puede cambiar: se muestra como dato fijo. Los catálogos
// de región y rango se cargan para el videojuego del equipo.
//
// Props:
//   - equipo: TeamSummaryResponse del equipo (nunca null).
//   - onGuardar(payload): dispara el PUT; el padre cierra el modal al éxito.
//   - onCancelar: cierra sin guardar.
//   - guardando: true mientras se procesa el PUT.
//   - errorExterno: mensaje de error del backend para mostrar.
function ModalEditarEquipoComponent({
  equipo,
  onGuardar,
  onCancelar,
  guardando = false,
  errorExterno = "",
}) {
  const [nombre, setNombre] = useState(equipo.team_name ?? "");
  const [descripcion, setDescripcion] = useState(equipo.description ?? "");
  const [allowOtherRegions, setAllowOtherRegions] = useState(
    Boolean(equipo.allow_other_regions)
  );
  const [regionId, setRegionId] = useState(
    equipo.region?.region_id ? String(equipo.region.region_id) : ""
  );
  const [minRankId, setMinRankId] = useState(
    equipo.min_rank?.rank_id ? String(equipo.min_rank.rank_id) : ""
  );
  const [maxRankId, setMaxRankId] = useState(
    equipo.max_rank?.rank_id ? String(equipo.max_rank.rank_id) : ""
  );

  const [regions, setRegions] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);
  const [catalogsError, setCatalogsError] = useState("");
  const [errores, setErrores] = useState({});

  const videogameId = equipo.videogame?.videogame_id;

  useEffect(() => {
    let cancelado = false;

    const cargarCatalogos = async () => {
      if (!videogameId) {
        setIsLoadingCatalogs(false);
        return;
      }

      try {
        setIsLoadingCatalogs(true);
        setCatalogsError("");

        const [gameRegions, gameRanks] = await Promise.all([
          getRegionsByGame(videogameId),
          getRanksByGame(videogameId),
        ]);

        if (cancelado) return;
        setRegions(gameRegions ?? []);
        setRanks(gameRanks ?? []);
      } catch (error) {
        console.error("Error al cargar los catálogos del equipo:", error);
        if (!cancelado) {
          setCatalogsError(
            "No se pudieron cargar las regiones y rangos del juego."
          );
        }
      } finally {
        if (!cancelado) setIsLoadingCatalogs(false);
      }
    };

    cargarCatalogos();
    return () => {
      cancelado = true;
    };
  }, [videogameId]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !guardando) {
        onCancelar();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [guardando, onCancelar]);

  const validar = () => {
    const nuevosErrores = {};
    const nombreLimpio = nombre.trim();

    if (!nombreLimpio) {
      nuevosErrores.nombre = "Ingresá un nombre para el equipo.";
    } else if (nombreLimpio.length > LARGO_MAXIMO_NOMBRE) {
      nuevosErrores.nombre = `El nombre no puede superar los ${LARGO_MAXIMO_NOMBRE} caracteres.`;
    }

    if (descripcion.trim().length > LARGO_MAXIMO_DESCRIPCION) {
      nuevosErrores.descripcion = `La descripción no puede superar los ${LARGO_MAXIMO_DESCRIPCION} caracteres.`;
    }

    if (!minRankId) nuevosErrores.minRank = "Elegí el rango mínimo.";
    if (!maxRankId) nuevosErrores.maxRank = "Elegí el rango máximo.";

    if (minRankId && maxRankId && !nuevosErrores.minRank && !nuevosErrores.maxRank) {
      const min = ranks.find(
        (rank) => String(rank.rank_id) === String(minRankId)
      );
      const max = ranks.find(
        (rank) => String(rank.rank_id) === String(maxRankId)
      );

      if (min && max && min.value > max.value) {
        nuevosErrores.maxRank =
          "El rango máximo no puede ser menor que el mínimo.";
      }
    }

    if (!regionId && !allowOtherRegions) {
      nuevosErrores.region =
        "Sin región, el equipo debe permitir jugadores de otras regiones.";
    }

    return nuevosErrores;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const validacion = validar();
    setErrores(validacion);
    if (Object.keys(validacion).length > 0) return;

    onGuardar({
      name: nombre.trim(),
      description: descripcion.trim() || null,
      allow_other_regions: allowOtherRegions,
      region_id: regionId ? Number(regionId) : null,
      min_rank_id: Number(minRankId),
      max_rank_id: Number(maxRankId),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-editar-equipo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={() => !guardando && onCancelar()}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3
          id="titulo-editar-equipo"
          className="font-heading text-lg font-bold text-ganker-text"
        >
          Modificar equipo
        </h3>
        <p className="mt-1 text-sm text-ganker-muted">
          Videojuego:{" "}
          <span className="font-semibold text-ganker-text">
            {equipo.videogame?.name ?? "—"}
          </span>{" "}
          (no se puede cambiar)
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="equipo-nombre"
              className="mb-1 block text-xs font-semibold tracking-wide text-ganker-text"
            >
              Nombre
            </label>
            <input
              id="equipo-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={LARGO_MAXIMO_NOMBRE}
              className={`w-full rounded-lg border bg-ganker-surface px-3 py-2.5 text-sm text-ganker-text placeholder:text-ganker-muted focus:outline-none focus:ring-2 focus:ring-ganker-purple ${
                errores.nombre ? "border-ganker-error" : "border-ganker-purple"
              }`}
            />
            {errores.nombre && (
              <p className="mt-1 text-xs text-ganker-error">{errores.nombre}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="equipo-descripcion"
              className="mb-1 block text-xs font-semibold tracking-wide text-ganker-text"
            >
              Descripción
            </label>
            <textarea
              id="equipo-descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={LARGO_MAXIMO_DESCRIPCION}
              rows={3}
              className={`w-full resize-none rounded-lg border bg-ganker-surface px-3 py-2.5 text-sm text-ganker-text placeholder:text-ganker-muted focus:outline-none focus:ring-2 focus:ring-ganker-purple ${
                errores.descripcion
                  ? "border-ganker-error"
                  : "border-ganker-purple"
              }`}
              placeholder="Contá de qué se trata tu equipo..."
            />
            {errores.descripcion && (
              <p className="mt-1 text-xs text-ganker-error">
                {errores.descripcion}
              </p>
            )}
          </div>

          {isLoadingCatalogs ? (
            <p className="text-sm text-ganker-muted">
              Cargando regiones y rangos...
            </p>
          ) : catalogsError ? (
            <p className="text-sm text-ganker-error">{catalogsError}</p>
          ) : (
            <>
              <div>
                <label
                  htmlFor="equipo-region"
                  className="mb-1 block text-xs font-semibold tracking-wide text-ganker-text"
                >
                  Región
                </label>
                <select
                  id="equipo-region"
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value)}
                  className={`w-full rounded-xl border bg-ganker-surface-light px-3 py-3 text-sm text-ganker-text outline-none transition focus:border-ganker-purple-light ${
                    errores.region ? "border-ganker-error" : "border-white/10"
                  }`}
                >
                  <option value="">Sin región</option>
                  {regions.map((region) => (
                    <option key={region.region_id} value={region.region_id}>
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold tracking-wide text-ganker-text">
                    Rango mínimo
                  </label>
                  <IconSelectComponent
                    value={minRankId}
                    onChange={setMinRankId}
                    options={ranks}
                    placeholder="Elegí el mínimo"
                    getOptionId={(rank) => rank.rank_id}
                  />
                  {errores.minRank && (
                    <p className="mt-1 text-xs text-ganker-error">
                      {errores.minRank}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold tracking-wide text-ganker-text">
                    Rango máximo
                  </label>
                  <IconSelectComponent
                    value={maxRankId}
                    onChange={setMaxRankId}
                    options={ranks}
                    placeholder="Elegí el máximo"
                    getOptionId={(rank) => rank.rank_id}
                  />
                  {errores.maxRank && (
                    <p className="mt-1 text-xs text-ganker-error">
                      {errores.maxRank}
                    </p>
                  )}
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-ganker-surface-light px-4 py-3">
                <input
                  type="checkbox"
                  checked={allowOtherRegions}
                  onChange={(e) => setAllowOtherRegions(e.target.checked)}
                  className="h-4 w-4 accent-ganker-purple"
                />
                <span className="text-sm text-ganker-text">
                  Permitir jugadores de otras regiones
                </span>
              </label>
            </>
          )}

          {errorExterno && (
            <p role="alert" className="text-sm text-ganker-error">
              {errorExterno}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onCancelar}
              disabled={guardando}
              className="cursor-pointer rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-ganker-muted transition hover:bg-white/5 hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || isLoadingCatalogs || Boolean(catalogsError)}
              className="cursor-pointer rounded-lg bg-ganker-purple px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ganker-purple/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalEditarEquipoComponent;
