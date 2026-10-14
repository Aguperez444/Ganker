import IconoChicoComponent from "../common/IconoChicoComponent";
import PanelRiotComponent from "../riot/PanelRiotComponent";

const CLASES_TITULO =
  "text-xs font-semibold tracking-[0.15em] text-ganker-purple-light uppercase";

function Insignia({ icon_url, name }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-ganker-surface-light px-3 py-1 text-sm text-ganker-text">
      <IconoChicoComponent src={icon_url} className="h-5 w-5 rounded-sm" />
      <span className="truncate">{name}</span>
    </span>
  );
}

// Rangos distintos de los roles del perfil (mismo criterio que
// JugadorCardComponent): en juegos sin rango por rol deberia haber uno solo.
function rangosUnicos(roleProfiles) {
  const vistos = new Map();
  roleProfiles.forEach(({ rank }) => {
    if (rank && !vistos.has(rank.rank_id)) vistos.set(rank.rank_id, rank);
  });
  return [...vistos.values()];
}

// Detalle de UN perfil de juego de otro jugador (GameProfileObjectResponse):
// region, roles con su rango y personajes en orden de preferencia (el backend
// ya los manda ordenados por prioridad). Si es de LoL, abajo va la cuenta de
// Riot vinculada (ver PanelRiotComponent).
const PerfilDeJuegoDetalleComponent = ({
  perfil,
  esPropio = false,
  onRangoActualizado,
}) => {
  const { videogame, region, role_profiles: roleProfiles, characters } = perfil;
  const rangoPorRol = videogame.rank_per_role !== false;
  const tienePersonajes = videogame.has_characters !== false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ganker-muted">
        <span>
          Región:{" "}
          <span className="font-medium text-ganker-text">
            {region?.name ?? "Sin región"}
          </span>
        </span>
      </div>

      <section>
        <h3 className={CLASES_TITULO}>
          {rangoPorRol ? "Roles y rangos" : "Rango y roles"}
        </h3>

        {roleProfiles.length === 0 ? (
          <p className="mt-3 text-sm text-ganker-muted">
            No cargó roles para este juego.
          </p>
        ) : rangoPorRol ? (
          <ul className="mt-3 space-y-2">
            {roleProfiles.map((roleProfile) => (
              <li
                key={roleProfile.role_profile_id}
                className="flex flex-wrap items-center gap-2"
              >
                <Insignia {...roleProfile.role} />
                <span aria-hidden="true" className="text-ganker-muted">
                  ·
                </span>
                <Insignia {...roleProfile.rank} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {rangosUnicos(roleProfiles).map((rank) => (
              <Insignia key={`rango-${rank.rank_id}`} {...rank} />
            ))}
            {roleProfiles.map((roleProfile) => (
              <Insignia
                key={roleProfile.role_profile_id}
                {...roleProfile.role}
              />
            ))}
          </div>
        )}
      </section>

      {tienePersonajes && (
        <section>
          <h3 className={CLASES_TITULO}>Personajes</h3>
          <p className="mt-1 text-xs text-ganker-muted">
            En orden de preferencia.
          </p>

          {characters.length === 0 ? (
            <p className="mt-3 text-sm text-ganker-muted">
              No cargó personajes para este juego.
            </p>
          ) : (
            <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {characters.map((character, indice) => (
                <li
                  key={character.character_id}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-ganker-surface-light px-3 py-2"
                >
                  <span className="w-5 shrink-0 text-center text-xs font-semibold text-ganker-muted">
                    {indice + 1}
                  </span>
                  <IconoChicoComponent
                    src={character.icon_url}
                    className="h-9 w-9 shrink-0 rounded-lg"
                    placeholder
                  />
                  <span className="truncate text-sm font-medium text-ganker-text">
                    {character.name}
                  </span>
                  {indice === 0 && (
                    <span className="ml-auto shrink-0 rounded-full border border-ganker-orange/30 bg-ganker-orange/10 px-2 py-0.5 text-[11px] font-semibold text-ganker-orange-light">
                      Main
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <PanelRiotComponent
        key={perfil.game_profile_id}
        gameProfileId={perfil.game_profile_id}
        esPropio={esPropio}
        onRangoActualizado={onRangoActualizado}
      />
    </div>
  );
};

export default PerfilDeJuegoDetalleComponent;
