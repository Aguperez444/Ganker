import { useEffect } from "react";
import Campo from "../common/CampoFormularioComponent";
import useBanearJugador from "../../hooks/useBanearJugador";
import {
  DIAS_MAXIMOS_BANEO,
  DIAS_MINIMOS_BANEO,
  DURACIONES_BANEO,
  LARGO_MAXIMO_MOTIVO_BANEO,
  formatearDuracionBaneo,
  formatearVencimiento,
} from "../../utils/baneos";

const CLASES_CONTROL =
  "w-full rounded-lg border bg-ganker-surface-light px-4 py-3 text-ganker-text outline-none transition-all duration-200 placeholder:text-ganker-muted focus:border-ganker-purple-light focus:ring-2 focus:ring-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50";

const clasesControl = (error) =>
  `${CLASES_CONTROL} ${error ? "border-ganker-error" : "border-white/10"}`;

const CLASES_BOTON_SECUNDARIO =
  "cursor-pointer rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-ganker-muted transition hover:bg-white/5 hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-50";

const CLASES_BOTON_PRINCIPAL =
  "cursor-pointer rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

// Fecha aproximada de vencimiento: la calcula el front para el resumen. La
// fecha real la devuelve el backend al registrar el baneo.
function fechaVencimientoEstimada(dias) {
  const cantidad = Number(dias);
  if (!Number.isInteger(cantidad) || cantidad < DIAS_MINIMOS_BANEO) return null;

  return new Date(Date.now() + cantidad * 24 * 60 * 60 * 1000).toISOString();
}

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

