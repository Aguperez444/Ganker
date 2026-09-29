import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import RankForm from "../../components/ranks/RankFormComponent";
import RanksListComponent from "../../components/ranks/RanksListComponent";
import GameDropdown from "../../components/games/GameDropDown";
import useGames from "../../hooks/useGames";
import useRanks from "../../hooks/useRanks";

const RanksPage = () => {
  // Cuando se llega desde "Modificar rangos" en la pagina de juegos, el juego
  // viene en el state de la navegacion y la lista arranca por ese juego.
  const location = useLocation();
  const [selectedGameId, setSelectedGameId] = useState(() =>
    location.state?.videogameId != null ? String(location.state.videogameId) : ""
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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
      setSearchTerm(""); // Limpiamos el buscador al cambiar de juego
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

  // Filtrar los rangos según lo que escriba el usuario en el buscador
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
            {/* Cabecera unificada: Título, Selector, Buscador y Botón */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="font-heading text-xl font-semibold text-ganker-text whitespace-nowrap">
                    Rangos por videojuego
              </h2>
            </div>
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                

                <GameDropdown
                  games={games}
                  selectedGameId={selectedGameId}
                  onSelect={(gameId) => setSelectedGameId(String(gameId))}
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
                className="cursor-pointer shrink-0 rounded-lg bg-gradient-to-r from-ganker-orange via-ganker-orange-light to-ganker-purple px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50"
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