import { useEffect } from "react";
import Campo from "../common/CampoFormularioComponent";
import {
  LARGO_MAXIMO_DESCRIPCION_EQUIPO,
  LARGO_MAXIMO_NOMBRE_EQUIPO,
} from "../../utils/validacionesEquipos";

const CLASES_CONTROL =
  "w-full rounded-lg border bg-ganker-surface-light px-4 py-3 text-ganker-text outline-none transition-all duration-200 placeholder:text-ganker-muted focus:border-ganker-purple-light focus:ring-2 focus:ring-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50";

const clasesControl = (error) =>
  `${CLASES_CONTROL} ${error ? "border-ganker-error" : "border-white/10"}`;

// US 15 - Modificar equipo. Mismos campos que Crear equipo salvo el
// videojuego, que se muestra pero no se puede cambiar, y los cupos. Solo
// presentacion: el estado y las reglas viven en useEditarEquipo.
const ModalEditarEquipoComponent = ({
  equipo,
  formulario,
  errores,
  rangos,
  regiones,
  cargandoCatalogos,
  errorCatalogos,
  enviando,
  errorEnvio,
  onCampoChange,
  onGuardar,
  onCancelar,
}) => {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && !enviando) onCancelar();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enviando, onCancelar]);

  const catalogoDeshabilitado = cargandoCatalogos || enviando;

  const handleSubmit = (event) => {
    event.preventDefault();
    onGuardar();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-editar-equipo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-2xl"
      >
        <div>
          <h3
            id="titulo-modal-editar-equipo"
            className="font-heading text-lg font-bold text-ganker-text"
          >
            Modificar equipo
          </h3>
          <p className="mt-1 text-sm text-ganker-muted">
            {equipo.videogame?.name} · El videojuego del equipo no se puede
            cambiar.
          </p>
        </div>

        <Campo
          id="editar-equipo-nombre"
          label="Nombre del equipo"
          obligatorio
          error={errores.nombre}
        >
          <input
            id="editar-equipo-nombre"
            type="text"
            value={formulario.nombre}
            onChange={(e) => onCampoChange("nombre", e.target.value)}
            maxLength={LARGO_MAXIMO_NOMBRE_EQUIPO}
            disabled={enviando}
            className={clasesControl(errores.nombre)}
          />
        </Campo>

        <Campo
          id="editar-equipo-descripcion"
          label="Mensaje de búsqueda"
          error={errores.descripcion}
        >
          <textarea
            id="editar-equipo-descripcion"
            rows={3}
            value={formulario.descripcion}
            onChange={(e) => onCampoChange("descripcion", e.target.value)}
            maxLength={LARGO_MAXIMO_DESCRIPCION_EQUIPO}
            disabled={enviando}
            className={`${clasesControl(errores.descripcion)} resize-y`}
          />
        </Campo>

        {errorCatalogos && (
          <p className="text-sm text-ganker-error">{errorCatalogos}</p>
        )}

        <Campo id="editar-equipo-region" label="Región" error={errores.region}>
          <select
            id="editar-equipo-region"
            value={formulario.regionId}
            onChange={(e) => onCampoChange("regionId", e.target.value)}
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
              onCampoChange("admiteOtrasRegiones", e.target.checked)
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            id="editar-equipo-rango-minimo"
            label="Rango mínimo"
            obligatorio
            error={errores.rangoMinimo}
          >
            <select
              id="editar-equipo-rango-minimo"
              value={formulario.rangoMinimoId}
              onChange={(e) => onCampoChange("rangoMinimoId", e.target.value)}
              disabled={catalogoDeshabilitado}
              className={clasesControl(errores.rangoMinimo || errores.rangos)}
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
            id="editar-equipo-rango-maximo"
            label="Rango máximo"
            obligatorio
            error={errores.rangoMaximo}
          >
            <select
              id="editar-equipo-rango-maximo"
              value={formulario.rangoMaximoId}
              onChange={(e) => onCampoChange("rangoMaximoId", e.target.value)}
              disabled={catalogoDeshabilitado}
              className={clasesControl(errores.rangoMaximo || errores.rangos)}
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

        {errores.rangos && (
          <p className="text-sm text-ganker-error">{errores.rangos}</p>
        )}

        {errorEnvio && (
          <div className="rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
            <p className="text-sm text-ganker-error">{errorEnvio}</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={enviando}
            className="cursor-pointer rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-ganker-muted transition hover:bg-white/5 hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando || cargandoCatalogos}
            className="cursor-pointer rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModalEditarEquipoComponent;
