import { useState } from "react";
import GameProfileForm from "../components/game_profiles/GameProfileForm";
import GameProfilesListComponent from "../components/game_profiles/GameProfilesListComponent";
import { useAuth } from "../context/AuthContext";
import useGameProfile from "../hooks/useGameProfile";

const ProfilePage = () => {
  const { user } = useAuth();

  // null = se ve la lista de perfiles. "create" / "edit" = se ve el
  // formulario a pantalla completa (reemplaza la lista, no conviven).
  const [mode, setMode] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const {
    games,
    characters,
    roles,
    ranks,

    selectedGameId,
    selectedCharacters,
    selectedRoles,
    editingProfileId,
    usesRankPerRole,
    profileRank,

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
    setProfileRank,
    resetGameProfileForm,
    startEditProfile,
    isSaving,
    formError,
    submitGameProfile,
    submitEditGameProfile,
  } = useGameProfile();

  const handleOpenCreate = () => {
    resetGameProfileForm();
    setSuccessMessage("");
    setMode("create");
  };

  const handleOpenEdit = (profile) => {
    startEditProfile(profile);
    setSuccessMessage("");
    setMode("edit");
  };

  const handleCancel = () => {
    resetGameProfileForm();
    setMode(null);
  };

  const handleSubmit = async () => {
    const success =
      mode === "edit" ? await submitEditGameProfile() : await submitGameProfile();

    if (!success) {
      return;
    }

    setSuccessMessage(
      mode === "edit"
        ? "Perfil de juego actualizado correctamente."
        : "Perfil de juego creado correctamente."
    );
    setMode(null);
  };

  return (
    <section className="min-h-full bg-ganker-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-ganker-text sm:text-4xl">
            Mi perfil
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-ganker-muted sm:text-base">
            Administra tus perfiles de juego y la información que utilizaremos
            para ayudarte a encontrar jugadores compatibles.
          </p>
        </header>

        {successMessage && (
          <div className="mb-6 rounded-lg border border-ganker-success/20 bg-ganker-success/10 px-4 py-3">
            <p className="text-sm text-ganker-success">✓ {successMessage}</p>
          </div>
        )}

        {!mode && (
          <div className="rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-xl font-semibold text-ganker-text sm:text-2xl">
                  Tus perfiles de juego
                </h2>

                <p className="mt-1 text-sm text-ganker-muted">
                  Crea un perfil para cada videojuego que juegas.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="w-full shrink-0 rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
              >
                + Crear perfil de juego
              </button>
            </div>

            <GameProfilesListComponent
              profiles={user?.profiles}
              selectedProfileId={editingProfileId}
              onEdit={handleOpenEdit}
            />
          </div>
        )}

        {mode && (
          <GameProfileForm
            key={mode === "edit" ? `edit-${editingProfileId}` : "create"}
            mode={mode}
            games={games}
            characters={characters}
            roles={roles}
            ranks={ranks}
            selectedGameId={selectedGameId}
            selectedCharacters={selectedCharacters}
            selectedRoles={selectedRoles}
            usesRankPerRole={usesRankPerRole}
            profileRank={profileRank}
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
            onProfileRankChange={setProfileRank}
            onCancel={handleCancel}
            isSaving={isSaving}
            formError={formError}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </section>
  );
};

export default ProfilePage;
