import { useEffect } from "react";
import Campo from "../common/CampoFormularioComponent";
import useReportarJugador, {
  PASO_CONFIRMACION,
  PASO_EXITO,
} from "../../hooks/useReportarJugador";
import {
  LARGO_MAXIMO_DESCRIPCION_REPORTE,
  MOTIVOS_REPORTE,
  TAMANO_MAXIMO_EVIDENCIA_MB,
  TIPOS_IMAGEN_EVIDENCIA,
  nombreDeMotivoReporte,
} from "../../utils/reportesJugadores";

const CLASES_CONTROL =
  "w-full rounded-lg border bg-ganker-surface-light px-4 py-3 text-ganker-text outline-none transition-all duration-200 placeholder:text-ganker-muted focus:border-ganker-purple-light focus:ring-2 focus:ring-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50";

const clasesControl = (error) =>
  `${CLASES_CONTROL} ${error ? "border-ganker-error" : "border-white/10"}`;

const CLASES_BOTON_SECUNDARIO =
  "cursor-pointer rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-ganker-muted transition hover:bg-white/5 hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-50";

const CLASES_BOTON_PRINCIPAL =
  "cursor-pointer rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

function ResumenDato({ etiqueta, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-ganker-muted uppercase">
        {etiqueta}
      </dt>
      <dd className="mt-1 text-sm text-ganker-text">{children}</dd>
    </div>
  );
}

