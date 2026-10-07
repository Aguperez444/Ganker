import { useEffect, useState } from "react";
import ModalConfirmacionComponent from "../../components/common/ModalConfirmaciongitComponent.jsx";
import RegionForm from "../../components/region/RegionFormComponent";
import RegionsListComponent from "../../components/region/RegionsListComponent";
import useGames from "../../hooks/useGames";
import useRegions from "../../hooks/useRegions";

const RegionsPage = () => {
  const [selectedGameId, setSelectedGameId] = useState("");

  const [mode, setMode] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);

  const [regionToDelete, setRegionToDelete] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");

  const { games, isLoading: isLoadingGames } = useGames();

  const {
    regions,
    isLoading: isLoadingRegions,
    isSaving,
    isDeleting,
    error: regionsError,
    actionError,
    loadRegions,
    registerRegion,
    editRegion,
    removeRegion,
    clearActionError,
  } = useRegions();

  useEffect(() => {
    loadRegions(selectedGameId);
  }, [selectedGameId, loadRegions]);

  const handleGameChange = (event) => {
    const gameId = event.target.value;

    setSelectedGameId(gameId);

    setMode(null);
    setSelectedRegion(null);
    setRegionToDelete(null);
    setSuccessMessage("");

    clearActionError();
  };

  const handleOpenRegister = () => {
    clearActionError();
    setSuccessMessage("");

    setSelectedRegion(null);
    setMode("create");
  };

  const handleOpenEdit = (region) => {
    clearActionError();
    setSuccessMessage("");

    setSelectedRegion({
      ...region,
      videogame_id: Number(selectedGameId),
    });

    setMode("edit");
  };

  const handleCancelForm = () => {
    clearActionError();

    setMode(null);
    setSelectedRegion(null);
  };

  const handleRegister = async (regionData) => {
    const success = await registerRegion(regionData);

    if (!success) {
      return;
    }

    const gameWasChanged =
      String(regionData.videogame_id) !== String(selectedGameId);

    if (gameWasChanged) {
      setSelectedGameId(String(regionData.videogame_id));
    }

    setSuccessMessage(`Región "${regionData.name}" registrada correctamente.`);

    setMode(null);
    setSelectedRegion(null);
  };

  const handleEdit = async (regionData) => {
    if (!selectedRegion) {
      return;
    }

    const success = await editRegion(selectedRegion.id, regionData.name);

    if (!success) {
      return;
    }

    setSuccessMessage(`Región "${regionData.name}" modificada correctamente.`);

    setMode(null);
    setSelectedRegion(null);
  };

  const handleOpenDelete = (region) => {
    clearActionError();
    setSuccessMessage("");

    setRegionToDelete(region);
  };

  const handleCancelDelete = () => {
    if (isDeleting) {
      return;
    }

    setRegionToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!regionToDelete) {
      return;
    }

    const deletedRegionName = regionToDelete.name;

    const success = await removeRegion(regionToDelete.id);

    if (!success) {
      return;
    }

    if (selectedRegion?.id === regionToDelete.id) {
      setMode(null);
      setSelectedRegion(null);
    }

    setRegionToDelete(null);

    setSuccessMessage(`Región "${deletedRegionName}" eliminada correctamente.`);
  };

  return (
    <>
      <section className="min-h-full bg-ganker-bg p-6">
        <div className="mx-auto w-full max-w-6xl">
          <header>
            <p className="text-xs font-semibold tracking-[0.15em] text-ganker-purple-light uppercase">
              Administración
            </p>

            <h1 className="mt-2 font-heading text-3xl font-bold text-ganker-text">
              Regiones
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-ganker-muted">
              Gestioná las regiones disponibles para cada videojuego de Ganker.
            </p>
          </header>

          {successMessage && (
            <div className="mt-6 rounded-lg border border-ganker-success/20 bg-ganker-success/10 px-4 py-3">
              <p className="text-sm text-ganker-success">✓ {successMessage}</p>
            </div>
          )}

          {actionError && !mode && !regionToDelete && (
            <div className="mt-6 rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
              <p className="text-sm text-ganker-error">{actionError}</p>
            </div>
          )}

          <div
            className={`mt-8 grid gap-6 ${
              mode ? "lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]" : ""
            }`}
          >
            <section className="min-w-0 rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-xl font-semibold text-ganker-text">
                    Regiones por videojuego
                  </h2>

                  <div className="mt-3">
                    <label
                      htmlFor="regions-videogame-filter"
                      className="sr-only"
                    >
                      Ver regiones de
                    </label>

                    <select
                      id="regions-videogame-filter"
                      value={selectedGameId}
                      onChange={handleGameChange}
                      disabled={isLoadingGames}
                      className="w-full max-w-xs rounded-lg border border-white/10 bg-ganker-surface-light px-4 py-2.5 text-sm text-ganker-text outline-none transition-all duration-200 focus:border-ganker-purple-light focus:ring-2 focus:ring-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Ver regiones de...</option>

                      {games.map((game) => (
                        <option key={game.id} value={game.id}>
                          {game.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedGameId && (
                    <p className="mt-3 text-sm text-ganker-muted">
                      {regions.length}{" "}
                      {regions.length === 1
                        ? "región registrada"
                        : "regiones registradas"}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleOpenRegister}
                  disabled={isSaving}
                  className="cursor-pointer self-start rounded-lg bg-gradient-to-r from-ganker-orange via-ganker-orange-light to-ganker-purple px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  + Registrar región
                </button>
              </div>

              {selectedGameId ? (
                <RegionsListComponent
                  regions={regions}
                  isLoading={isLoadingRegions}
                  error={regionsError}
                  selectedRegionId={selectedRegion?.id}
                  deletingRegionId={isDeleting ? regionToDelete?.id : null}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                />
              ) : (
                <div className="rounded-xl border border-white/10 bg-ganker-surface-light p-6">
                  <p className="text-sm text-ganker-muted">
                    Seleccioná un videojuego para ver sus regiones.
                  </p>
                </div>
              )}
            </section>

            {mode === "create" && (
              <RegionForm
                key="create"
                mode="create"
                games={games}
                initialVideogameId={selectedGameId}
                isLoading={isSaving}
                error={actionError}
                onSubmit={handleRegister}
                onCancel={handleCancelForm}
              />
            )}

            {mode === "edit" && selectedRegion && (
              <RegionForm
                key={`edit-${selectedRegion.id}`}
                mode="edit"
                games={games}
                initialVideogameId={String(selectedRegion.videogame_id)}
                initialName={selectedRegion.name}
                isLoading={isSaving}
                error={actionError}
                onSubmit={handleEdit}
                onCancel={handleCancelForm}
              />
            )}
          </div>
        </div>
      </section>

      <ModalConfirmacionComponent
        isOpen={Boolean(regionToDelete)}
        title="Eliminar región"
        confirmLabel="Eliminar región"
        isLoading={isDeleting}
        error={actionError}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        message={
          <>
            <p>
              ¿Seguro que querés eliminar la región{" "}
              <span className="font-semibold text-ganker-text">
                “{regionToDelete?.name}”
              </span>
              ?
            </p>

            <p className="mt-3">
              Los perfiles de jugadores asociados a esta región quedarán sin una
              región asignada.
            </p>
          </>
        }
      />
    </>
  );
};

export default RegionsPage;
