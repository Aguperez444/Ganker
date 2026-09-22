import { Link } from "react-router-dom";
import AvatarUsuarioComponent from "../common/AvatarUsuarioComponent";

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
 * US 10 - Lista de conversaciones del jugador logueado.
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
            <p>Todavía no tenés conversaciones.</p>
            <p className="text-xs text-ganker-muted/80">
              Buscá un jugador en{" "}
              <Link
                to="/app/jugadores"
                className="text-ganker-purple-light hover:underline"
              >
                Buscar jugadores
              </Link>{" "}
              y enviale un mensaje.
            </p>
          </div>
        ) : (
          conversaciones.map((c) => {
            const otro = c.other_participant;
            const nombreOtro = otro?.name || otro?.username || "Jugador";
            const activa = conversacionActivaId === c.conversation_id;
            const noLeido = (c.unread_count ?? 0) > 0;

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
                {/* El overflow-hidden que recorta la foto circular tiene que
                    quedar en un div aparte del que ancla el puntito: si el
                    puntito fuera hijo del mismo contenedor recortado, el
                    overflow-hidden se lo comía y quedaba pegado adentro del
                    circulo en vez de asomar la mitad afuera como un aviso
                    real (estilo Discord/WhatsApp). */}
                <div className="relative h-10 w-10 shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-ganker-purple/30 bg-ganker-surface-light text-sm font-semibold text-ganker-text">
                    <AvatarUsuarioComponent user={otro} alt={nombreOtro} />
                  </div>
                  {noLeido && (
                    <span
                      className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-ganker-error ring-2 ring-ganker-surface"
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-sm ${noLeido ? "font-bold" : "font-semibold"} text-ganker-text`}
                    >
                      {nombreOtro}
                    </p>
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
                      {c.last_message
                        ? c.last_message.content
                        : "Iniciá la conversación..."}
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
