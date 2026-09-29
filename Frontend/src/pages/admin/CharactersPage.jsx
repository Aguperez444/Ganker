import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import CharacterForm from "../../components/characters/CharacterFormComponent";
import CharactersListComponent from "../../components/characters/CharactersListComponent";
import useGames from "../../hooks/useGames";
import useCharacters from "../../hooks/useCharacters";

const CharactersPage = () => {
  // Cuando se llega desde "Modificar personajes" en la pagina de juegos, el
  // juego viene en el state de la navegacion y la lista arranca por ese juego.
  const location = useLocation();
  const [selectedGameId, setSelectedGameId] = useState(() =>
    location.state?.videogameId != null ? String(location.state.videogameId) : ""
  );
  const [mode, setMode] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

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
    </section>
  );
};

export default CharactersPage;
