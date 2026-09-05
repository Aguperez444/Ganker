import GameListComponent from "../../components/games/GamesListComponent";
import useGames from "../../hooks/useGames";

const GamesPage = () => {
  const { games, isLoading, error } = useGames();

  return (
    <section className="min-h-full bg-ganker-bg p-6">
      <div className="mx-auto w-full max-w-5xl">
        <header>
          <p className="text-xs font-semibold tracking-[0.15em] text-ganker-purple-light uppercase">
            Administración
          </p>

          <h1 className="mt-2 font-heading text-3xl font-bold text-ganker-text">
            Videojuegos
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-ganker-muted">
            Gestioná los videojuegos disponibles en Ganker.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-xl font-semibold text-ganker-text">
                Videojuegos soportados
              </h2>

              <p className="mt-1 text-sm text-ganker-muted">
                {games.length} videojuegos registrados
              </p>
            </div>

            <button
              type="button"
              className="cursor-pointer rounded-lg bg-gradient-to-r from-ganker-orange via-ganker-orange-light to-ganker-purple px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-ganker-purple/30"
            >
              + Registrar videojuego
            </button>
          </div>

          <GameListComponent
            games={games}
            isLoading={isLoading}
            error={error}
          />
        </section>
      </div>
    </section>
  );
};

export default GamesPage;
