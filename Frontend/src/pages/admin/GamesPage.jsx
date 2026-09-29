import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GameForm from "../../components/games/GameFormComponent";
import GameListComponent from "../../components/games/GamesListComponent";
import useGames from "../../hooks/useGames";

// Cada boton lleva el juego al state de la navegacion, asi la pagina de
// destino lo elige en su desplegable y arranca a mostrar esa lista.
const RUTAS_POR_JUEGO = {
  onEditRanks: "/app/admin/ranks",
  onEditRoles: "/app/admin/roles",
  onEditCharacters: "/app/admin/characters",
};

const GamesPage = () => {
  const navigate = useNavigate();

  // "create" | "edit" | null
  const [mode, setMode] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [hasSeenMessage, setHasSeenMessage] = useState(false);

  const {
    games,
    isLoading,
    isSaving,
    error,
    actionError,
    registerGame,
    editGame,
    clearActionError,
  } = useGames();

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setHasSeenMessage(false);
  };

  const handleOpenRegister = () => {
    clearActionError();
    setSuccessMessage("");
    setSelectedGame(null);
    setMode("create");
  };

  const handleOpenEdit = (game) => {
    clearActionError();
    setSuccessMessage("");
    setSelectedGame(game);
    setMode("edit");
  };

  const navigateToGamePage = (ruta) => (game) => {
    navigate(ruta, { state: { videogameId: game.id } });
  };

  const handleOpenRanks = navigateToGamePage(RUTAS_POR_JUEGO.onEditRanks);
  const handleOpenRoles = navigateToGamePage(RUTAS_POR_JUEGO.onEditRoles);
  const handleOpenCharacters = navigateToGamePage(
    RUTAS_POR_JUEGO.onEditCharacters
  );

  const handleCancel = () => {
    clearActionError();
    setMode(null);
    setSelectedGame(null);
  };

  const handleRegister = async (gameData) => {
    const success = await registerGame(gameData);
    if (!success) return;

    const gameName = typeof gameData === "object" ? gameData.name : gameData;
    showSuccess(`Videojuego "${gameName}" registrado correctamente.`);
    setMode(null);
  };

  const handleEdit = async (gameData) => {
    if (!selectedGame) return;

    const success = await editGame(selectedGame.id, gameData);
    if (!success) return;

    const gameName = typeof gameData === "object" ? gameData.name : gameData;
    showSuccess(`Videojuego "${gameName}" modificado correctamente.`);
    setMode(null);
    setSelectedGame(null);
  };

  return (
    <section className="min-h-full bg-ganker-bg p-6">
      <div className="mx-auto w-full max-w-6xl">
        <header>
          <p className="text-xs font-semibold tracking-[0.15em] text-ganker-purple-light uppercase">
            Administración
          </p>

          <h1 className="mt-2 font-heading text-3xl font-bold text-ganker-text">
            Videojuegos
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-ganker-muted">
            Gestioná los videojuegos disponibles en Ganker y sus roles, rangos y
            personajes asociados.
          </p>
        </header>

        {successMessage && (
          <div className="mt-6 rounded-lg border border-ganker-success/20 bg-ganker-success/10 px-4 py-3 transition-colors">
            <p
              onMouseEnter={() => setHasSeenMessage(true)}
              className={`text-sm font-semibold cursor-default text-ganker-success ${
                !hasSeenMessage ? "animate-success-pulse" : ""
              }`}
            >
              ✓ {successMessage}
            </p>
          </div>
        )}

        <div
          className={`mt-8 grid gap-6 ${
            mode ? "lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]" : "grid-cols-1"
          }`}
        >
          <section className="min-w-0 rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl">
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
                onClick={handleOpenRegister}
                disabled={isSaving}
                className="cursor-pointer rounded-lg bg-gradient-to-r from-ganker-orange via-ganker-orange-light to-ganker-purple px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Registrar videojuego
              </button>
            </div>

            <GameListComponent
              games={games}
              isLoading={isLoading}
              error={error}
              selectedGameId={selectedGame?.id}
              onEdit={handleOpenEdit}
              onEditRanks={handleOpenRanks}
              onEditRoles={handleOpenRoles}
              onEditCharacters={handleOpenCharacters}
            />
          </section>

          {/* Formulario para Crear Videojuego */}
          {mode === "create" && (
            <GameForm
              key="create"
              mode="create"
              isLoading={isSaving}
              error={actionError}
              onSubmit={handleRegister}
              onCancel={handleCancel}
            />
          )}

          {/* Formulario para Editar Videojuego */}
          {mode === "edit" && selectedGame && (
            <GameForm
              key={`edit-${selectedGame.id}`}
              mode="edit"
              initialName={selectedGame.name}
              initialIconUrl={selectedGame.icon_url}
              initialRankPerRole={selectedGame.rank_per_role}
              isLoading={isSaving}
              error={actionError}
              onSubmit={handleEdit}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default GamesPage;
