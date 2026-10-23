import AvatarUsuarioComponent from "../common/AvatarUsuarioComponent";
import { urlDeMedia } from "../../utils/media";
import { formatearConexionReciente } from "../../utils/tiempo";

// Un perfil puede tener muchos personajes cargados (hasta el catalogo
// entero del juego); mostrarlos todos como insignias satura la tarjeta.
// Se muestran los primeros LIMITE_PERSONAJES_VISIBLES (en el orden de
// prioridad que ya viene del backend) y el resto se resume en un "+N". Si
// hay un filtro de personaje activo en la busqueda, ese personaje se
// garantiza visible aunque no este entre los primeros — total, es el motivo
// por el que esta tarjeta aparecio en el resultado.
const LIMITE_PERSONAJES_VISIBLES = 5;

function seleccionarPersonajesVisibles(characters, characterIdFiltrado) {
  if (!characters) return { visibles: [], ocultos: 0 };
  if (characters.length <= LIMITE_PERSONAJES_VISIBLES) {
    return { visibles: characters, ocultos: 0 };
  }

  let ordenados = characters;
  if (characterIdFiltrado) {
    const indice = characters.findIndex(
      (c) => String(c.character_id) === String(characterIdFiltrado)
    );
    if (indice >= LIMITE_PERSONAJES_VISIBLES) {
      ordenados = [
        characters[indice],
        ...characters.slice(0, indice),
        ...characters.slice(indice + 1),
      ];
    }
  }

  const visibles = ordenados.slice(0, LIMITE_PERSONAJES_VISIBLES);
  return { visibles, ocultos: characters.length - visibles.length };
}

// Rangos distintos de los roles del perfil. En juegos sin rango por rol
// deberia ser uno solo; si hubiera datos viejos con rangos mezclados se
// muestran todos, pero sin repetir.
function rangosUnicos(roleProfiles) {
  const vistos = new Map();
  (roleProfiles ?? []).forEach(({ rank }) => {
    if (rank && !vistos.has(rank.rank_id)) vistos.set(rank.rank_id, rank);
  });
  return [...vistos.values()];
}

