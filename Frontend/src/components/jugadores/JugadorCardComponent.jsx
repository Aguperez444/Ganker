import AvatarUsuarioComponent from "../common/AvatarUsuarioComponent";
import { urlDeMedia } from "../../utils/media";

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
 * un videojuego seleccionado), muestra el rango/rol/personaje de esa
 * coincidencia como insignias debajo del nombre.
 */
const JugadorCardComponent = ({
  jugador,
  currentUserId,
  onEnviarMensaje,
  enviando,
  perfilJuego,
}) => {
  const esUnoMismo = jugador.user_id === currentUserId;

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-ganker-surface p-6 text-center transition hover:border-ganker-purple/40">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-ganker-purple/40 bg-ganker-surface-light text-lg font-semibold text-ganker-text">
        <AvatarUsuarioComponent user={jugador} />
      </div>

      <div className="min-w-0">
        <p className="truncate font-heading text-base font-semibold text-ganker-text">
          {jugador.name}
        </p>
        <p className="truncate text-sm text-ganker-muted">
          @{jugador.username}
        </p>
      </div>

      {perfilJuego && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <InsigniaPerfil {...perfilJuego.rank} />
          <InsigniaPerfil {...perfilJuego.role} />
          <InsigniaPerfil {...perfilJuego.character} />
        </div>
      )}

      {!esUnoMismo && (
        <button
          type="button"
          onClick={() => onEnviarMensaje(jugador)}
          disabled={enviando}
          className="mt-2 w-full rounded-xl border border-white/10 bg-ganker-surface-light px-4 py-2 text-sm font-semibold text-ganker-text transition hover:border-ganker-purple/40 hover:bg-ganker-purple/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? "Abriendo chat..." : "Enviar mensaje"}
        </button>
      )}
    </div>
  );
};

export default JugadorCardComponent;
