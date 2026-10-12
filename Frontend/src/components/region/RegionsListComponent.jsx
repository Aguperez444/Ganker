import {
  CLASES_BOTON_ELIMINAR,
  CLASES_BOTON_MODIFICAR,
} from "../common/botonesAccion";
const RegionsListComponent = ({
  regions,
  isLoading,
  error,
  selectedRegionId,
  deletingRegionId,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-ganker-surface-light p-6">
        <p className="text-sm text-ganker-muted">Cargando regiones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-ganker-error/20 bg-ganker-error/10 p-6">
        <p className="text-sm text-ganker-error">{error}</p>
      </div>
    );
  }

  if (regions.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-ganker-surface-light p-6">
        <p className="text-sm text-ganker-muted">
          Este videojuego todavía no tiene regiones registradas.
        </p>
      </div>
    );
  }

  const sortedRegions = [...regions].sort((a, b) =>
    a.name.localeCompare(b.name, "es", {
      sensitivity: "base",
    })
  );

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <ul className="divide-y divide-white/10">
        {sortedRegions.map((region) => (
          <li
            key={region.id}
            className={[
              "flex flex-col gap-3 px-5 py-4 transition sm:flex-row sm:items-center sm:justify-between",
              selectedRegionId === region.id
                ? "bg-ganker-purple/20"
                : "bg-ganker-surface-light hover:bg-white/5",
            ].join(" ")}
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-ganker-text">
                {region.name}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(region)}
                className={CLASES_BOTON_MODIFICAR}
              >
                Modificar
              </button>

              <button
                type="button"
                onClick={() => onDelete(region)}
                disabled={deletingRegionId === region.id}
                className={CLASES_BOTON_ELIMINAR}
              >
                {deletingRegionId === region.id ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RegionsListComponent;
