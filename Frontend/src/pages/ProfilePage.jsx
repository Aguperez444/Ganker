import { useState } from "react";
import GameProfileForm from "../components/game_profiles/GameProfileForm";
import useGameProfile from "../hooks/useGameProfile";

const ProfilePage = () => {
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const {
    games,
    characters,
    roles,
    ranks,

    selectedGameId,
    selectedCharacters,
    selectedRoles,

    isLoadingGames,
    isLoadingGameData,

    gamesError,
    gameDataError,

    selectGame,
    addCharacter,
    removeCharacter,
    moveCharacter,
    toggleRole,
    selectRoleRank,
    resetGameProfileForm,
    isSaving,
    formError,
    successMessage,
    submitGameProfile,
  } = useGameProfile();

  const handleOpenForm = () => {
    setIsCreatingProfile(true);
  };

  const handleCancel = () => {
    resetGameProfileForm();
    setIsCreatingProfile(false);
  };

  return (
    <section className="min-h-full bg-ganker-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-ganker-text sm:text-4xl">
            Mi perfil
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-ganker-muted sm:text-base">
            Administra tus perfiles de juego y la información que utilizaremos
            para ayudarte a encontrar jugadores compatibles.
          </p>
        </header>

        <div className="rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-xl font-semibold text-ganker-text sm:text-2xl">
                Tus perfiles de juego
              </h2>

              <p className="mt-1 text-sm text-ganker-muted">
                Crea un perfil para cada videojuego que juegas.
              </p>
            </div>

            {!isCreatingProfile && (
              <button
                type="button"
                onClick={handleOpenForm}
                className="w-full rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
              >
                + Crear perfil de juego
              </button>
            )}
          </div>

          {!isCreatingProfile && (
            <div className="flex min-h-64 flex-col items-center justify-center px-4 py-10 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ganker-surface-light">
                <span className="font-heading text-xl font-bold text-ganker-purple-light">
                  G
                </span>
              </div>

              <h3 className="font-heading text-lg font-semibold text-ganker-text">
                Todavía no tienes perfiles de juego
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-ganker-muted">
                Crea tu primer perfil indicando el videojuego, tus personajes
                principales, los roles que juegas y tu rango.
              </p>
            </div>
          )}
        </div>

        {isCreatingProfile && (
          <GameProfileForm
            games={games}
            characters={characters}
            roles={roles}
            ranks={ranks}
            selectedGameId={selectedGameId}
            selectedCharacters={selectedCharacters}
            selectedRoles={selectedRoles}
            isLoadingGames={isLoadingGames}
            isLoadingGameData={isLoadingGameData}
            gamesError={gamesError}
            gameDataError={gameDataError}
            onGameChange={selectGame}
            onAddCharacter={addCharacter}
            onRemoveCharacter={removeCharacter}
            onMoveCharacter={moveCharacter}
            onToggleRole={toggleRole}
            onRoleRankChange={selectRoleRank}
            onCancel={handleCancel}
            isSaving={isSaving}
            formError={formError}
            successMessage={successMessage}
            onSubmit={submitGameProfile}
          />
        )}
      </div>
    </section>
  );
};

export default ProfilePage;