// US 35 - Reporte de un jugador.
//
// Es un flujo de tres pasos dentro del mismo modal:
//   1. formulario: motivo (obligatorio), descripcion y evidencia (imagen y/o
//      link de YouTube, opcionales).
//   2. confirmacion: resumen de lo que se va a enviar.
//   3. exito: mensaje de confirmacion para el jugador.
//
// Se monta solo cuando el jugador abre el modal (ver
// BotonReportarJugadorComponent), por eso no recibe `isOpen`.
const ModalReportarJugadorComponent = ({ jugador, currentUserId, onClose }) => {
  const {
    motivo,
    descripcion,
    errores,
    errorEnvio,
    enviando,
    paso,
    reporte,
    esPropio,
    imagen,
    vistaPreviaImagen,
    linkVideo,
    seleccionarMotivo,
    cambiarDescripcion,
    seleccionarImagen,
    cambiarLinkVideo,
    continuar,
    volverAlFormulario,
    confirmarEnvio,
  } = useReportarJugador({ jugador, currentUserId });

  const nombreJugador = jugador?.username || jugador?.name || "este jugador";
  const hayEvidencia = Boolean(imagen || linkVideo.trim());

  useEffect(() => {
    function handleKeyDown(evento) {
      if (evento.key === "Escape" && !enviando) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enviando, onClose]);

  const handleSubmit = (evento) => {
    evento.preventDefault();
    continuar();
  };

  let contenido;

  if (paso === PASO_EXITO) {
    contenido = (
      <>
        <div className="text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-ganker-success/30 bg-ganker-success/10 text-2xl text-ganker-success"
            aria-hidden="true"
          >
            ✓
          </span>
          <h3
            id="titulo-modal-reportar"
            className="mt-4 font-heading text-lg font-bold text-ganker-text"
          >
            Reporte enviado
          </h3>
          <p className="mt-2 text-sm text-ganker-muted">
            Tu reporte contra {nombreJugador} fue enviado exitosamente. Quedó
            pendiente de revisión por un administrador.
          </p>
          {reporte?.report_id != null && (
            <p className="mt-1 text-xs text-ganker-muted/80">
              Número de reporte: {reporte.report_id}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={CLASES_BOTON_PRINCIPAL}
          >
            Cerrar
          </button>
        </div>
      </>
    );
  } else if (esPropio) {
    contenido = (
      <>
        <h3
          id="titulo-modal-reportar"
          className="font-heading text-lg font-bold text-ganker-text"
        >
          No podés reportarte a vos mismo
        </h3>
        <p className="text-sm text-ganker-muted">
          Elegí el perfil de otro jugador para enviar un reporte.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={CLASES_BOTON_SECUNDARIO}
          >
            Cerrar
          </button>
        </div>
      </>
    );
  } else if (paso === PASO_CONFIRMACION) {
    contenido = (
      <>
        <div>
          <h3
            id="titulo-modal-reportar"
            className="font-heading text-lg font-bold text-ganker-text"
          >
            Confirmar reporte
          </h3>
          <p className="mt-1 text-sm text-ganker-muted">
            Revisá los datos antes de enviarlo. El reporte quedará pendiente de
            revisión por un administrador.
          </p>
        </div>

        <dl className="space-y-3 rounded-xl border border-white/10 bg-ganker-surface-light p-4">
          <ResumenDato etiqueta="Jugador reportado">
            @{nombreJugador}
          </ResumenDato>
          <ResumenDato etiqueta="Motivo">
            {nombreDeMotivoReporte(motivo)}
          </ResumenDato>
          <ResumenDato etiqueta="Descripción">
            {descripcion.trim() || "Sin descripción adicional"}
          </ResumenDato>
          <ResumenDato etiqueta="Evidencia">
            {hayEvidencia ? (
              <div className="space-y-2">
                {vistaPreviaImagen && (
                  <img
                    src={vistaPreviaImagen}
                    alt="Imagen adjunta como evidencia"
                    className="max-h-32 rounded-lg border border-white/10 object-contain"
                  />
                )}
                {linkVideo.trim() && (
                  <p className="break-all text-ganker-purple-light">
                    {linkVideo.trim()}
                  </p>
                )}
              </div>
            ) : (
              "Sin evidencia adjunta"
            )}
          </ResumenDato>
        </dl>

        {errorEnvio && (
          <div className="rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
            <p className="text-sm text-ganker-error">{errorEnvio}</p>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={volverAlFormulario}
            disabled={enviando}
            className={CLASES_BOTON_SECUNDARIO}
          >
            Volver
          </button>
          <button
            type="button"
            onClick={confirmarEnvio}
            disabled={enviando}
            className={CLASES_BOTON_PRINCIPAL}
          >
            {enviando ? "Enviando..." : "Confirmar y enviar"}
          </button>
        </div>
      </>
    );
  } else {
    contenido = (
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <h3
            id="titulo-modal-reportar"
            className="font-heading text-lg font-bold text-ganker-text"
          >
            Reportar a {nombreJugador}
          </h3>
          <p className="mt-1 text-sm text-ganker-muted">
            Contanos qué ocurrió. El reporte lo revisará un administrador.
          </p>
        </div>

        <Campo
          id="reporte-motivo"
          label="Motivo del reporte"
          obligatorio
          error={errores.motivo}
        >
          <select
            id="reporte-motivo"
            value={motivo}
            onChange={(evento) => seleccionarMotivo(evento.target.value)}
            disabled={enviando}
            className={clasesControl(errores.motivo)}
          >
            <option value="">Seleccioná un motivo</option>
            {MOTIVOS_REPORTE.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          id="reporte-descripcion"
          label="Descripción"
          error={errores.descripcion}
          ayuda="Opcional. Contá qué pasó con el mayor detalle posible."
        >
          <textarea
            id="reporte-descripcion"
            rows={4}
            value={descripcion}
            onChange={(evento) => cambiarDescripcion(evento.target.value)}
            maxLength={LARGO_MAXIMO_DESCRIPCION_REPORTE}
            disabled={enviando}
            placeholder="Ej. Insultó a otros jugadores durante la partida..."
            className={`${clasesControl(errores.descripcion)} resize-y`}
          />
        </Campo>

        <p className="-mt-2 text-right text-xs text-ganker-muted">
          {descripcion.length}/{LARGO_MAXIMO_DESCRIPCION_REPORTE}
        </p>

        <Campo
          id="reporte-imagen"
          label="Imagen de evidencia"
          error={errores.imagen}
          ayuda={`Opcional. PNG, JPG o WEBP de hasta ${TAMANO_MAXIMO_EVIDENCIA_MB} MB.`}
        >
          {vistaPreviaImagen ? (
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-ganker-surface-light p-3">
              <img
                src={vistaPreviaImagen}
                alt="Vista previa de la evidencia"
                className="h-16 w-16 shrink-0 rounded-md object-cover"
              />
              <p className="min-w-0 flex-1 truncate text-sm text-ganker-text">
                {imagen?.name}
              </p>
              <button
                type="button"
                onClick={() => seleccionarImagen(null)}
                disabled={enviando}
                className={CLASES_BOTON_SECUNDARIO}
              >
                Quitar
              </button>
            </div>
          ) : (
            <input
              id="reporte-imagen"
              type="file"
              accept={TIPOS_IMAGEN_EVIDENCIA.join(",")}
              onChange={(evento) => {
                seleccionarImagen(evento.target.files?.[0] ?? null);
                // Permite volver a elegir el mismo archivo si fue rechazado.
                evento.target.value = "";
              }}
              disabled={enviando}
              className={`${clasesControl(errores.imagen)} cursor-pointer text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-ganker-purple/30 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ganker-text`}
            />
          )}
        </Campo>

        <Campo
          id="reporte-video"
          label="Link de YouTube"
          error={errores.linkVideo}
          ayuda="Opcional. Un clip de la partida o del chat que muestre lo ocurrido."
        >
          <input
            id="reporte-video"
            type="url"
            inputMode="url"
            value={linkVideo}
            onChange={(evento) => cambiarLinkVideo(evento.target.value)}
            maxLength={500}
            disabled={enviando}
            placeholder="https://www.youtube.com/watch?v=..."
            className={clasesControl(errores.linkVideo)}
          />
        </Campo>

        {errorEnvio && (
          <div className="rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
            <p className="text-sm text-ganker-error">{errorEnvio}</p>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className={CLASES_BOTON_SECUNDARIO}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className={CLASES_BOTON_PRINCIPAL}
          >
            Enviar reporte
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-reportar"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-2xl">
        {contenido}
      </div>
    </div>
  );
};

export default ModalReportarJugadorComponent;
