import { useEffect, useState } from "react";
import RankForm from "../../components/ranks/RankFormComponent";
import RanksListComponent from "../../components/ranks/RanksListComponent";
import GameDropdown from "../../components/games/GameDropDown";
import useGames from "../../hooks/useGames";
import useRanks from "../../hooks/useRanks";

const RanksPage = () => {
  const [selectedGameId, setSelectedGameId] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSeenMessage, setHasSeenMessage] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [rankToDelete, setRankToDelete] = useState(null);

  const { games, isLoading: isLoadingGames } = useGames();

  const {
    ranks,
    isLoading: isLoadingRanks,
    isSaving,
    error: ranksError,
    actionError,
    loadRanks,
    registerRank,
    editRank,
    deleteRank,
    clearActionError,
  } = useRanks();

  const [formMode, setFormMode] = useState("create"); // "create" o "edit"
  const [selectedRankId, setSelectedRankId] = useState("");

  useEffect(() => {
    if (selectedGameId) {
      loadRanks(selectedGameId);
      setSearchTerm(""); // Limpiamos el buscador al cambiar de juego
    }
  }, [selectedGameId, loadRanks]);

  const handleOpenRegister = () => {
    clearActionError();
    setSuccessMessage("");
    setHasSeenMessage(false);
    setFormMode("create");
    setSelectedRankId("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (rankId = "") => {
    clearActionError();
    setSuccessMessage("");
    setHasSeenMessage(false);
    setFormMode("edit");
    setSelectedRankId(String(rankId));
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    clearActionError();
    setIsFormOpen(false);
  };

  const handleRegister = async (rankData) => {
    const success = await registerRank(rankData);
    if (!success) return;

    setSuccessMessage(`Rango "${rankData.name}" registrado correctamente.`);
    setHasSeenMessage(false);
    setIsFormOpen(false);

    if (String(rankData.videogame_id) !== String(selectedGameId)) {
      setSelectedGameId(String(rankData.videogame_id));
    }
  };

  const handleUpdate = async (rankData) => {
    const success = await editRank({
      rankId: Number(selectedRankId),
      videogame_id: Number(selectedGameId),
      name: rankData.name,
      value: rankData.value,
      icon: rankData.icon,
    });

    if (!success) return;

    setSuccessMessage(`Rango "${rankData.name}" modificado correctamente.`);
    setHasSeenMessage(false);
    setIsFormOpen(false);
  };

  const handleOpenDelete = (rank) => {
    clearActionError();
    setSuccessMessage("");
    setRankToDelete(rank);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!rankToDelete) return;

    const success = await deleteRank({
      rankId: rankToDelete.id,
      videogame_id: Number(selectedGameId),
    });

    if (!success) return;

    setSuccessMessage(`Rango "${rankToDelete.name}" eliminado correctamente.`);
    setHasSeenMessage(false);
    setIsDeleteModalOpen(false);
    setRankToDelete(null);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setRankToDelete(null);
  };

  const filteredRanks = ranks.filter((rank) =>
    rank.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="min-h-full bg-ganker-bg p-6">
      <div className="mx-auto w-full max-w-6xl">
        <header>
          <p className="text-xs font-semibold tracking-[0.15em] text-ganker-purple-light uppercase">
            Administración
          </p>

          <h1 className="mt-2 font-heading text-3xl font-bold text-ganker-text">
            Rangos
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-ganker-muted">
            Gestioná los rangos disponibles para cada videojuego de Ganker.
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
                Rangos por videojuego
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
                    placeholder="Buscar rango por nombre..."
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
                + Registrar rango
              </button>
            </div>

            {selectedGameId ? (
              <RanksListComponent
                ranks={filteredRanks}
                isLoading={isLoadingRanks}
                error={ranksError}
                onEditRank={(rankId) => handleOpenEdit(rankId)}
                onDeleteRank={(rank) => handleOpenDelete(rank)}
              />
            ) : (
              <div className="rounded-xl border border-white/10 bg-ganker-surface-light p-6">
                <p className="text-sm text-ganker-muted">
                  Seleccioná un videojuego para ver sus rangos.
                </p>
              </div>
            )}
          </section>

          {isFormOpen && (
            <RankForm
              games={games}
              ranks={ranks}
              initialVideogameId={selectedGameId}
              initialRankId={selectedRankId}
              isEditing={formMode === "edit"}
              isLoading={isSaving}
              error={actionError}
              onSelectRank={(rankId) => setSelectedRankId(rankId)}
              onSubmit={formMode === "edit" ? handleUpdate : handleRegister}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>

      {isDeleteModalOpen && rankToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-2xl">
            <h3 className="font-heading text-xl font-bold text-ganker-text">
              Eliminar Rango
            </h3>

            <p className="mt-3 text-sm text-ganker-muted">
              ¿Estás seguro de que deseas eliminar el rango{" "}
              <strong className="text-ganker-text">{rankToDelete.name}</strong> (Valor {rankToDelete.value})?
            </p>

            <p className="mt-2 text-xs text-ganker-warning">
              ⚠️ Nota: Si existen jugadores asociados a este rango, sus perfiles se reasignarán automáticamente al rango adyacente según las reglas del sistema.
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

export default RanksPage;