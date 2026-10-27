import { useEffect, useState } from "react";
import CharacterForm from "../../components/characters/CharacterFormComponent";
import CharactersListComponent from "../../components/characters/CharactersListComponent";
import ListaConBuscadorComponent from "../../components/common/ListaConBuscadorComponent";
import useGames from "../../hooks/useGames";
import useCharacters from "../../hooks/useCharacters";
import ModalConfirmacionComponent from "../../components/common/ModalConfirmacionComponent";
import SelectorJuegoComponent from "../../components/games/SelectorJuegoComponent";

const CharactersPage = () => {
  const [selectedGameId, setSelectedGameId] = useState("");
  const [mode, setMode] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [characterToDelete, setCharacterToDelete] = useState(null);

  const { games, isLoading: isLoadingGames } = useGames();

  // Solo los juegos con has_characters admiten personajes nuevos (ej. CS2
  // no). El filtro de la lista sigue mostrando todos, por si un juego quedo
  // con personajes cargados de antes de apagar la flag.
  const juegosConPersonajes = games.filter((game) => game.has_characters);
  const juegoSeleccionado = games.find(
    (game) => String(game.id) === String(selectedGameId)
  );
  const juegoSinPersonajes = Boolean(
    juegoSeleccionado && !juegoSeleccionado.has_characters
  );
  // Al editar, el juego actual del personaje tiene que estar en el select
  // aunque tenga la flag apagada; si no, el formulario quedaria sin juego.
  const juegosParaEditar =
    juegoSinPersonajes && juegoSeleccionado
      ? [...juegosConPersonajes, juegoSeleccionado]
      : juegosConPersonajes;

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
    syncSupport,
    isSyncing,
    syncError,
    loadSyncSupport,
    syncFromCatalog,
  } = useCharacters();

  useEffect(() => {
    if (selectedGameId) {
      loadCharacters(selectedGameId);
    }
    loadSyncSupport(selectedGameId);
  }, [selectedGameId, loadCharacters, loadSyncSupport]);

  const handleSync = async () => {
    clearActionError();
    setSuccessMessage("");
    setMode(null);
    setSelectedCharacter(null);

    const result = await syncFromCatalog(selectedGameId);

    if (!result) {
      return;
    }

    const nuevos = result.created.length;
    let mensaje =
      nuevos === 0
        ? `No había personajes nuevos en ${result.source}`
        : `Se importaron ${nuevos} personaje${nuevos === 1 ? "" : "s"} nuevo${nuevos === 1 ? "" : "s"} desde ${result.source}`;
    mensaje += ` (${result.skipped_count} ya estaban registrados).`;
    if (result.failed.length > 0) {
      mensaje += ` No se pudieron importar: ${result.failed.join(", ")}.`;
    }
    setSuccessMessage(mensaje);
  };

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
                  <SelectorJuegoComponent
                    etiqueta="Ver personajes de"
                    juegos={games}
                    value={selectedGameId}
                    onChange={setSelectedGameId}
                    disabled={isLoadingGames}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 self-start">
                {syncSupport?.supported && (
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={isSaving || isSyncing}
                    title={`Importa los personajes que falten desde ${syncSupport.source}`}
                    className="cursor-pointer rounded-lg border border-ganker-purple-light/40 bg-ganker-purple/20 px-4 py-2.5 text-sm font-semibold text-ganker-text transition-all duration-200 hover:-translate-y-0.5 hover:bg-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSyncing ? "Importando..." : "⟳ Importar desde API"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleOpenRegister}
                  disabled={
                    isSaving || isSyncing || juegosConPersonajes.length === 0
                  }
                  className="cursor-pointer rounded-lg bg-gradient-to-r from-ganker-orange via-ganker-orange-light to-ganker-purple px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  + Registrar personaje
                </button>
              </div>
            </div>

            {syncSupport?.supported && (
              <div className="mb-4 rounded-lg border border-ganker-purple-light/20 bg-ganker-purple/10 px-4 py-3">
                <p className="text-sm text-ganker-muted">
                  Los personajes de este videojuego se pueden importar
                  automáticamente desde {syncSupport.source}. Solo se agregan
                  los que falten; también podés registrarlos a mano.
                </p>
              </div>
            )}

            {syncError && (
              <div className="mb-4 rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
                <p className="text-sm text-ganker-error">{syncError}</p>
              </div>
            )}

            {juegoSinPersonajes && (
              <div className="mb-4 rounded-lg border border-ganker-orange/20 bg-ganker-orange/10 px-4 py-3">
                <p className="text-sm text-ganker-orange-light">
                  {juegoSeleccionado.name} no tiene personajes (la opción
                  "Tiene personajes" del videojuego está desactivada), así que
                  no se le pueden registrar personajes nuevos.
                </p>
              </div>
            )}

            {selectedGameId ? (
              <ListaConBuscadorComponent
                key={selectedGameId}
                items={characters}
                isLoading={isLoadingCharacters}
                error={charactersError}
                label="Buscar personaje"
                placeholder="Buscar personaje por nombre..."
              >
                {(personajesFiltrados) => (
                  <CharactersListComponent
                    characters={personajesFiltrados}
                    isLoading={isLoadingCharacters}
                    error={charactersError}
                    selectedCharacterId={selectedCharacter?.id}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                  />
                )}
              </ListaConBuscadorComponent>
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
              games={juegosConPersonajes}
              initialVideogameId={juegoSinPersonajes ? "" : selectedGameId}
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
              games={juegosParaEditar}
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
              quitará de su perfil y se reordenarán las prioridades. Esta
              acción no se puede deshacer.
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
