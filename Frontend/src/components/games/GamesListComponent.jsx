const GameListComponent = ({
  games,
  isLoading,
  error,
  selectedGameId,
  onEdit,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-ganker-surface-light p-6">
        <p className="text-sm text-ganker-muted">Cargando videojuegos...</p>
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

  if (games.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-ganker-surface-light p-6">
        <p className="text-sm text-ganker-muted">
          Todavía no hay videojuegos registrados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <ul className="divide-y divide-white/10">
        {games.map((game) => (
          <li
            key={game.id}
            className={[
              "flex items-center justify-between gap-4 px-5 py-4 transition",
              selectedGameId === game.id
                ? "bg-ganker-purple/20"
                : "bg-ganker-surface-light hover:bg-white/5",
            ].join(" ")}
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-ganker-text">
                {game.name}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onEdit(game)}
              className="shrink-0 cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-ganker-purple-light transition hover:bg-ganker-purple/20 hover:text-ganker-text"
            >
              Modificar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GameListComponent;
