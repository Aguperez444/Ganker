import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GameForm from "../../components/games/GameFormComponent";
import GameListComponent from "../../components/games/GamesListComponent";
import GameRolesPanelComponent from "../../components/roles/GameRolesPanelComponent";
import RoleForm from "../../components/roles/RoleFormComponent";
import useGames from "../../hooks/useGames";
import useRoles from "../../hooks/useRoles";

const GamesPage = () => {
  const navigate = useNavigate();

  // "create" | "edit" | "roles" (lista de roles del juego) | "role-form"
  const [mode, setMode] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [roleFormMode, setRoleFormMode] = useState("edit");
  const [successMessage, setSuccessMessage] = useState("");
  const [hasSeenMessage, setHasSeenMessage] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

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

  const {
    roles,
    isLoading: isLoadingRoles,
    isSaving: isSavingRole,
    error: rolesError,
    actionError: roleActionError,
    registerRole,
    editRole,
    deleteRole,
    loadRoles,
    clearActionError: clearRoleError,
  } = useRoles();

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

  // La pagina de rangos lee el juego del state de la navegacion, asi que la
  // lista de rangos de ese juego ya aparece cargada al llegar.
  const handleOpenRanks = (game) => {
    navigate("/app/admin/ranks", { state: { videogameId: game.id } });
  };

  const handleOpenRoles = (game) => {
    clearActionError();
    clearRoleError();
    setSuccessMessage("");
    setSelectedGame(game);
    setSelectedRoleId("");
    setMode("roles");
    loadRoles(game.id);
  };

  const handleSelectRole = (roleId) => {
    clearRoleError();
    setSuccessMessage("");
    setSelectedRoleId(roleId);
    setRoleFormMode("edit");
    setMode("role-form");
  };

  const handleOpenRoleRegister = () => {
    clearRoleError();
    setSuccessMessage("");
    setSelectedRoleId("");
    setRoleFormMode("create");
    setMode("role-form");
  };

  const handleBackToRoles = () => {
    clearRoleError();
    setSelectedRoleId("");
    setMode("roles");
  };

  const handleClosePanel = () => {
    clearActionError();
    clearRoleError();
    setSelectedGame(null);
    setSelectedRoleId("");
    setMode(null);
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

  const handleRegisterRole = async (roleData) => {
    const success = await registerRole(roleData);
    if (!success) return;

    showSuccess(
      `Rol "${roleData.name}" registrado correctamente para ${selectedGame?.name}.`
    );
    handleBackToRoles();
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

    showSuccess(`Rol "${roleData.name}" modificado correctamente.`);
    handleBackToRoles();
  };

  const handleOpenDelete = (role) => {
    clearRoleError();
    setSuccessMessage("");
    setHasSeenMessage(false);
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete || !selectedGame) return;

    const success = await deleteRole({
      roleId: roleToDelete.id,
      videogame_id: Number(selectedGame.id),
    });
    if (!success) return;

    showSuccess(`Rol "${roleToDelete.name}" eliminado correctamente.`);
    setIsDeleteModalOpen(false);
    setRoleToDelete(null);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setRoleToDelete(null);
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
            mode
              ? "lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]"
              : "grid-cols-1"
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
              onEditRoles={handleOpenRoles}
              onEditRanks={handleOpenRanks}
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

          {/* Panel con los roles del juego seleccionado */}
          {mode === "roles" && selectedGame && (
            <GameRolesPanelComponent
              key={`roles-${selectedGame.id}`}
              game={selectedGame}
              roles={roles}
              isLoading={isLoadingRoles}
              isSaving={isSavingRole}
              error={rolesError}
              selectedRoleId={selectedRoleId}
              onSelectRole={handleSelectRole}
              onDeleteRole={handleOpenDelete}
              onRegisterRole={handleOpenRoleRegister}
              onClose={handleClosePanel}
            />
          )}

          {/* Formulario de rol: registra o modifica el rol elegido en el panel */}
          {mode === "role-form" && selectedGame && (
            <RoleForm
              key={`role-form-${selectedGame.id}-${
                roleFormMode === "edit" ? selectedRoleId : "new"
              }`}
              games={games}
              roles={roles}
              initialVideogameId={selectedGame.id}
              initialRoleId={selectedRoleId}
              isEditing={roleFormMode === "edit"}
              lockVideogame
              hideRoleSelector
              isLoading={isSavingRole}
              error={roleActionError}
              onSubmit={roleFormMode === "edit" ? handleUpdateRole : handleRegisterRole}
              onCancel={handleBackToRoles}
              onBack={handleBackToRoles}
            />
          )}
        </div>
      </div>

      {isDeleteModalOpen && roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-2xl">
            <h3 className="font-heading text-xl font-bold text-ganker-text">
              Eliminar Rol
            </h3>

            <p className="mt-3 text-sm text-ganker-muted">
              ¿Estás seguro de que deseas eliminar el rol{" "}
              <strong className="text-ganker-text">{roleToDelete.name}</strong>?
            </p>

            <p className="mt-2 text-xs text-ganker-muted">
              También se van a eliminar los perfiles de rol que lo tengan
              asignado.
            </p>

            {roleActionError && (
              <div className="mt-4 rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-3 py-2">
                <p className="text-xs text-ganker-error">{roleActionError}</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={isSavingRole}
                className="cursor-pointer rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-ganker-text transition hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSavingRole}
                className="cursor-pointer rounded-lg bg-ganker-error px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-ganker-error/80 disabled:opacity-50"
              >
                {isSavingRole ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default GamesPage;
