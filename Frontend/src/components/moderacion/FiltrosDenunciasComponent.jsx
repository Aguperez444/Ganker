import { MOTIVOS_REPORTE } from "../../utils/reportesJugadores";

const ESTADOS_DENUNCIA = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "resolved", label: "Resuelto" },
  { value: "rejected", label: "Rechazado" },
];

const CLASES_INPUT =
  "w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2 text-sm text-ganker-text focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

const FiltrosDenunciasComponent = ({
  filtros,
  errores = {},
  cargando = false,
  onChange,
  onBuscar,
  onLimpiar,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onBuscar();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label
            htmlFor="denuncias-denunciado"
            className="mb-1 block text-xs font-semibold text-ganker-text"
          >
            Usuario reportado
          </label>

          <input
            id="denuncias-denunciado"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={filtros.denunciado}
            onChange={(e) => onChange("denunciado", e.target.value)}
            placeholder="Nombre de usuario"
            disabled={cargando}
            className={CLASES_INPUT}
          />
        </div>

        <div>
          <label
            htmlFor="denuncias-denunciante"
            className="mb-1 block text-xs font-semibold text-ganker-text"
          >
            Usuario que reportó
          </label>

          <input
            id="denuncias-denunciante"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={filtros.denunciante}
            onChange={(e) => onChange("denunciante", e.target.value)}
            placeholder="Nombre de usuario"
            disabled={cargando}
            className={CLASES_INPUT}
          />
        </div>

        <div>
          <label
            htmlFor="denuncias-resuelto-por"
            className="mb-1 block text-xs font-semibold text-ganker-text"
          >
            Resuelto por
          </label>

          <input
            id="denuncias-resuelto-por"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={filtros.resueltoPor}
            onChange={(e) => onChange("resueltoPor", e.target.value)}
            placeholder="Nombre de usuario admin"
            disabled={cargando}
            className={CLASES_INPUT}
          />
        </div>

        <div>
          <label
            htmlFor="denuncias-estado"
            className="mb-1 block text-xs font-semibold text-ganker-text"
          >
            Estado
          </label>

          <select
            id="denuncias-estado"
            value={filtros.estado}
            onChange={(e) => onChange("estado", e.target.value)}
            disabled={cargando}
            className={CLASES_INPUT}
          >
            {ESTADOS_DENUNCIA.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="denuncias-motivo"
            className="mb-1 block text-xs font-semibold text-ganker-text"
          >
            Motivo
          </label>

          <select
            id="denuncias-motivo"
            value={filtros.motivo}
            onChange={(e) => onChange("motivo", e.target.value)}
            disabled={cargando}
            className={CLASES_INPUT}
          >
            <option value="">Todos</option>

            {MOTIVOS_REPORTE.map((motivo) => (
              <option key={motivo.value} value={motivo.value}>
                {motivo.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="denuncias-creacion-desde"
                className="mb-1 block text-xs font-semibold text-ganker-text"
              >
                Creación desde
              </label>

              <input
                id="denuncias-creacion-desde"
                type="datetime-local"
                value={filtros.fechaCreacionDesde}
                max={filtros.fechaCreacionHasta || undefined}
                onChange={(e) => onChange("fechaCreacionDesde", e.target.value)}
                disabled={cargando}
                className={CLASES_INPUT}
              />
            </div>

            <div>
              <label
                htmlFor="denuncias-creacion-hasta"
                className="mb-1 block text-xs font-semibold text-ganker-text"
              >
                Creación hasta
              </label>

              <input
                id="denuncias-creacion-hasta"
                type="datetime-local"
                value={filtros.fechaCreacionHasta}
                min={filtros.fechaCreacionDesde || undefined}
                onChange={(e) => onChange("fechaCreacionHasta", e.target.value)}
                disabled={cargando}
                className={CLASES_INPUT}
              />
            </div>
          </div>

          {errores.fechaCreacion && (
            <p className="mt-1 text-xs text-ganker-error">
              {errores.fechaCreacion}
            </p>
          )}
        </div>

        <div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="denuncias-resolucion-desde"
                className="mb-1 block text-xs font-semibold text-ganker-text"
              >
                Resolución desde
              </label>

              <input
                id="denuncias-resolucion-desde"
                type="datetime-local"
                value={filtros.fechaResolucionDesde}
                max={filtros.fechaResolucionHasta || undefined}
                onChange={(e) =>
                  onChange("fechaResolucionDesde", e.target.value)
                }
                disabled={cargando}
                className={CLASES_INPUT}
              />
            </div>

            <div>
              <label
                htmlFor="denuncias-resolucion-hasta"
                className="mb-1 block text-xs font-semibold text-ganker-text"
              >
                Resolución hasta
              </label>

              <input
                id="denuncias-resolucion-hasta"
                type="datetime-local"
                value={filtros.fechaResolucionHasta}
                min={filtros.fechaResolucionDesde || undefined}
                onChange={(e) =>
                  onChange("fechaResolucionHasta", e.target.value)
                }
                disabled={cargando}
                className={CLASES_INPUT}
              />
            </div>
          </div>

          {errores.fechaResolucion && (
            <p className="mt-1 text-xs text-ganker-error">
              {errores.fechaResolucion}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onLimpiar}
          disabled={cargando}
          className="cursor-pointer rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-ganker-text transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Limpiar
        </button>

        <button
          type="submit"
          disabled={cargando}
          className="cursor-pointer rounded-lg bg-gradient-to-r from-ganker-orange via-ganker-orange-light to-ganker-purple px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cargando ? "Buscando..." : "Buscar"}
        </button>
      </div>
    </form>
  );
};

export default FiltrosDenunciasComponent;
