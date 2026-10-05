import { Link } from "react-router-dom";
import AvatarUsuarioComponent from "../common/AvatarUsuarioComponent";
import { urlDeMedia } from "../../utils/media";

function formatearFechaReciente(timestamp) {
  if (!timestamp) return "";
  const fecha = new Date(timestamp);
  if (Number.isNaN(fecha.getTime())) return "";

  const ahora = new Date();
  const esHoy =
    fecha.getDate() === ahora.getDate() &&
    fecha.getMonth() === ahora.getMonth() &&
    fecha.getFullYear() === ahora.getFullYear();

  return esHoy
    ? fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : fecha.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
}

/**
 * US 10 - Lista de conversaciones y chatrooms del jugador logueado.
 */
const ConversationListComponent = ({
  conversaciones,
  conversacionActivaId,
  onSeleccionar,
  onActualizar,
  cargando,
  error,
  onCerrar,
}) => {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-ganker-surface">
      <header className="flex h-17 items-center justify-between border-b border-white/10 px-4">
        <h2 className="font-heading text-lg font-semibold text-ganker-text">
          Conversaciones
        </h2>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onActualizar}
            aria-label="Actualizar conversaciones"
            title="Actualizar"
            disabled={cargando}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`}
              aria-hidden="true"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>

          {onCerrar && (
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar conversaciones"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text"
            >
              ×
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="px-4 py-3">
          <p className="text-xs text-ganker-error">{error}</p>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {cargando && conversaciones.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ganker-purple border-t-transparent" />
          </div>
        ) : conversaciones.length === 0 ? (
          <div className="space-y-2 p-6 text-center text-sm text-ganker-muted">
            <p>Todavía no tenés conversaciones ni equipos.</p>
            <p className="text-xs text-ganker-muted/80">
              Buscá jugadores o equipos para empezar a chatear.
            </p>
          </div>
        ) : (
          conversaciones.map((c) => {
            const esChatroom = Boolean(c.is_chatroom);
            const otro = c.other_participant;
            const titulo = esChatroom
              ? c.name || "Chat de equipo"
              : otro?.name || otro?.username || "Jugador";
            const activa = conversacionActivaId === c.conversation_id;
            const noLeido = (c.unread_count ?? 0) > 0;

            const previewMensaje = (() => {
              if (!c.last_message) {
                return esChatroom
                  ? "Chat del equipo..."
                  : "Iniciá la conversación...";
              }
              if (esChatroom && c.last_message.sender_username) {
                return `${c.last_message.sender_username}: ${c.last_message.content}`;
              }
              return c.last_message.content;
            })();

            return (
              <button
                key={c.conversation_id}
                type="button"
                onClick={() => onSeleccionar(c.conversation_id)}
                className={`flex w-full items-center gap-3 border-b border-white/5 p-3 text-left transition hover:bg-ganker-surface-light ${
                  activa
                    ? "border-l-2 border-l-ganker-purple bg-ganker-purple/15"
                    : ""
                }`}
              >
                <div className="relative h-10 w-10 shrink-0">
                  {esChatroom ? (
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-ganker-purple/40 bg-ganker-purple/10 text-sm font-semibold text-ganker-purple-light">
                      {c.icon_url ? (
                        <img
                          src={urlDeMedia(c.icon_url)}
                          alt={titulo}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span>🛡️</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-ganker-purple/30 bg-ganker-surface-light text-sm font-semibold text-ganker-text">
                      <AvatarUsuarioComponent user={otro} alt={titulo} />
                    </div>
                  )}

                  {noLeido && (
                    <span
                      className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-ganker-error ring-2 ring-ganker-surface"
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p
                        className={`truncate text-sm ${noLeido ? "font-bold" : "font-semibold"} text-ganker-text`}
                      >
                        {titulo}
                      </p>
                      {esChatroom && (
                        <span className="shrink-0 rounded bg-ganker-purple/20 px-1 py-0.2 text-[9px] font-bold text-ganker-purple-light uppercase">
                          Equipo
                        </span>
                      )}
                    </div>

                    {c.last_message?.timestamp && (
                      <span className="shrink-0 text-[10px] text-ganker-muted">
                        {formatearFechaReciente(c.last_message.timestamp)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-xs ${noLeido ? "font-semibold text-ganker-text" : "text-ganker-muted"}`}
                    >
                      {previewMensaje}
                    </p>
                    {noLeido && c.unread_count > 1 && (
                      <span className="shrink-0 rounded-full bg-ganker-error/20 px-1.5 py-0.5 text-[10px] font-bold text-ganker-error">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationListComponent;
