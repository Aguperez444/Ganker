import { useEffect, useState } from "react";
import RoleForm from "../../components/roles/RoleFormComponent";
import RolesListComponent from "../../components/roles/RolesListComponent";
import useGames from "../../hooks/useGames";
import useRoles from "../../hooks/useRoles";

const RolesPage = () => {
  const [selectedGameId, setSelectedGameId] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
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
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    clearActionError();
    setIsFormOpen(false);
  };

  const handleRegister = async (roleData) => {
    const success = await registerRole(roleData);

    if (!success) {
      return;
    }

    setSuccessMessage(`Rol "${roleData.name}" registrado correctamente.`);
    setIsFormOpen(false);

    // Si el rol se registró para el juego que se está viendo, ya se
    // refrescó la lista dentro de registerRole. Si fue para otro juego,
    // cambiamos la vista a ese juego para mostrar el resultado.
    if (String(roleData.videogame_id) !== String(selectedGameId)) {
      setSelectedGameId(String(roleData.videogame_id));
    }
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
            isFormOpen
              ? "lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]"
              : ""
          }`}
        >
          <section className="min-w-0 rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-xl font-semibold text-ganker-text">
                  Roles por videojuego
                </h2>

                <div className="mt-3">
                  <label htmlFor="roles-videogame-filter" className="sr-only">
                    Ver roles de
                  </label>
                  <select
                    id="roles-videogame-filter"
                    value={selectedGameId}
                    onChange={(event) => setSelectedGameId(event.target.value)}
                    disabled={isLoadingGames}
                    className="w-full max-w-xs rounded-lg border border-white/10 bg-ganker-surface-light px-4 py-2.5 text-sm text-ganker-text outline-none transition-all duration-200 focus:border-ganker-purple-light focus:ring-2 focus:ring-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Ver roles de...</option>
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.name}
                      </option>
                    ))}
                  </select>
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
              <RolesListComponent
                roles={roles}
                isLoading={isLoadingRoles}
                error={rolesError}
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
              initialVideogameId={selectedGameId}
              isLoading={isSaving}
              error={actionError}
              onSubmit={handleRegister}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default RolesPage;
