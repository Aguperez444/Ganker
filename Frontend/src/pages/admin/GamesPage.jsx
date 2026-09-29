import { useState } from "react";
import GameForm from "../../components/games/GameFormComponent";
import GameListComponent from "../../components/games/GamesListComponent";
import RoleForm from "../../components/roles/RoleFormComponent"; // Asegúrate de tener este componente
import useGames from "../../hooks/useGames";
import useRoles from "../../hooks/useRoles"; // Hook de roles que armamos antes

const GamesPage = () => {
  const [mode, setMode] = useState(null); // "create", "edit", "roles", o null
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

  // Hook para la gestión de roles del juego seleccionado
  const {
    roles,
    isLoading: isLoadingRoles,
    registerRole,
    editRole,
    loadRoles,
    clearActionError: clearRoleError,
  } = useRoles();

  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [roleFormMode, setRoleFormMode] = useState("create"); // "create" o "edit" dentro del panel de roles

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

  const handleOpenRoles = (game) => {
    clearActionError();
    clearRoleError();
    setSuccessMessage("");
    setSelectedGame(game);
    setMode("roles");
    setSelectedRoleId("");
    setRoleFormMode("create");
    loadRoles(game.id);
  };

  const handleCancel = () => {
    clearActionError();
    clearRoleError();
    setMode(null);
    setSelectedGame(null);
  };

  const handleRegister = async (gameData) => {
    const success = await registerGame(gameData);
    if (!success) return;

    const gameName = typeof gameData === "object" ? gameData.name : gameData;
    setSuccessMessage(`Videojuego "${gameName}" registrado correctamente.`);
    setHasSeenMessage(false);
    setMode(null);
  };

  const handleEdit = async (gameData) => {
    if (!selectedGame) return;

    const success = await editGame(selectedGame.id, gameData);
    if (!success) return;

    const gameName = typeof gameData === "object" ? gameData.name : gameData;
    setSuccessMessage(`Videojuego "${gameName}" modificado correctamente.`);
    setHasSeenMessage(false);
    setMode(null);
    setSelectedGame(null);
  };

  const handleRegisterRole = async (roleData) => {
    const success = await registerRole(roleData);
    if (!success) return;

    setSuccessMessage(`Rol "${roleData.name}" registrado correctamente para ${selectedGame?.name}.`);
    setHasSeenMessage(false);
    setMode(null);
  };

  const handleUpdateRole = async (roleData) => {
    const success = await editRole({
      roleId: Number(selectedRoleId),
      videogame_id: Number(selectedGame.id),
      name: roleData.name,
      description: roleData.description,
      icon: roleData.icon,
    });
    if (!success) return;

    setSuccessMessage(`Rol "${roleData.name}" modificado correctamente.`);
    setHasSeenMessage(false);
    setMode(null);
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
            Gestioná los videojuegos disponibles en Ganker y sus roles asociados.
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
              onEditRoles={handleOpenRoles} // <--- Pasamos esta función para el nuevo botón en la lista
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

          {/* Panel Lateral para la gestión / modificación de Roles del juego seleccionado */}
          {mode === "roles" && selectedGame && (
            <RoleForm
              key={`roles-${selectedGame.id}`}
              games={games}
              roles={roles}
              initialVideogameId={selectedGame.id}
              initialRoleId={selectedRoleId}
              isEditing={roleFormMode === "edit"}
              isLoading={isLoadingRoles || isSaving}
              error={actionError}
              onSelectRole={(roleId) => {
                setSelectedRoleId(roleId);
                if (roleId) setRoleFormMode("edit");
              }}
              onSubmit={roleFormMode === "edit" ? handleUpdateRole : handleRegisterRole}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default GamesPage;