// US 36 - Banear jugador.
//
// Se abre desde Admin > Moderación y desde Admin > Usuarios (junto a "Dar de
// baja") una vez elegido el jugador, por eso recibe `jugador` y no un buscador.
// El flujo de tres pasos vive dentro del mismo modal:
//   1. formulario: motivo (obligatorio) y duración en días.
//   2. confirmación explícita: resumen de lo que se va a aplicar.
//   3. éxito: mensaje de confirmación para el administrador.
const ModalBanearJugadorComponent = ({ jugador, onClose }) => {
  const {
    motivo,
    duracionDias,
    errores,
    errorEnvio,
    baneando,
    paso,
    resultado,
    esPropio,
    cambiarMotivo,
    cambiarDuracion,
    continuar,
    volverAlFormulario,
    confirmarBaneo,
    cerrar,
  } = useBanearJugador({ jugador, onClose });

  const nombreJugador = jugador?.username || jugador?.name || "este jugador";

  useEffect(() => {
    function handleKeyDown(evento) {
      if (evento.key === "Escape" && !baneando) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [baneando, onClose]);

  const handleSubmit = (evento) => {
    evento.preventDefault();
    continuar();
  };

  let contenido;

  if (paso === "exito") {
    contenido = (
      <>
        <div className="text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-ganker-error/30 bg-ganker-error/10 text-2xl text-ganker-error"
            aria-hidden="true"
          >
            !
          </span>
          <h3
            id="titulo-modal-banear"
            className="mt-4 font-heading text-lg font-bold text-ganker-text"
          >
            Jugador baneado
          </h3>
          <p className="mt-2 text-sm text-ganker-muted">{resultado?.mensaje}</p>
          <p className="mt-1 text-sm text-ganker-muted">
            Se cerraron sus sesiones activas y no va a poder iniciar sesión
            hasta que venza el baneo.
          </p>
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={cerrar} className={CLASES_BOTON_PRINCIPAL}>
            Cerrar
          </button>
        </div>
      </>
    );
  } else if (esPropio) {
    contenido = (
      <>
        <h3
          id="titulo-modal-banear"
          className="font-heading text-lg font-bold text-ganker-text"
        >
          No podés banear tu propia cuenta
        </h3>
        <p className="text-sm text-ganker-muted">
          Elegí la cuenta de otro jugador para aplicar la sanción.
        </p>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className={CLASES_BOTON_SECUNDARIO}>
            Cerrar
          </button>
        </div>
      </>
    );
  } else if (paso === "confirmacion") {
    contenido = (
      <>
        <div>
          <h3
            id="titulo-modal-banear"
            className="font-heading text-lg font-bold text-ganker-text"
          >
            Confirmar baneo
          </h3>
          <p className="mt-1 text-sm text-ganker-muted">
            Revisá los datos. La sanción se aplica de inmediato y no se puede
            deshacer desde acá.
          </p>
        </div>

        <dl className="space-y-3 rounded-xl border border-white/10 bg-ganker-surface-light p-4">
          <ResumenDato etiqueta="Jugador">
            @{nombreJugador} · ID {jugador?.user_id}
          </ResumenDato>
          <ResumenDato etiqueta="Motivo">{motivo.trim()}</ResumenDato>
          <ResumenDato etiqueta="Duración">
            {formatearDuracionBaneo(duracionDias)}
          </ResumenDato>
          <ResumenDato etiqueta="Vence aproximadamente">
            {formatearVencimiento(fechaVencimientoEstimada(duracionDias))}
          </ResumenDato>
        </dl>

        <div className="rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
          <p className="text-sm text-ganker-error">
            Al confirmar, la cuenta pasa a estado baneado, se cierran sus
            sesiones activas y no va a poder iniciar sesión hasta que venza el
            baneo.
          </p>
        </div>

        {errorEnvio && (
          <div className="rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
            <p className="text-sm text-ganker-error">{errorEnvio}</p>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={volverAlFormulario}
            disabled={baneando}
            className={CLASES_BOTON_SECUNDARIO}
          >
            Volver
          </button>
          <button
            type="button"
            onClick={confirmarBaneo}
            disabled={baneando}
            className="cursor-pointer rounded-lg bg-ganker-error px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ganker-error/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {baneando ? "Baneando..." : "Confirmar baneo"}
          </button>
        </div>
      </>
    );
  } else {
    contenido = (
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <h3
            id="titulo-modal-banear"
            className="font-heading text-lg font-bold text-ganker-text"
          >
            Banear a {nombreJugador}
          </h3>
          <p className="mt-1 text-sm text-ganker-muted">
            Aplicá una sanción a esta cuenta. Podés revisar los datos antes de
            confirmar.
          </p>
        </div>

        <Campo
          id="baneo-motivo"
          label="Motivo o justificación"
          obligatorio
          error={errores.motivo}
          ayuda="Queda registrado para la revisión de los administradores."
        >
          <textarea
            id="baneo-motivo"
            rows={4}
            value={motivo}
            onChange={(evento) => cambiarMotivo(evento.target.value)}
            maxLength={LARGO_MAXIMO_MOTIVO_BANEO}
            disabled={baneando}
            placeholder="Ej. Uso reiterado de lenguaje abusivo tras varios reportes."
            className={`${clasesControl(errores.motivo)} resize-y`}
          />
        </Campo>

        <p className="-mt-2 text-right text-xs text-ganker-muted">
          {motivo.length}/{LARGO_MAXIMO_MOTIVO_BANEO}
        </p>

        <Campo
          id="baneo-duracion"
          label="Duración (en días)"
          obligatorio
          error={errores.duracion}
        >
          <input
            id="baneo-duracion"
            type="number"
            min={DIAS_MINIMOS_BANEO}
            max={DIAS_MAXIMOS_BANEO}
            inputMode="numeric"
            value={duracionDias}
            onChange={(evento) => cambiarDuracion(evento.target.value)}
            disabled={baneando}
            className={clasesControl(errores.duracion)}
          />
        </Campo>

        <div className="flex flex-wrap gap-2">
          {DURACIONES_BANEO.map((opcion) => (
            <button
              key={opcion.value}
              type="button"
              onClick={() => cambiarDuracion(opcion.value)}
              disabled={baneando}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                Number(duracionDias) === opcion.value
                  ? "border-ganker-purple-light/60 bg-ganker-purple/20 text-ganker-text"
                  : "border-white/10 bg-ganker-surface-light text-ganker-muted hover:text-ganker-text"
              }`}
            >
              {opcion.label}
            </button>
          ))}
        </div>

        {errores.jugador && (
          <div className="rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
            <p className="text-sm text-ganker-error">{errores.jugador}</p>
          </div>
        )}

        {errorEnvio && (
          <div className="rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
            <p className="text-sm text-ganker-error">{errorEnvio}</p>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={baneando}
            className={CLASES_BOTON_SECUNDARIO}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={baneando}
            className={CLASES_BOTON_PRINCIPAL}
          >
            Revisar sanción
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-banear"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-2xl">
        {contenido}
      </div>
    </div>
  );
};

export default ModalBanearJugadorComponent;
