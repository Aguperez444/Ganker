import { useEffect, useState } from "react";
import RankForm from "../../components/ranks/RankFormComponent";
import RanksListComponent from "../../components/ranks/RanksListComponent";
import ModalConfirmacionComponent from "../../components/common/ModalConfirmacionComponent";
import IconSelectComponent from "../../components/common/IconSelectComponent";
import useGames from "../../hooks/useGames";
import useRanks from "../../hooks/useRanks";

// Admin de rangos: registrar, modificar y eliminar.
const RanksPage = () => {
  const [selectedGameId, setSelectedGameId] = useState("");
  // null = formulario cerrado. "create" / "edit" = se ve el formulario.
  const [mode, setMode] = useState(null);
  const [selectedRank, setSelectedRank] = useState(null);
  const [rankToDelete, setRankToDelete] = useState(null);
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
    removeRank,
    clearActionError,
  } = useRanks();

  useEffect(() => {
    if (selectedGameId) {
      loadRanks(selectedGameId);
    }
  }, [selectedGameId, loadRanks]);

  const handleOpenRegister = () => {
    clearActionError();
    setSuccessMessage("");
    setSelectedRank(null);
    setMode("create");
  };

  const handleOpenEdit = (rank) => {
    clearActionError();
    setSuccessMessage("");
    setSelectedRank(rank);
    setMode("edit");
  };

  const handleCancel = () => {
    clearActionError();
    setMode(null);
    setSelectedRank(null);
  };

  const handleRegister = async (rankData) => {
    const success = await registerRank(rankData);

    if (!success) {
      return;
    }

    setSuccessMessage(`Rango "${rankData.name}" registrado correctamente.`);
    setMode(null);

    // Si el rango se registró para el juego que se está viendo, ya se
    // refrescó la lista dentro de registerRank. Si fue para otro juego,
    // cambiamos la vista a ese juego para mostrar el resultado.
    if (String(rankData.videogame_id) !== String(selectedGameId)) {
      setSelectedGameId(String(rankData.videogame_id));
    }
  };

  const handleEdit = async (rankData) => {
    if (!selectedRank) {
      return;
    }

    const success = await editRank(selectedRank.id, rankData);

    if (!success) {
      return;
    }

    setSuccessMessage(`Rango "${rankData.name}" modificado correctamente.`);
    setMode(null);
    setSelectedRank(null);
  };

  const handleOpenDelete = (rank) => {
    clearActionError();
    setSuccessMessage("");
    // Cerramos el formulario abierto para que no comparta el mensaje de
    // error con el modal ni quede editando un rango que se va a borrar.
    setMode(null);
    setSelectedRank(null);
    setRankToDelete(rank);
  };

  const handleCancelDelete = () => {
    clearActionError();
    setRankToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!rankToDelete) {
      return;
    }

    const message = await removeRank(rankToDelete.id, selectedGameId);

    if (!message) {
      return;
    }

    setSuccessMessage(message);
    setRankToDelete(null);
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
            mode ? "lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]" : ""
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
                  <div className="max-w-xs">
                    <IconSelectComponent
                      id="ranks-videogame-filter"
                      value={selectedGameId}
                      onChange={setSelectedGameId}
                      options={games}
                      placeholder="Ver rangos de..."
                      disabled={isLoadingGames}
                    />
                  </div>
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
                selectedRankId={selectedRank?.id}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            ) : (
              <div className="rounded-xl border border-white/10 bg-ganker-surface-light p-6">
                <p className="text-sm text-ganker-muted">
                  Seleccioná un videojuego para ver sus rangos.
                </p>
              </div>
            )}
          </section>

          {mode === "create" && (
            <RankForm
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

          {mode === "edit" && selectedRank && (
            <RankForm
              key={`edit-${selectedRank.id}`}
              mode="edit"
              games={games}
              initialVideogameId={selectedGameId}
              initialName={selectedRank.name}
              initialValue={selectedRank.value}
              initialIconUrl={selectedRank.icon_url}
              isLoading={isSaving}
              error={actionError}
              onSubmit={handleEdit}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>

      <ModalConfirmacionComponent
        isOpen={Boolean(rankToDelete)}
        title="Eliminar rango"
        message={
          <>
            <p>
              ¿Seguro que querés eliminar el rango{" "}
              <span className="font-semibold text-ganker-text">
                {rankToDelete?.name}
              </span>
              ?
            </p>
            <p className="mt-2">
              Los jugadores que lo tengan pasan al rango inmediatamente inferior
              (o al superior, si no hay uno inferior). Esta acción no se puede
              deshacer.
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

export default RanksPage;
