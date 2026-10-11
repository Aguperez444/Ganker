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
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-ganker-purple-light transition hover:bg-ganker-purple/20 hover:text-ganker-text"
              >
                Modificar
              </button>

              <button
                type="button"
                onClick={() => onDelete(region)}
                disabled={deletingRegionId === region.id}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-ganker-error transition hover:bg-ganker-error/10 disabled:cursor-not-allowed disabled:opacity-50"
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
