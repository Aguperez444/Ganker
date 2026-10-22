import { useState } from "react";
import GameForm from "../../components/games/GameFormComponent";
import GameListComponent from "../../components/games/GamesListComponent";
import ModalConfirmacionComponent from "../../components/common/ModalConfirmacionComponent";
import { useAuth } from "../../context/AuthContext";
import useGames from "../../hooks/useGames";
import { esOwner } from "../../utils/rutas";

// Admin de videojuegos: registrar, modificar y eliminar (US 23, solo owner).
const GamesPage = () => {
  const [mode, setMode] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameToDelete, setGameToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const { user } = useAuth();
  const puedeEliminar = esOwner(user);

  const {
    games,
    isLoading,
    isSaving,
    error,
    actionError,
    registerGame,
    editGame,
    removeGame,
    clearActionError,
  } = useGames();

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

  const handleCancel = () => {
    clearActionError();
    setMode(null);
    setSelectedGame(null);
  };

  const handleRegister = async (gameData) => {
    const success = await registerGame(gameData);

    if (!success) {
      return;
    }

    const gameName = typeof gameData === "object" ? gameData.name : gameData;
    setSuccessMessage(`Videojuego "${gameName}" registrado correctamente.`);

    setMode(null);
  };

  const handleEdit = async (gameData) => {
    if (!selectedGame) {
      return;
    }

    const success = await editGame(selectedGame.id, gameData);

    if (!success) {
      return;
    }

    const gameName = typeof gameData === "object" ? gameData.name : gameData;
    setSuccessMessage(`Videojuego "${gameName}" modificado correctamente.`);

    setMode(null);
    setSelectedGame(null);
  };

  const handleOpenDelete = (game) => {
    clearActionError();
    setSuccessMessage("");
    // Cerramos el formulario abierto para que no comparta el mensaje de
    // error con el modal ni quede editando un juego que se va a borrar.
    setMode(null);
    setSelectedGame(null);
    setGameToDelete(game);
  };

  const handleCancelDelete = () => {
    clearActionError();
    setGameToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!gameToDelete) {
      return;
    }

    const message = await removeGame(gameToDelete.id);

    if (!message) {
      return;
    }

    setSuccessMessage(message);
    setGameToDelete(null);
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
            Gestioná los videojuegos disponibles en Ganker.
          </p>
        </header>

        {successMessage && (
          <div className="mt-6 rounded-lg border border-ganker-success/20 bg-ganker-success/10 px-4 py-3">
            <p className="text-sm text-ganker-success">✓ {successMessage}</p>
          </div>
        )}

        <div
          className={`mt-8 grid gap-6 ${
            mode ? "lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]" : ""
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
              onDelete={puedeEliminar ? handleOpenDelete : undefined}
            />
          </section>

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

          {mode === "edit" && selectedGame && (
            <GameForm
              key={`edit-${selectedGame.id}`}
              mode="edit"
              initialName={selectedGame.name}
              initialIconUrl={selectedGame.icon_url}
              initialRankPerRole={selectedGame.rank_per_role}
              initialHasCharacters={selectedGame.has_characters}
              isLoading={isSaving}
              error={actionError}
              onSubmit={handleEdit}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>

      <ModalConfirmacionComponent
        isOpen={Boolean(gameToDelete)}
        title="Eliminar videojuego"
        message={
          <>
            <p>
              ¿Seguro que querés eliminar el videojuego{" "}
              <span className="font-semibold text-ganker-text">
                {gameToDelete?.name}
              </span>
              ?
            </p>
            <p className="mt-2">
              También se van a eliminar todos sus roles, rangos y personajes, y
              los perfiles de juego de los jugadores que lo juegan. El juego
              dejará de verse en el catálogo, las búsquedas y los perfiles de
              los jugadores. Esta acción no se puede deshacer.
            </p>
          </>
        }
        confirmLabel="Eliminar"
        isLoading={isSaving}
        error={actionError}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </section>
  );
};

export default GamesPage;
