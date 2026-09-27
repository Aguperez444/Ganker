import { useEffect, useState } from "react";
import RankForm from "../../components/ranks/RankFormComponent";
import RanksListComponent from "../../components/ranks/RanksListComponent";
import useGames from "../../hooks/useGames";
import useRanks from "../../hooks/useRanks";

const RanksPage = () => {
  const [selectedGameId, setSelectedGameId] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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
    clearActionError,
  } = useRanks();

  const [formMode, setFormMode] = useState("create"); // "create" o "edit"
  const [selectedRankId, setSelectedRankId] = useState("");

  useEffect(() => {
    if (selectedGameId) {
      loadRanks(selectedGameId);
    }
  }, [selectedGameId, loadRanks]);

  const handleOpenRegister = () => {
    clearActionError();
    setSuccessMessage("");
    setFormMode("create"); 
    setSelectedRankId("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (rankId = "") => {
    clearActionError();
    setSuccessMessage("");
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
    setIsFormOpen(false);
  };

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
          <div className="mt-6 rounded-lg border border-ganker-success/20 bg-ganker-success/10 px-4 py-3">
            <p className="text-sm text-ganker-success">✓ {successMessage}</p>
          </div>
        )}

        <div
          className={`mt-8 grid gap-6 ${
            isFormOpen ? "lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]" : ""
          }`}
        >
          <section className="min-w-0 rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-xl font-semibold text-ganker-text">
                  Rangos por videojuego
                </h2>

                <div className="mt-3">
                  <label htmlFor="ranks-videogame-filter" className="sr-only">
                    Ver rangos de
                  </label>
                  <select
                    id="ranks-videogame-filter"
                    value={selectedGameId}
                    onChange={(event) => setSelectedGameId(event.target.value)}
                    disabled={isLoadingGames}
                    className="w-full max-w-xs rounded-lg border border-white/10 bg-ganker-surface-light px-4 py-2.5 text-sm text-ganker-text outline-none transition-all duration-200 focus:border-ganker-purple-light focus:ring-2 focus:ring-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Ver rangos de...</option>
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
                + Registrar rango
              </button>
            </div>

            {selectedGameId ? (
              <RanksListComponent
                ranks={ranks}
                isLoading={isLoadingRanks}
                error={ranksError}
                onEditRank={(rankId) => handleOpenEdit(rankId)}
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
    </section>
  );
};

export default RanksPage;