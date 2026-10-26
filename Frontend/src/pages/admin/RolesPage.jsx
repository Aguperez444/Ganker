import { useEffect, useState } from "react";
import RoleForm from "../../components/roles/RoleFormComponent";
import RolesListComponent from "../../components/roles/RolesListComponent";
import ListaConBuscadorComponent from "../../components/common/ListaConBuscadorComponent";
import ModalConfirmacionComponent from "../../components/common/ModalConfirmacionComponent";
import useGames from "../../hooks/useGames";
import useRoles from "../../hooks/useRoles";
import SelectorJuegoComponent from "../../components/games/SelectorJuegoComponent";

// Admin de roles: registrar, modificar (US 29) y eliminar (US 30).
const RolesPage = () => {
  const [selectedGameId, setSelectedGameId] = useState("");
  // null = formulario cerrado. "create" / "edit" = se ve el formulario.
  const [mode, setMode] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

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
    removeRole,
    clearActionError,
  } = useRoles();

  useEffect(() => {
    if (selectedGameId) {
      loadRoles(selectedGameId);
    }
  }, [selectedGameId, loadRoles]);

  const handleOpenRegister = () => {
    clearActionError();
    setSuccessMessage("");
    setSelectedRole(null);
    setMode("create");
  };

  const handleOpenEdit = (role) => {
    clearActionError();
    setSuccessMessage("");
    setSelectedRole(role);
    setMode("edit");
  };

  const handleCancel = () => {
    clearActionError();
    setMode(null);
    setSelectedRole(null);
  };

  const handleRegister = async (roleData) => {
    const success = await registerRole(roleData);

    if (!success) {
      return;
    }

    setSuccessMessage(`Rol "${roleData.name}" registrado correctamente.`);
    setMode(null);

    // Si el rol se registró para el juego que se está viendo, ya se
    // refrescó la lista dentro de registerRole. Si fue para otro juego,
    // cambiamos la vista a ese juego para mostrar el resultado.
    if (String(roleData.videogame_id) !== String(selectedGameId)) {
      setSelectedGameId(String(roleData.videogame_id));
    }
  };

  const handleEdit = async (roleData) => {
    if (!selectedRole) {
      return;
    }

    const success = await editRole(selectedRole.id, roleData);

    if (!success) {
      return;
    }

    setSuccessMessage(`Rol "${roleData.name}" modificado correctamente.`);
    setMode(null);
    setSelectedRole(null);
  };

  const handleOpenDelete = (role) => {
    clearActionError();
    setSuccessMessage("");
    // Cerramos el formulario abierto para que no comparta el mensaje de
    // error con el modal ni quede editando un rol que se va a borrar.
    setMode(null);
    setSelectedRole(null);
    setRoleToDelete(role);
  };

  const handleCancelDelete = () => {
    clearActionError();
    setRoleToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) {
      return;
    }

    const message = await removeRole(roleToDelete.id, selectedGameId);

    if (!message) {
      return;
    }

    setSuccessMessage(message);
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
            Roles
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-ganker-muted">
            Gestioná los roles disponibles para cada videojuego de Ganker.
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
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-xl font-semibold text-ganker-text">
                  Roles por videojuego
                </h2>

                <div className="mt-3">
                  <SelectorJuegoComponent
                    etiqueta="Ver roles de"
                    juegos={games}
                    value={selectedGameId}
                    onChange={setSelectedGameId}
                    disabled={isLoadingGames}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenRegister}
                disabled={isSaving}
                className="cursor-pointer self-start rounded-lg bg-gradient-to-r from-ganker-orange via-ganker-orange-light to-ganker-purple px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Registrar rol
              </button>
            </div>

            {selectedGameId ? (
              <ListaConBuscadorComponent
                key={selectedGameId}
                items={roles}
                isLoading={isLoadingRoles}
                error={rolesError}
                label="Buscar rol"
                placeholder="Buscar rol por nombre..."
              >
                {(rolesFiltrados) => (
                  <RolesListComponent
                    roles={rolesFiltrados}
                    isLoading={isLoadingRoles}
                    error={rolesError}
                    selectedRoleId={selectedRole?.id}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                  />
                )}
              </ListaConBuscadorComponent>
            ) : (
              <div className="rounded-xl border border-white/10 bg-ganker-surface-light p-6">
                <p className="text-sm text-ganker-muted">
                  Seleccioná un videojuego para ver sus roles.
                </p>
              </div>
            )}
          </section>

          {mode === "create" && (
            <RoleForm
              key="create"
              mode="create"
              games={games}
              initialVideogameId={selectedGameId}
              isLoading={isSaving}
              error={actionError}
              onSubmit={handleRegister}
              onCancel={handleCancel}
            />
          )}

          {mode === "edit" && selectedRole && (
            <RoleForm
              key={`edit-${selectedRole.id}`}
              mode="edit"
              games={games}
              initialVideogameId={selectedGameId}
              initialName={selectedRole.name}
              initialIconUrl={selectedRole.icon_url}
              isLoading={isSaving}
              error={actionError}
              onSubmit={handleEdit}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>

      <ModalConfirmacionComponent
        isOpen={Boolean(roleToDelete)}
        title="Eliminar rol"
        message={
          <>
            <p>
              ¿Seguro que querés eliminar el rol{" "}
              <span className="font-semibold text-ganker-text">
                {roleToDelete?.name}
              </span>
              ?
            </p>
            <p className="mt-2">
              Se va a quitar de los perfiles de los jugadores que lo tengan, y
              si un perfil de juego se queda sin ningún rol, ese perfil también
              se elimina. Esta acción no se puede deshacer.
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

export default RolesPage;
