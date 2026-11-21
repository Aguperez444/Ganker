import ModalModeracionComponent from "./ModalModeracionComponent";
import DenunciasCruzadasComponent from "./DenunciasCruzadasComponent";
import { urlDeMedia } from "../../utils/media";
import { nombreDeMotivoReporte } from "../../utils/reportesJugadores";
import { etiquetaEstadoDenuncia } from "../../utils/denuncias";
import { parsearFechaUTC } from "../../utils/tiempo";

function formatearFecha(fecha) {
  if (!fecha) return "Sin resolución";
  const instante = parsearFechaUTC(fecha);
  return Number.isNaN(instante.getTime())
    ? "Fecha no disponible"
    : instante.toLocaleString("es-AR");
}

function urlVideoInsertado(video) {
  if (!video) return null;
  try {
    const url = new URL(video);
    const id = url.searchParams.get("v");
    if (
      url.protocol === "https:" &&
      ["www.youtube.com", "youtube.com"].includes(url.hostname) &&
      /^[\w-]{11}$/.test(id ?? "")
    ) {
      return `https://www.youtube-nocookie.com/embed/${id}`;
    }
  } catch {
    // El backend normaliza los links; una URL inválida no se inserta.
  }
  return null;
}

function Dato({ titulo, children }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-ganker-surface-light p-4">
      <dt className="text-xs font-semibold text-ganker-muted">{titulo}</dt>
      <dd className="mt-1 break-words text-sm text-ganker-text">{children}</dd>
    </div>
  );
}

export default function ModalDetalleDenunciaComponent({
  denuncia,
  onClose,
  onVerReportes,
  onBanear,
  puedeBanear = true,
  volverAlHistorial = false,
  mostrarBaneo = true,
  onDesestimar,
  onVerDenunciaCruzada,
  volverAlReporte = false,
}) {
  const imagen = urlDeMedia(denuncia.evidence_image_url);
  const video = urlVideoInsertado(denuncia.evidence_video_url);

  return (
    <ModalModeracionComponent
      titulo="Detalle del reporte"
      subtitulo={`Reporte #${denuncia.id}`}
      cerrarLabel={
        volverAlReporte
          ? "Volver al reporte anterior"
          : volverAlHistorial
            ? "Volver a los reportes del jugador"
            : "Cerrar detalle del reporte"
      }
      onClose={onClose}
    >
      <div className="space-y-6 p-5 sm:p-6">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Dato titulo="Denunciado">
            @{denuncia.reported_user_name}
            <span className="ml-2 text-xs text-ganker-muted">
              ID {denuncia.reported_user_id}
            </span>
          </Dato>
          <Dato titulo="Denunciante">
            @{denuncia.reporter_user_name}
            <span className="ml-2 text-xs text-ganker-muted">
              ID {denuncia.reporter_user_id}
            </span>
          </Dato>
          <Dato titulo="Motivo">{nombreDeMotivoReporte(denuncia.reason)}</Dato>
          <Dato titulo="Juego">
            {denuncia.videogame_name || "Sin juego especificado"}
          </Dato>
          <Dato titulo="Estado">{etiquetaEstadoDenuncia(denuncia.status)}</Dato>
          <Dato titulo="Creado">{formatearFecha(denuncia.created_at)}</Dato>
          <Dato titulo="Resuelto">{formatearFecha(denuncia.resolved_at)}</Dato>
          <Dato titulo="Resuelto por">
            {denuncia.resolved_by ? `@${denuncia.resolved_by}` : "Sin asignar"}
          </Dato>
        </dl>

        <section aria-labelledby="descripcion-denuncia">
          <h3
            id="descripcion-denuncia"
            className="font-semibold text-ganker-text"
          >
            Descripción
          </h3>
          <p className="mt-2 text-sm break-words whitespace-pre-wrap text-ganker-muted">
            {denuncia.description?.trim() || "No se especificó una descripción"}
          </p>
        </section>

        <section aria-labelledby="evidencia-denuncia" className="space-y-3">
          <h3
            id="evidencia-denuncia"
            className="font-semibold text-ganker-text"
          >
            Evidencia
          </h3>
          {!imagen && !denuncia.evidence_video_url && (
            <p className="text-sm text-ganker-muted">
              No se adjuntó evidencia.
            </p>
          )}
          {imagen && (
            <a
              href={imagen}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-white/10 bg-black/20 p-2"
              aria-label="Abrir imagen de evidencia en tamaño completo"
            >
              <img
                src={imagen}
                alt={`Evidencia de la denuncia ${denuncia.id}`}
                className="max-h-96 w-full rounded-lg object-contain"
              />
              <span className="mt-2 block text-center text-xs text-ganker-purple-light">
                Ver imagen completa ↗
              </span>
            </a>
          )}
          {video && (
            <iframe
              src={video}
              title={`Video de evidencia del reporte ${denuncia.id}`}
              className="aspect-video w-full rounded-xl border border-white/10"
              allow="encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}
          {denuncia.evidence_video_url && (
            <a
              href={denuncia.evidence_video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-semibold text-ganker-purple-light hover:underline"
            >
              Ver video en YouTube ↗
            </a>
          )}
        </section>
        <DenunciasCruzadasComponent
          key={denuncia.id}
          denuncia={denuncia}
          onVerDetalle={onVerDenunciaCruzada}
        />
      </div>
      {denuncia.status !== "pending" && (
        <p className="border-t border-white/10 px-5 py-3 text-sm text-ganker-muted sm:px-6">
          Esta denuncia está cerrada. No se pueden aplicar nuevas acciones desde
          ella.
        </p>
      )}
      <footer className="flex flex-wrap justify-end gap-3 border-t border-white/10 p-5 sm:px-6">
        <button
          type="button"
          onClick={onVerReportes}
          className="cursor-pointer rounded-lg border border-ganker-purple-light/30 px-4 py-2.5 text-sm font-semibold text-ganker-purple-light transition hover:bg-ganker-purple/10"
        >
          Ver otros reportes de este jugador
        </button>
        {onDesestimar && denuncia.status === "pending" && (
          <button
            type="button"
            onClick={onDesestimar}
            className="cursor-pointer rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-ganker-text transition hover:bg-white/5"
          >
            Desestimar denuncia
          </button>
        )}
        {mostrarBaneo && denuncia.status === "pending" && (
          <button
            type="button"
            onClick={onBanear}
            disabled={!puedeBanear}
            title={puedeBanear ? undefined : "No podés banear tu propia cuenta"}
            className="cursor-pointer rounded-lg bg-ganker-error px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ganker-error/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Banear jugador
          </button>
        )}
      </footer>
    </ModalModeracionComponent>
  );
}
