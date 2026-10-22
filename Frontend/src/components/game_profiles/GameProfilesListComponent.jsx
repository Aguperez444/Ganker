import { urlDeMedia } from "../../utils/media";

// US 08 - Editar perfil de juego.
// Lista los perfiles de juego del jugador (salen de user.profiles, via
// AuthContext) para que elija cual editar. Sigue el mismo patron visual que
// GamesListComponent/RanksListComponent: fila con icono + nombre + accion.
// `onView` (opcional): boton "Ver" que abre el perfil completo de ese juego
// (con la cuenta de Riot y sus estadisticas, si es LoL o Valorant).
// `onDelete` (opcional): boton "Eliminar" de la US 09.
const GameProfilesListComponent = ({
  profiles,
  selectedProfileId,
  onEdit,
  onView,
  onDelete,
}) => {
  if (!profiles || profiles.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-white/10 bg-ganker-surface-light p-6 text-center">
        <p className="text-sm text-ganker-muted">
          Todavía no tienes perfiles de juego.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <ul className="divide-y divide-white/10">
        {profiles.map((profile) => {
          const iconUrl = urlDeMedia(profile.videogame.icon_url);
          const cantidadPersonajes = profile.characters.length;
          const cantidadRoles = profile.role_profiles.length;
          const tienePersonajes = profile.videogame.has_characters !== false;

          return (
            <li
              key={profile.game_profile_id}
              className={[
                "flex items-center justify-between gap-4 px-5 py-4 transition",
                selectedProfileId === profile.game_profile_id
                  ? "bg-ganker-purple/20"
                  : "bg-ganker-surface-light hover:bg-white/5",
              ].join(" ")}
            >
              <div className="flex min-w-0 items-center gap-3">
                {iconUrl ? (
                  <img
                    src={iconUrl}
                    alt={profile.videogame.name}
                    className="h-10 w-10 shrink-0 rounded-lg border border-white/10 bg-ganker-surface object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-ganker-muted">
                    {profile.videogame.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate font-medium text-ganker-text">
                    {profile.videogame.name}
                  </p>
                  <p className="truncate text-xs text-ganker-muted">
                    {tienePersonajes &&
                      `${cantidadPersonajes} personaje${cantidadPersonajes === 1 ? "" : "s"} · `}
                    {cantidadRoles} rol
                    {cantidadRoles === 1 ? "" : "es"} ·{" "}
                    {profile.region?.name ?? "Sin región"}
                    {profile.in_game_name && ` · ${profile.in_game_name}`}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {onView && (
                  <button
                    type="button"
                    onClick={() => onView(profile)}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-ganker-text transition hover:bg-white/5"
                  >
                    Ver
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onEdit(profile)}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-ganker-purple-light transition hover:bg-ganker-purple/20 hover:text-ganker-text"
                >
                  Modificar
                </button>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(profile)}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-ganker-error transition hover:bg-ganker-error/10"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default GameProfilesListComponent;
