import { useState } from "react";
import { reportarJugador } from "../api/moderacionApi";
import { logError } from "../utils/logs";
import {
  mensajeDeErrorReporte,
  obtenerMsEsperaReporte,
  registrarReporteEnviado,
  validarFormularioReporte,
} from "../utils/reportesJugadores";

export const PASO_FORMULARIO = "formulario";
export const PASO_CONFIRMACION = "confirmacion";
export const PASO_EXITO = "exito";

export default function useReportarJugador({ jugador, currentUserId }) {
  const [motivo, setMotivo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [errores, setErrores] = useState({});
  const [errorEnvio, setErrorEnvio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [paso, setPaso] = useState(PASO_FORMULARIO);
  const [reporte, setReporte] = useState(null);
  const [esperaMs, setEsperaMs] = useState(() =>
    obtenerMsEsperaReporte(currentUserId, jugador?.user_id)
  );

  const esPropio = Boolean(
    jugador?.user_id && currentUserId && jugador.user_id === currentUserId
  );
  const bloqueadoPorEspera = esperaMs > 0;

  function seleccionarMotivo(valor) {
    setMotivo(valor);
    setErrorEnvio("");
    setErrores((actuales) => ({ ...actuales, motivo: undefined }));
  }

  function cambiarDescripcion(valor) {
    setDescripcion(valor);
    setErrorEnvio("");
    setErrores((actuales) => ({ ...actuales, descripcion: undefined }));
  }

  // Valida y pasa al resumen. Devuelve false si no se puede continuar.
  function continuar() {
    setErrorEnvio("");

    if (esPropio) {
      setErrorEnvio("No podés reportarte a vos mismo.");
      return false;
    }

    const erroresValidacion = validarFormularioReporte({
      motivo,
      descripcion,
    });
    setErrores(erroresValidacion);

    if (Object.keys(erroresValidacion).length > 0) return false;

    // Se vuelve a consultar por si el jugador envio otro reporte en otra
    // pestaña mientras completaba este formulario.
    const restante = obtenerMsEsperaReporte(currentUserId, jugador?.user_id);
    setEsperaMs(restante);
    if (restante > 0) return false;

    setPaso(PASO_CONFIRMACION);
    return true;
  }

  function volverAlFormulario() {
    setErrorEnvio("");
    setPaso(PASO_FORMULARIO);
  }

  async function confirmarEnvio() {
    setErrorEnvio("");

    if (esPropio) {
      setErrorEnvio("No podés reportarte a vos mismo.");
      setPaso(PASO_FORMULARIO);
      return false;
    }

    const restante = obtenerMsEsperaReporte(currentUserId, jugador?.user_id);
    setEsperaMs(restante);
    if (restante > 0) {
      setPaso(PASO_FORMULARIO);
      return false;
    }

    try {
      setEnviando(true);

      const creado = await reportarJugador({
        reportedId: jugador.user_id,
        motivo,
        descripcion,
      });

      registrarReporteEnviado(currentUserId, jugador.user_id);
      setEsperaMs(obtenerMsEsperaReporte(currentUserId, jugador.user_id));
      setReporte(creado);
      setPaso(PASO_EXITO);

      return true;
    } catch (error) {
      logError("Error al reportar al jugador:", error);
      setErrorEnvio(mensajeDeErrorReporte(error));
      return false;
    } finally {
      setEnviando(false);
    }
  }

  return {
    motivo,
    descripcion,
    errores,
    errorEnvio,
    enviando,
    paso,
    reporte,
    esperaMs,
    esPropio,
    bloqueadoPorEspera,
    seleccionarMotivo,
    cambiarDescripcion,
    continuar,
    volverAlFormulario,
    confirmarEnvio,
  };
}