function InsigniaPerfil({ icon_url, name }) {
  const iconUrl = urlDeMedia(icon_url);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-ganker-surface-light px-2.5 py-1 text-xs text-ganker-text">
      {iconUrl ? (
        <img
          src={iconUrl}
          alt=""
          className="h-4 w-4 rounded-sm object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      <span className="truncate">{name}</span>
    </span>
  );
}

/**
 * US 10 - Tarjeta de jugador con boton para iniciar una conversacion.
 *
 * El boton de "Enviar mensaje" no se muestra en la propia tarjeta del
 * usuario logueado (comparacion por user_id, ver ChatContext.currentUserId
 * y utils/jwt.js sobre por que hace falta decodificar el token para esto).
 *
 * `perfilJuego` es opcional: cuando viene (US 03 - Buscar jugadores, con
 * un videojuego seleccionado), muestra los personajes y los pares rol/rango
 * de esa coincidencia como insignias debajo del nombre. Son listas porque un
 * mismo perfil de juego puede tener varios personajes y varios roles (cada
 * uno con su propio rango) — ver GetGameProfileResponse en el backend.
 * `perfilJuego.characterIdFiltrado` (opcional): el id del personaje por el
 * que se esta filtrando la busqueda, si hay uno — ver
 * seleccionarPersonajesVisibles mas arriba.
 * `perfilJuego.rangoPorRol` (opcional, true por defecto): en juegos con
 * rank_per_role = false todos los roles comparten el rango del perfil, asi
 * que se muestran los roles y el rango una sola vez en vez de repetirlo.
 *
 * `onVerPerfil` (opcional): si viene, el avatar, el nombre y el boton "Ver
 * perfil" llevan al perfil completo del jugador (todos sus perfiles de juego).
 */
const JugadorCardComponent = ({
  jugador,
  currentUserId,
  onEnviarMensaje,
  enviando,
  perfilJuego,
  onVerPerfil,
}) => {
  const esUnoMismo = jugador.user_id === currentUserId;
  const conexionReciente = formatearConexionReciente(jugador.last_connection);
  const { visibles: personajesVisibles, ocultos: personajesOcultos } =
    seleccionarPersonajesVisibles(
      perfilJuego?.characters,
      perfilJuego?.characterIdFiltrado
    );

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-ganker-surface p-6 text-center transition hover:border-ganker-purple/40">
      <button
        type="button"
        onClick={() => onVerPerfil?.(jugador)}
        disabled={!onVerPerfil}
        tabIndex={-1}
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-ganker-purple/40 bg-ganker-surface-light text-lg font-semibold text-ganker-text transition enabled:cursor-pointer enabled:hover:border-ganker-purple"
      >
        <AvatarUsuarioComponent user={jugador} />
      </button>

      <div className="w-full min-w-0">
        {onVerPerfil ? (
          <button
            type="button"
            onClick={() => onVerPerfil(jugador)}
            className="mx-auto block max-w-full cursor-pointer truncate font-heading text-base font-semibold text-ganker-text hover:underline"
          >
            {jugador.name}
          </button>
        ) : (
          <p className="truncate font-heading text-base font-semibold text-ganker-text">
            {jugador.name}
          </p>
        )}
        <p className="truncate text-sm text-ganker-muted">
          @{jugador.username}
        </p>
        {perfilJuego?.in_game_name && (
          <p className="truncate text-xs text-ganker-purple-light">
            Nick: {perfilJuego.in_game_name}
          </p>
        )}
        {conexionReciente && (
          <p className="mt-0.5 truncate text-xs text-ganker-muted/80">
            {conexionReciente}
          </p>
        )}
      </div>

      {perfilJuego && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {perfilJuego.rangoPorRol === false ? (
            <>
              {rangosUnicos(perfilJuego.role_profiles).map((rank) => (
                <InsigniaPerfil key={`rango-${rank.rank_id}`} {...rank} />
              ))}
              {perfilJuego.role_profiles?.map((roleProfile) => (
                <InsigniaPerfil
                  key={roleProfile.role_profile_id}
                  {...roleProfile.role}
                />
              ))}
            </>
          ) : (
            perfilJuego.role_profiles?.map((roleProfile) => (
              <span
                key={roleProfile.role_profile_id}
                className="flex items-center gap-1.5"
              >
                <InsigniaPerfil {...roleProfile.role} />
                <InsigniaPerfil {...roleProfile.rank} />
              </span>
            ))
          )}
          {personajesVisibles.map((character) => (
            <InsigniaPerfil key={character.character_id} {...character} />
          ))}
          {personajesOcultos > 0 && (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-ganker-surface-light px-2.5 py-1 text-xs text-ganker-muted">
              +{personajesOcultos}
            </span>
          )}
        </div>
      )}

      {onVerPerfil && (
        <button
          type="button"
          onClick={() => onVerPerfil(jugador)}
          className={`${esUnoMismo ? "mt-auto " : ""}w-full cursor-pointer rounded-xl border border-ganker-purple/40 bg-ganker-purple/10 px-4 py-2 text-sm font-semibold text-ganker-text transition hover:bg-ganker-purple/25`}
        >
          Ver perfil
        </button>
      )}

      {!esUnoMismo && (
        <button
          type="button"
          onClick={() => onEnviarMensaje(jugador)}
          disabled={enviando}
          className={`${onVerPerfil ? "" : "mt-auto "}w-full rounded-xl border border-white/10 bg-ganker-surface-light px-4 py-2 text-sm font-semibold text-ganker-text transition hover:border-ganker-purple/40 hover:bg-ganker-purple/20 disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {enviando ? "Abriendo chat..." : "Enviar mensaje"}
        </button>
      )}
    </div>
  );
};

export default JugadorCardComponent;
