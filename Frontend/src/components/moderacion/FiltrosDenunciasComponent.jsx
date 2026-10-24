import { MOTIVOS_REPORTE } from "../../utils/reportesJugadores";

const ESTADOS_DENUNCIA = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "resolved", label: "Resuelto" },
];

const FiltrosDenunciasComponent = ({
  filtros,
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
          <label className="mb-1 block text-xs font-semibold text-ganker-text">
            Usuario reportado
          </label>
          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={filtros.denunciado}
            onChange={(e) => onChange("denunciado", e.target.value)}
            placeholder="Nombre de usuario"
            className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2 text-sm text-ganker-text focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ganker-text">
            Usuario que reportó
          </label>
          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={filtros.denunciante}
            onChange={(e) => onChange("denunciante", e.target.value)}
            placeholder="Nombre de usuario"
            className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2 text-sm text-ganker-text focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ganker-text">
            Resuelto por
          </label>
          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={filtros.resueltoPor}
            onChange={(e) => onChange("resueltoPor", e.target.value)}
            placeholder="Nombre de usuario admin"
            className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2 text-sm text-ganker-text focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ganker-text">
            Estado
          </label>
          <select
            value={filtros.estado}
            onChange={(e) => onChange("estado", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2 text-sm text-ganker-text focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none"
          >
            {ESTADOS_DENUNCIA.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ganker-text">
            Motivo
          </label>
          <select
            value={filtros.motivo}
            onChange={(e) => onChange("motivo", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2 text-sm text-ganker-text focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none"
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-ganker-text">
            Creación desde
          </label>
          <input
            type="datetime-local"
            value={filtros.fechaCreacionDesde}
            onChange={(e) => onChange("fechaCreacionDesde", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2 text-sm text-ganker-text focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ganker-text">
            Creación hasta
          </label>
          <input
            type="datetime-local"
            value={filtros.fechaCreacionHasta}
            onChange={(e) => onChange("fechaCreacionHasta", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2 text-sm text-ganker-text focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ganker-text">
            Resolución desde
          </label>
          <input
            type="datetime-local"
            value={filtros.fechaResolucionDesde}
            onChange={(e) => onChange("fechaResolucionDesde", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2 text-sm text-ganker-text focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ganker-text">
            Resolución hasta
          </label>
          <input
            type="datetime-local"
            value={filtros.fechaResolucionHasta}
            onChange={(e) => onChange("fechaResolucionHasta", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2 text-sm text-ganker-text focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={cargando}
          className="cursor-pointer rounded-lg bg-gradient-to-r from-ganker-orange via-ganker-orange-light to-ganker-purple px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cargando ? "Buscando..." : "Buscar"}
        </button>
        <button
          type="button"
          onClick={onLimpiar}
          className="cursor-pointer rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-ganker-text transition hover:bg-white/5"
        >
          Limpiar
        </button>
      </div>
    </form>
  );
};

export default FiltrosDenunciasComponent;
