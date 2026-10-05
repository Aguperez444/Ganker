import { useEffect, useState } from "react";
import CharacterForm from "../../components/characters/CharacterFormComponent";
import CharactersListComponent from "../../components/characters/CharactersListComponent";
import useGames from "../../hooks/useGames";
import useCharacters from "../../hooks/useCharacters";
import ModalConfirmacionComponent from "../../components/common/ModalConfirmacionComponent";

const CharactersPage = () => {
  const [selectedGameId, setSelectedGameId] = useState("");
  const [mode, setMode] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [characterToDelete, setCharacterToDelete] = useState(null);

  const { games, isLoading: isLoadingGames } = useGames();

  const {
    characters,
    isLoading: isLoadingCharacters,
    isSaving,
    error: charactersError,
    actionError,
    loadCharacters,
    registerCharacter,
    editCharacter,
    removeCharacter,
    clearActionError,
  } = useCharacters();

  useEffect(() => {
    if (selectedGameId) {
      loadCharacters(selectedGameId);
    }
  }, [selectedGameId, loadCharacters]);

  const handleOpenRegister = () => {
    clearActionError();
    setSuccessMessage("");
    setSelectedCharacter(null);
    setMode("create");
  };

  const handleOpenEdit = (character) => {
    clearActionError();
    setSuccessMessage("");
    setSelectedCharacter(character);
    setMode("edit");
  };

  const handleCancel = () => {
    clearActionError();
    setMode(null);
    setSelectedCharacter(null);
  };

  const handleRegister = async (characterData) => {
    const success = await registerCharacter(characterData);

    if (!success) {
      return;
    }

    setSuccessMessage(
      `Personaje "${characterData.name}" registrado correctamente.`
    );
    setMode(null);

    // Si el personaje se registró para el juego que se está viendo, ya se
    // refrescó la lista dentro de registerCharacter. Si fue para otro
    // juego, cambiamos la vista a ese juego para mostrar el resultado.
    if (String(characterData.videogame_id) !== String(selectedGameId)) {
      setSelectedGameId(String(characterData.videogame_id));
    }
  };

  const handleEdit = async (characterData) => {
    if (!selectedCharacter) {
      return;
    }

    const success = await editCharacter(selectedCharacter.id, characterData);

    if (!success) {
      return;
    }

    setSuccessMessage(
      `Personaje "${characterData.name}" modificado correctamente.`
    );
    setMode(null);
    setSelectedCharacter(null);

    if (String(characterData.videogame_id) !== String(selectedGameId)) {
      setSelectedGameId(String(characterData.videogame_id));
    }
  };

  const handleOpenDelete = (character) => {
    clearActionError();
    setSuccessMessage("");
    // Cerramos el formulario abierto para que no comparta el mensaje de
    // error con el modal ni quede editando un personaje que se va a borrar.
    setMode(null);
    setSelectedCharacter(null);
    setCharacterToDelete(character);
  };

  const handleCancelDelete = () => {
    clearActionError();
    setCharacterToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!characterToDelete) {
      return;
    }

    const success = await removeCharacter(characterToDelete.id, selectedGameId);

    if (!success) {
      return;
    }

    setSuccessMessage(
      `Personaje "${characterToDelete.name}" eliminado correctamente.`
    );
    setCharacterToDelete(null);
  };

  return (
    <section className="min-h-full bg-ganker-bg p-6">
      <div className="mx-auto w-full max-w-6xl">
        <header>
          <p className="text-xs font-semibold tracking-[0.15em] text-ganker-purple-light uppercase">
            Administración
          </p>

          <h1 className="mt-2 font-heading text-3xl font-bold text-ganker-text">
            Personajes
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-ganker-muted">
            Gestioná los personajes disponibles para cada videojuego de Ganker.
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
                  Personajes por videojuego
                </h2>

                <div className="mt-3">
                  <label
                    htmlFor="characters-videogame-filter"
                    className="sr-only"
                  >
                    Ver personajes de
                  </label>
                  <select
                    id="characters-videogame-filter"
                    value={selectedGameId}
                    onChange={(event) => setSelectedGameId(event.target.value)}
                    disabled={isLoadingGames}
                    className="w-full max-w-xs rounded-lg border border-white/10 bg-ganker-surface-light px-4 py-2.5 text-sm text-ganker-text outline-none transition-all duration-200 focus:border-ganker-purple-light focus:ring-2 focus:ring-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Ver personajes de...</option>
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
                + Registrar personaje
              </button>
            </div>

            {selectedGameId ? (
              <CharactersListComponent
                characters={characters}
                isLoading={isLoadingCharacters}
                error={charactersError}
                selectedCharacterId={selectedCharacter?.id}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            ) : (
              <div className="rounded-xl border border-white/10 bg-ganker-surface-light p-6">
                <p className="text-sm text-ganker-muted">
                  Seleccioná un videojuego para ver sus personajes.
                </p>
              </div>
            )}
          </section>

          {mode === "create" && (
            <CharacterForm
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

          {mode === "edit" && selectedCharacter && (
            <CharacterForm
              key={`edit-${selectedCharacter.id}`}
              mode="edit"
              games={games}
              initialVideogameId={selectedGameId}
              initialName={selectedCharacter.name}
              initialIconUrl={selectedCharacter.icon_url}
              isLoading={isSaving}
              error={actionError}
              onSubmit={handleEdit}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>
      <ModalConfirmacionComponent
        isOpen={Boolean(characterToDelete)}
        title="Eliminar personaje"
        message={
          <>
            <p>
              ¿Seguro que querés eliminar a{" "}
              <span className="font-semibold text-ganker-text">
                {characterToDelete?.name}
              </span>
              ?
            </p>
            <p className="mt-2">
              Si algún jugador lo tiene entre sus personajes preferidos, se
              quitará de su perfil y se reordenarán las prioridades. Esta acción
              no se puede deshacer.
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

export default CharactersPage;
