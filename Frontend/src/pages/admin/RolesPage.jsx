import { useEffect, useState } from "react";
import RoleForm from "../../components/roles/RoleFormComponent";
import RolesListComponent from "../../components/roles/RolesListComponent";
import GameDropdown from "../../components/common/GameDropdown";
import useGames from "../../hooks/useGames";
import useRoles from "../../hooks/useRoles";

const RolesPage = () => {
  const [selectedGameId, setSelectedGameId] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSeenMessage, setHasSeenMessage] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  const { games, isLoading: isLoadingGames } = useGames();

  const {
    roles,
    isLoading: isLoadingRoles,
    isSaving,
    error: rolesError,
    actionError,
    loadRoles,
    registerRole,
    editRole,
    deleteRole,
    clearActionError,
  } = useRoles();

  const [formMode, setFormMode] = useState("create"); // "create" o "edit"
  const [selectedRoleId, setSelectedRoleId] = useState("");

  useEffect(() => {
    if (selectedGameId) {
      loadRoles(selectedGameId);
      setSearchTerm(""); // Limpiamos el buscador al cambiar de juego
    }
  }, [selectedGameId, loadRoles]);

  const handleOpenRegister = () => {
    clearActionError();
    setSuccessMessage("");
    setHasSeenMessage(false);
    setFormMode("create");
    setSelectedRoleId("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (roleId = "") => {
    clearActionError();
    setSuccessMessage("");
    setHasSeenMessage(false);
    setFormMode("edit");
    setSelectedRoleId(String(roleId));
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    clearActionError();
    setIsFormOpen(false);
  };

  const handleRegister = async (roleData) => {
    const success = await registerRole(roleData);
    if (!success) return;

    setSuccessMessage(`Rol "${roleData.name}" registrado correctamente.`);
    setHasSeenMessage(false);
    setIsFormOpen(false);

    if (String(roleData.videogame_id) !== String(selectedGameId)) {
      setSelectedGameId(String(roleData.videogame_id));
    }
  };

  const handleUpdate = async (roleData) => {
    const success = await editRole({
      roleId: Number(selectedRoleId),
      videogame_id: Number(selectedGameId),
      name: roleData.name,
      description: roleData.description,
      icon: roleData.icon,
    });

    if (!success) return;

    setSuccessMessage(`Rol "${roleData.name}" modificado correctamente.`);
    setHasSeenMessage(false);
    setIsFormOpen(false);
  };

  const handleOpenDelete = (role) => {
    clearActionError();
    setSuccessMessage("");
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;

    const success = await deleteRole({
      roleId: roleToDelete.id,
      videogame_id: Number(selectedGameId),
    });

    if (!success) return;

    setSuccessMessage(`Rol "${roleToDelete.name}" eliminado correctamente.`);
    setHasSeenMessage(false);
    setIsDeleteModalOpen(false);
    setRoleToDelete(null);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setRoleToDelete(null);
  };

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="min-h-full bg-ganker-bg p-6">
      <div className="mx-auto w-full max-w-6xl">
        <header>
          <p className="text-xs font-semibold tracking-[0.15em] text-ganker-purple-light uppercase">
            Administración
          </p>

          <h1 className="mt-2 font-heading text-3xl font-bold text-ganker-text">
            Roles
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-ganker-muted">
            Gestioná los roles disponibles para cada videojuego de Ganker.
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
            isFormOpen ? "lg:grid-cols-[1fr_380px]" : "grid-cols-1"
          }`}
        >
          <section className="min-w-0 rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="font-heading text-xl font-semibold text-ganker-text whitespace-nowrap">
                Roles por videojuego
              </h2>
            </div>

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <GameDropdown
                  games={games}
                  selectedGameId={selectedGameId}
                  onSelect={(gameId) => setSelectedGameId(gameId)}
                  isLoading={isLoadingGames}
                />

                {selectedGameId && (
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar rol por nombre..."
                    className="w-full sm:w-64 rounded-lg border border-white/10 bg-ganker-surface-light px-4 py-2.5 text-sm text-ganker-text placeholder:text-ganker-muted outline-none transition-all duration-200 focus:border-ganker-purple-light focus:ring-2 focus:ring-ganker-purple/30"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={handleOpenRegister}
                disabled={isSaving}
                className="cursor-pointer shrink-0 rounded-lg border border-white/10 bg-ganker-surface-light px-4 py-2.5 text-sm font-semibold text-ganker-text transition-all duration-200 hover:border-ganker-orange hover:bg-ganker-orange hover:text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ganker-orange/20 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
              >
                + Registrar rol
              </button>
            </div>

            {selectedGameId ? (
              <RolesListComponent
                roles={filteredRoles}
                isLoading={isLoadingRoles}
                error={rolesError}
                onEditRole={(roleId) => handleOpenEdit(roleId)}
                onDeleteRole={(role) => handleOpenDelete(role)}
              />
            ) : (
              <div className="rounded-xl border border-white/10 bg-ganker-surface-light p-6">
                <p className="text-sm text-ganker-muted">
                  Seleccioná un videojuego para ver sus roles.
                </p>
              </div>
            )}
          </section>

          {isFormOpen && (
            <RoleForm
              games={games}
              roles={roles}
              initialVideogameId={selectedGameId}
              initialRoleId={selectedRoleId}
              isEditing={formMode === "edit"}
              isLoading={isSaving}
              error={actionError}
              onSelectRole={(roleId) => setSelectedRoleId(roleId)}
              onSubmit={formMode === "edit" ? handleUpdate : handleRegister}
              onCancel={handleCancel}
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

            {actionError && (
              <div className="mt-4 rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-3 py-2">
                <p className="text-xs text-ganker-error">{actionError}</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={isSaving}
                className="cursor-pointer rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-ganker-text transition hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSaving}
                className="cursor-pointer rounded-lg bg-ganker-error px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-ganker-error/80 disabled:opacity-50"
              >
                {isSaving ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default RolesPage;
