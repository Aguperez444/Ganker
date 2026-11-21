import { useCallback, useEffect, useState } from "react";
import { obtenerDetalleBaneo } from "../../api/moderacionApi";
import {
  formatearFechaBaneo,
  esVencimientoPermanente,
} from "../../utils/baneos";
import EstadoApelacionComponent from "./EstadoApelacionComponent";
import { urlDeMedia } from "../../utils/media";
import ModalModeracionComponent from "./ModalModeracionComponent";
import ModalRevisionDenunciaComponent from "./ModalRevisionDenunciaComponent";
import ReportesJugadorComponent from "./ReportesJugadorComponent";

function Administrador({ nombre }) {
  return nombre ? (
    <strong>@{nombre}</strong>
  ) : (
    <span>un administrador cuyo nombre no está disponible</span>
  );
}

export default function ModalDetalleBaneoComponent({
  id,
  miId,
  onClose,
  onVerApelacion,
  volverAlHistorial = false,
}) {
  const [consulta, setConsulta] = useState({});
  const [reintento, setReintento] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [reporte, setReporte] = useState(null);
  const volverAlBaneo = useCallback(() => setReporte(null), []);

  useEffect(() => {
    let activo = true;
    obtenerDetalleBaneo(id).then(
      (datos) => {
        if (activo) setConsulta({ datos, id, reintento });
      },
      (fallo) => {
        if (activo)
          setConsulta({
            error:
              fallo.response?.data?.error ||
              "No se pudo cargar el detalle del baneo.",
            id,
            reintento,
          });
      }
    );
    return () => {
      activo = false;
    };
  }, [id, reintento]);

  if (reporte)
    return (
      <ModalRevisionDenunciaComponent
        denuncia={reporte}
        miId={miId}
        soloLectura
        onClose={volverAlBaneo}
      />
    );
  const datos = consulta.datos;
  const apelacion = datos?.appeal;
  const cargando = consulta.id !== id || consulta.reintento !== reintento;

  return (
    <ModalModeracionComponent
      titulo="Detalle del baneo"
      subtitulo={`Baneo #${id}`}
      onClose={onClose}
      cerrarLabel={
        volverAlHistorial
          ? "Volver al detalle anterior"
          : "Cerrar detalle del baneo"
      }
    >
      <div className="space-y-6 p-5 sm:p-6">
        {cargando ? (
          <p className="text-sm text-ganker-muted">Cargando baneo...</p>
        ) : consulta.error ? (
          <div role="alert" className="text-sm text-ganker-error">
            <p>{consulta.error}</p>
            <button
              type="button"
              onClick={() => setReintento((actual) => actual + 1)}
              className="mt-2 cursor-pointer underline"
            >
              Volver a intentar
            </button>
          </div>
        ) : (
          <>
            <section
              className="space-y-2 rounded-xl border border-white/10 bg-ganker-surface-light p-4 text-sm text-ganker-text"
              aria-label="Datos de la sanción"
            >
              <h3 className="font-heading text-lg font-semibold">
                @{datos.username} · ID {datos.user_id}
              </h3>
              <p>
                Baneado por <Administrador nombre={datos.banned_by_username} />{" "}
                el <strong>{formatearFechaBaneo(datos.created_at)}</strong>.
              </p>
              <p className="break-words whitespace-pre-wrap">
                <span className="font-semibold">Motivo: </span>
                {datos.reason}
              </p>
            </section>
            <section
              className="space-y-2 text-sm text-ganker-text"
              aria-label="Finalización del baneo"
            >
              <h3 className="font-semibold">Estado y finalización</h3>
              {datos.status === "active" && (
                <p>
                  El baneo está vigente.{" "}
                  {!datos.expires_at ||
                  esVencimientoPermanente(datos.expires_at)
                    ? "La sanción es permanente."
                    : `Vence el ${formatearFechaBaneo(datos.expires_at)}.`}
                </p>
              )}
              {datos.status === "expired" && (
                <>
                  <p>
                    Desbaneado automáticamente por vencimiento, sin intervención
                    de un administrador.
                  </p>
                  <p>
                    El baneo finalizó por vencimiento el{" "}
                    <strong>
                      {formatearFechaBaneo(datos.ended_at || datos.expires_at)}
                    </strong>
                    .
                  </p>
                </>
              )}
              {datos.status === "unbanned" && (
                <>
                  <p>
                    Desbaneado por{" "}
                    <Administrador nombre={datos.ended_by_username} /> el{" "}
                    <strong>{formatearFechaBaneo(datos.ended_at)}</strong>.
                  </p>
                  <p>
                    {datos.end_reason === "appeal"
                      ? "El administrador aceptó la apelación del jugador y levantó la sanción."
                      : "El administrador levantó la sanción manualmente."}
                  </p>
                </>
              )}
              {datos.status === "superseded" && (
                <p>
                  Este baneo fue sustituido por una nueva sanción el{" "}
                  <strong>{formatearFechaBaneo(datos.ended_at)}</strong>. No
                  implica que el jugador haya sido desbaneado entre ambas
                  sanciones.
                </p>
              )}
              {datos.status === "unknown" && (
                <>
                  <p>
                    Este registro es anterior al historial de desbaneos. No se
                    puede determinar si finalizó por vencimiento o por decisión
                    de un administrador.
                  </p>
                  {datos.expires_at && (
                    <p>
                      Vencimiento registrado:{" "}
                      {formatearFechaBaneo(datos.expires_at)}.
                    </p>
                  )}
                </>
              )}
            </section>
            <section aria-label="Apelación del baneo" className="space-y-3">
              <h3 className="font-semibold text-ganker-text">
                Apelación de esta sanción
              </h3>
              {apelacion ? (
                <>
                  <p className="text-sm text-ganker-muted">
                    Presentada el {formatearFechaBaneo(apelacion.created_at)}
                  </p>
                  <EstadoApelacionComponent estado={apelacion.status} />
                  <p className="text-sm break-words whitespace-pre-wrap text-ganker-text">
                    {apelacion.text}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {apelacion.images.map((url, index) => (
                      <a
                        key={url}
                        href={urlDeMedia(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={urlDeMedia(url)}
                          alt={`Imagen ${index + 1} de la apelación del baneo`}
                          className="max-h-48 w-full rounded-lg border border-white/10 object-contain"
                        />
                      </a>
                    ))}
                  </div>
                  {onVerApelacion && (
                    <button
                      type="button"
                      onClick={() => onVerApelacion(apelacion.id)}
                      className="cursor-pointer rounded-lg border border-ganker-purple-light/30 px-3 py-2 text-sm font-semibold text-ganker-purple-light"
                    >
                      Ver detalle de la apelación
                    </button>
                  )}
                </>
              ) : (
                <p className="text-sm text-ganker-muted">
                  El jugador no presentó una apelación para este baneo.
                </p>
              )}
            </section>
            <section aria-label="Denuncias previas al baneo">
              <h3 className="font-semibold text-ganker-text">
                Denuncias previas al baneo
              </h3>
              <ReportesJugadorComponent
                jugador={{ user_id: datos.user_id, username: datos.username }}
                fechaHasta={datos.created_at}
                pagina={pagina}
                onPaginaChange={setPagina}
                onVerDetalle={setReporte}
              />
            </section>
          </>
        )}
      </div>
    </ModalModeracionComponent>
  );
}
