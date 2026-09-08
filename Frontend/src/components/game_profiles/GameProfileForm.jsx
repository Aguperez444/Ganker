import IconSelectComponent from "../common/IconSelectComponent";
import { urlDeMedia } from "../../utils/media";

const GameProfileForm = ({
  mode = "create",
  games,
  characters,
  roles,
  ranks,

  selectedGameId,
  selectedCharacters,
  selectedRoles,
  usesRankPerRole,
  profileRank,

  isLoadingGames,
  isLoadingGameData,

  gamesError,
  gameDataError,

  onGameChange,
  onAddCharacter,
  onRemoveCharacter,
  onMoveCharacter,
  onToggleRole,
  onRoleRankChange,
  onProfileRankChange,
  onCancel,
  isSaving,
  formError,
  onSubmit,
}) => {
  const isEditMode = mode === "edit";

  const title = isEditMode ? "Editar perfil de juego" : "Crear perfil de juego";

  const description = isEditMode
    ? "El videojuego del perfil no se puede cambiar. Actualiza tus personajes y tus roles con rango."
    : "Selecciona un videojuego y configura cómo juegas.";

  const submitButtonText = isEditMode ? "Guardar cambios" : "Crear perfil";

  const submitLoadingText = isEditMode ? "Guardando..." : "Creando perfil...";

  const availableCharacters = characters.filter(
    (character) =>
      !selectedCharacters.some(
        (selectedCharacter) =>
          selectedCharacter.character_id === character.character_id
      )
  );

  const isRoleSelected = (roleId) =>
    selectedRoles.some((role) => role.role_id === roleId);

  const getSelectedRank = (roleId) =>
    selectedRoles.find((role) => role.role_id === roleId)?.rank_id ?? "";

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
      <div className="mb-6">
        <h2 className="font-heading text-xl font-semibold text-ganker-text sm:text-2xl">
          {title}
        </h2>

        <p className="mt-1 text-sm text-ganker-muted">{description}</p>
      </div>

      {/* Videojuego */}
      <div>
        <label className="mb-3 block text-sm font-semibold text-ganker-text">
          Videojuego
        </label>

        {isLoadingGames ? (
          <p className="text-sm text-ganker-muted">Cargando videojuegos...</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {(isEditMode
              ? games.filter((game) => String(game.id) === String(selectedGameId))
              : games
            ).map((game) => {
              const isSelected = String(game.id) === String(selectedGameId);
              const iconUrl = urlDeMedia(game.icon_url);

              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => onGameChange(String(game.id))}
                  disabled={isEditMode}
                  className={`flex w-28 flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${
                    isSelected
                      ? "border-ganker-purple-light bg-ganker-purple/20"
                      : "border-white/10 bg-ganker-surface-light hover:border-ganker-purple-light/50 hover:bg-white/5"
                  } ${isEditMode ? "cursor-not-allowed opacity-90" : "cursor-pointer"}`}
                >
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-ganker-surface">
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt={game.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-lg font-bold text-ganker-purple-light">
                        {game.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="line-clamp-2 text-xs font-medium text-ganker-text">
                    {game.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {isEditMode && (
          <p className="mt-2 text-xs text-ganker-muted">
            El videojuego de un perfil no se puede modificar.
          </p>
        )}

        {gamesError && (
          <p className="mt-2 text-sm text-ganker-error">{gamesError}</p>
        )}
      </div>

      {selectedGameId && (
        <div className="mt-8 border-t border-white/10 pt-6">
          {isLoadingGameData && (
            <p className="text-sm text-ganker-muted">
              Cargando información del videojuego...
            </p>
          )}

          {gameDataError && (
            <p className="text-sm text-ganker-error">{gameDataError}</p>
          )}

          {!isLoadingGameData && !gameDataError && (
            <div className="space-y-8">
              {/* Personajes */}
              <div>
                <div className="mb-4">
                  <h3 className="font-heading text-lg font-semibold text-ganker-text">
                    Personajes principales
                  </h3>

                  <p className="mt-1 text-sm text-ganker-muted">
                    Agrega los personajes que juegas y ordénalos según tu
                    preferencia.
                  </p>
                </div>

                <div className="max-w-xl">
                  <IconSelectComponent
                    value=""
                    onChange={(characterId) => onAddCharacter(characterId)}
                    options={availableCharacters}
                    placeholder="Agregar personaje..."
                    getOptionId={(character) => character.character_id}
                  />
                </div>

                {availableCharacters.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {availableCharacters.slice(0, 5).map((character) => {
                      const iconUrl = urlDeMedia(character.icon_url);

                      return (
                        <button
                          key={character.character_id}
                          type="button"
                          onClick={() =>
                            onAddCharacter(String(character.character_id))
                          }
                          className="flex items-center gap-2 rounded-lg border border-white/10 bg-ganker-surface-light py-1.5 pr-3 pl-1.5 transition hover:border-ganker-purple-light/50 hover:bg-white/5"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-ganker-surface">
                            {iconUrl ? (
                              <img
                                src={iconUrl}
                                alt={character.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="text-xs font-semibold text-ganker-purple-light">
                                {character.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <span className="max-w-20 truncate text-xs font-medium text-ganker-text">
                            {character.name}
                          </span>

                          <span
                            className="text-sm font-bold text-ganker-purple-light"
                            aria-hidden="true"
                          >
                            +
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedCharacters.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {selectedCharacters.map((character, index) => (
                      <div
                        key={character.character_id}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-ganker-surface-light p-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ganker-purple/20 text-sm font-semibold text-ganker-purple-light">
                          {index + 1}
                        </div>

                        {urlDeMedia(character.icon_url) && (
                          <img
                            src={urlDeMedia(character.icon_url)}
                            alt={character.name}
                            className="h-10 w-10 rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}

                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ganker-text">
                          {character.name}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              onMoveCharacter(character.character_id, "up")
                            }
                            disabled={index === 0}
                            className="rounded-lg px-3 py-2 text-ganker-muted transition hover:bg-white/5 hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label={`Subir ${character.name}`}
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onMoveCharacter(character.character_id, "down")
                            }
                            disabled={index === selectedCharacters.length - 1}
                            className="rounded-lg px-3 py-2 text-ganker-muted transition hover:bg-white/5 hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label={`Bajar ${character.name}`}
                          >
                            ↓
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onRemoveCharacter(character.character_id)
                            }
                            className="rounded-lg px-3 py-2 text-ganker-error transition hover:bg-ganker-error/10"
                            aria-label={`Eliminar ${character.name}`}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Roles */}
              <div className="border-t border-white/10 pt-8">
                <div className="mb-4">
                  <h3 className="font-heading text-lg font-semibold text-ganker-text">
                    Roles y rangos
                  </h3>

                  <p className="mt-1 text-sm text-ganker-muted">
                    {usesRankPerRole
                      ? "Selecciona solamente los roles que juegas e indica tu rango en cada uno."
                      : "Este videojuego usa un único rango para todo el perfil. Selecciona el rango y despues los roles que juegas."}
                  </p>
                </div>

                {!usesRankPerRole && (
                  <div className="mb-6 max-w-xl">
                    <label className="mb-2 block text-sm font-semibold text-ganker-text">
                      Rango del perfil
                    </label>

                    <IconSelectComponent
                      value={profileRank}
                      onChange={onProfileRankChange}
                      options={ranks}
                      placeholder="Selecciona tu rango"
                      getOptionId={(rank) => rank.rank_id}
                    />
                  </div>
                )}

                <div className="space-y-3">
                  {roles.map((role) => {
                    const selected = isRoleSelected(role.role_id);

                    return (
                      <div
                        key={role.role_id}
                        className="rounded-xl border border-white/10 bg-ganker-surface-light p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <label className="flex flex-1 cursor-pointer items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => onToggleRole(role.role_id)}
                              className="h-4 w-4 accent-ganker-purple"
                            />

                            {urlDeMedia(role.icon_url) && (
                              <img
                                src={urlDeMedia(role.icon_url)}
                                alt={role.name}
                                className="h-9 w-9 rounded-lg object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            )}

                            <span className="text-sm font-semibold text-ganker-text">
                              {role.name}
                            </span>
                          </label>

                          {usesRankPerRole && selected && (
                            <div className="w-full sm:w-56">
                              <IconSelectComponent
                                value={getSelectedRank(role.role_id)}
                                onChange={(rankId) =>
                                  onRoleRankChange(role.role_id, rankId)
                                }
                                options={ranks}
                                placeholder="Selecciona tu rango"
                                getOptionId={(rank) => rank.rank_id}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 border-t border-white/10 pt-6">
        {formError && (
          <div className="mb-4 rounded-xl border border-ganker-error/30 bg-ganker-error/10 px-4 py-3">
            <p className="text-sm text-ganker-error">{formError}</p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSaving || !selectedGameId}
            className="rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? submitLoadingText : submitButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameProfileForm;
