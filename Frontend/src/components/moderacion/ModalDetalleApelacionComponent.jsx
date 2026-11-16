import { useCallback, useEffect, useState } from "react";
import { obtenerApelacion, resolverApelacion } from "../../api/apelacionesApi";
import { mensajeErrorApelacion } from "../../utils/apelaciones";
import { formatearFechaBaneo, formatearVencimiento } from "../../utils/baneos";
import { urlDeMedia } from "../../utils/media";
import ModalModeracionComponent from "./ModalModeracionComponent";
import ModalRevisionDenunciaComponent from "./ModalRevisionDenunciaComponent";
import ReportesJugadorComponent from "./ReportesJugadorComponent";
import BaneosJugadorComponent from "./BaneosJugadorComponent";
import EstadoApelacionComponent from "./EstadoApelacionComponent";

export default function ModalDetalleApelacionComponent({
  id,
  miId,
  onClose,
  onResuelta,
  onVerBaneo,
  volverAlHistorial = false,
}) {
  const [consulta, setConsulta] = useState({});
  const [reintento, setReintento] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [reporte, setReporte] = useState(null);
  const [decision, setDecision] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const volverAApelacion = useCallback(() => setReporte(null), []);

  useEffect(() => {
    let activo = true;
    obtenerApelacion(id).then(
      (datos) => {
        if (activo) setConsulta({ datos, id, reintento });
      },
      (fallo) => {
        if (activo)
          setConsulta({ error: mensajeErrorApelacion(fallo), id, reintento });
      }
    );
    return () => {
      activo = false;
    };
  }, [id, reintento]);

  async function confirmar() {
    if (enviando) return;
    setEnviando(true);
    setError("");
    try {
      await resolverApelacion(id, decision);
      onResuelta(decision);
    } catch (fallo) {
      setError(mensajeErrorApelacion(fallo));
      if (fallo.response?.status === 409) {
        setDecision(null);
        setReintento((previo) => previo + 1);
      }
    } finally {
      setEnviando(false);
    }
  }

  if (reporte)
    return (
      <ModalRevisionDenunciaComponent
        denuncia={reporte}
        miId={miId}
        soloLectura
        onClose={volverAApelacion}
      />
    );
  const datos = consulta.datos;
  const cargando = consulta.id !== id || consulta.reintento !== reintento;
  const puedeResolver =
    datos?.status === "pending" &&
    datos.ban.active &&
    datos.ban.user_id !== miId;
  return (
    <ModalModeracionComponent
      titulo="Detalle de la apelación"
      subtitulo={`Apelación #${id}`}
      onClose={onClose}
      bloqueado={enviando}
      cerrarLabel={volverAlHistorial ? "Volver al detalle anterior" : "Cerrar"}
    >
      <div className="space-y-6 p-5 sm:p-6">
        {cargando ? (
          <p className="text-sm text-ganker-muted">Cargando apelación...</p>
        ) : consulta.error ? (
          <div role="alert" className="text-sm text-ganker-error">
            <p>{consulta.error}</p>
            <button
              type="button"
              onClick={() => setReintento((previo) => previo + 1)}
              className="mt-2 cursor-pointer underline"
            >
              Volver a intentar
            </button>
          </div>
        ) : (
          <>
            <dl className="grid gap-3 rounded-xl border border-white/10 bg-ganker-surface-light p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-ganker-muted">Jugador</dt>
                <dd className="text-ganker-text">
                  @{datos.ban.username} · ID {datos.ban.user_id}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ganker-muted">Estado</dt>
                <dd className="text-ganker-purple-light">
                  <EstadoApelacionComponent estado={datos.status} />
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-ganker-muted">Motivo del baneo</dt>
                <dd className="break-words text-ganker-text">
                  {datos.ban.reason}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ganker-muted">Baneado el</dt>
                <dd className="text-ganker-text">
                  {formatearFechaBaneo(datos.ban.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ganker-muted">Vencimiento</dt>
                <dd className="text-ganker-text">
                  {formatearVencimiento(datos.ban.expires_at)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ganker-muted">Apelación enviada</dt>
                <dd className="text-ganker-text">
                  {formatearFechaBaneo(datos.created_at)}
                </dd>
              </div>
              {datos.resolved_at && (
                <div>
                  <dt className="text-xs text-ganker-muted">Resuelta</dt>
                  <dd className="text-ganker-text">
                    {formatearFechaBaneo(datos.resolved_at)}{" "}
                    {datos.resolver_username &&
                      `por @${datos.resolver_username}`}
                  </dd>
                </div>
              )}
            </dl>
            <section>
              <h3 className="font-semibold text-ganker-text">
                Motivo de la apelación
              </h3>
              <p className="mt-2 text-sm break-words whitespace-pre-wrap text-ganker-muted">
                {datos.text}
              </p>
            </section>
            <section>
              <h3 className="font-semibold text-ganker-text">
                Imágenes adjuntas
              </h3>
              {datos.images.length ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {datos.images.map((url, index) => (
                    <a
                      key={url}
                      href={urlDeMedia(url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Ampliar imagen ${index + 1} de la apelación`}
                    >
                      <img
                        src={urlDeMedia(url)}
                        alt={`Imagen ${index + 1} de la apelación`}
                        className="max-h-64 w-full rounded-lg border border-white/10 object-contain"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-ganker-muted">
                  No se adjuntaron imágenes.
                </p>
              )}
            </section>
            <section aria-label="Denuncias previas del jugador">
              <h3 className="font-semibold text-ganker-text">
                Denuncias previas del jugador
              </h3>
              <ReportesJugadorComponent
                jugador={{
                  user_id: datos.ban.user_id,
                  username: datos.ban.username,
                }}
                pagina={pagina}
                onPaginaChange={setPagina}
                onVerDetalle={setReporte}
              />
            </section>
            {onVerBaneo && (
              <section aria-label="Baneos anteriores del jugador">
                <h3 className="font-semibold text-ganker-text">
                  Baneos y desbaneos anteriores
                </h3>
                <p className="mt-2 text-sm text-ganker-muted">
                  Sanciones anteriores a este baneo, con su estado y detalle de
                  finalización.
                </p>
                <BaneosJugadorComponent
                  jugadorId={datos.ban.user_id}
                  antesDeBaneoId={datos.ban.ban_id}
                  onVerDetalle={onVerBaneo}
                />
              </section>
            )}
            {!datos.ban.active && (
              <p className="text-sm text-ganker-muted">
                Este baneo ya no está vigente. La apelación se conserva como
                historial.
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-ganker-error">
                {error}
              </p>
            )}
            {puedeResolver &&
              (decision ? (
                <div className="space-y-3 rounded-xl border border-white/10 bg-ganker-surface-light p-4">
                  <p className="text-sm text-ganker-text">
                    {decision === "accepted"
                      ? `Se aceptará la apelación de @${datos.ban.username} y se levantará este baneo.`
                      : `Se rechazará la apelación de @${datos.ban.username} y se mantendrá el baneo.`}
                  </p>
                  <div className="flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      disabled={enviando}
                      onClick={() => setDecision(null)}
                      className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-sm text-ganker-muted"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={enviando}
                      onClick={confirmar}
                      className="cursor-pointer rounded-lg bg-ganker-purple px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {enviando ? "Guardando..." : "Confirmar decisión"}
                    </button>
                  </div>
                </div>
              ) : (
                <footer className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
                  <button
                    type="button"
                    onClick={() => setDecision("rejected")}
                    className="cursor-pointer rounded-lg border border-ganker-error/40 px-4 py-2.5 text-sm font-semibold text-ganker-error"
                  >
                    Rechazar apelación
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision("accepted")}
                    className="cursor-pointer rounded-lg bg-ganker-purple px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Aceptar apelación y desbanear
                  </button>
                </footer>
              ))}
          </>
        )}
      </div>
    </ModalModeracionComponent>
  );
}
