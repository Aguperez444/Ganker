// US 35 - Reportar a otro jugador.
//
// El backend define estas categorias en ReportReason (player_report_orm.py).
// El label es solo para mostrar: el value es lo que viaja en `reason`.
export const MOTIVOS_REPORTE = [
  {
    value: "abusive_behavior",
    label: "Toxicidad o comportamiento abusivo",
  },
  {
    value: "inappropriate_content",
    label: "Lenguaje o contenido inapropiado",
  },
  {
    value: "cheating",
    label: "Trampas o uso de cheats",
  },
  {
    value: "spamming",
    label: "Spam",
  },
  {
    value: "other",
    label: "Inactividad, abandono, perfil falso u otro",
  },
];

export const LARGO_MAXIMO_DESCRIPCION_REPORTE = 500;

// Lapso minimo entre dos reportes del mismo jugador hacia el mismo reportado.
// Se controla en el frontend (localStorage) porque el backend actual no
// expone un limite de frecuencia para este endpoint.
export const ESPERA_ENTRE_REPORTES_MS = 10 * 60 * 1000;

const CLAVE_REPORTES_ENVIADOS = "ganker_reportes_enviados";

function claveDeReporte(reporterId, reportedId) {
  return `${reporterId ?? "anon"}:${reportedId}`;
}

function leerReportesEnviados() {
  try {
    const guardado = localStorage.getItem(CLAVE_REPORTES_ENVIADOS);
    if (!guardado) return {};

    const datos = JSON.parse(guardado);
    return datos && typeof datos === "object" ? datos : {};
  } catch {
    // Si localStorage no esta disponible o el JSON esta roto, no se limita
    // el envio: es una proteccion extra, no un requisito para reportar.
    return {};
  }
}

export function nombreDeMotivoReporte(motivo) {
  return (
    MOTIVOS_REPORTE.find((opcion) => opcion.value === motivo)?.label ?? motivo
  );
}

export function validarFormularioReporte({ motivo, descripcion }) {
  const errores = {};

  if (!motivo) {
    errores.motivo = "Seleccioná un motivo para el reporte.";
  } else if (!MOTIVOS_REPORTE.some((opcion) => opcion.value === motivo)) {
    errores.motivo = "Seleccioná un motivo válido para el reporte.";
  }

  if ((descripcion ?? "").trim().length > LARGO_MAXIMO_DESCRIPCION_REPORTE) {
    errores.descripcion = `La descripción no puede superar los ${LARGO_MAXIMO_DESCRIPCION_REPORTE} caracteres.`;
  }

  return errores;
}

// Devuelve cuantos milisegundos faltan para poder volver a reportar al mismo
// jugador. 0 significa que se puede enviar.
export function obtenerMsEsperaReporte(
  reporterId,
  reportedId,
  ahora = Date.now()
) {
  if (reportedId == null) return 0;

  const enviadoEn = Number(
    leerReportesEnviados()[claveDeReporte(reporterId, reportedId)]
  );

  if (!Number.isFinite(enviadoEn) || enviadoEn <= 0) return 0;

  const restante = ESPERA_ENTRE_REPORTES_MS - (ahora - enviadoEn);
  return restante > 0 ? restante : 0;
}

export function registrarReporteEnviado(
  reporterId,
  reportedId,
  ahora = Date.now()
) {
  if (reportedId == null) return;

  try {
    const reportes = leerReportesEnviados();
    const clave = claveDeReporte(reporterId, reportedId);
    reportes[clave] = ahora;

    // Limpieza de entradas vencidas para que el objeto no crezca sin limite.
    Object.keys(reportes).forEach((otraClave) => {
      const enviadoEn = Number(reportes[otraClave]);
      if (
        !Number.isFinite(enviadoEn) ||
        ahora - enviadoEn >= ESPERA_ENTRE_REPORTES_MS
      ) {
        delete reportes[otraClave];
      }
    });

    localStorage.setItem(CLAVE_REPORTES_ENVIADOS, JSON.stringify(reportes));
  } catch {
    // Mismo criterio que al leer: no bloquear el flujo por localStorage.
  }
}

export function formatearEsperaReporte(ms) {
  const minutos = Math.max(1, Math.ceil(ms / 60000));
  return minutos === 1 ? "1 minuto" : `${minutos} minutos`;
}

// Los errores de dominio del backend llegan en `error`; los de validacion de
// FastAPI, en `detail`. Se prioriza el mensaje legible del backend.
export function mensajeDeErrorReporte(error) {
  const data = error?.response?.data;
  const status = error?.response?.status;

  if (!error?.response) {
    return "No pudimos conectar con el servidor. Intentá de nuevo.";
  }
  if (status === 403) {
    return "No tenés permisos para reportar jugadores.";
  }
  if (status === 429) {
    return (
      data?.error ??
      "Hiciste varios reportes seguidos. Esperá un momento antes de volver a intentarlo."
    );
  }
  if (status === 404) {
    return (
      data?.error ??
      "No se pudo enviar el reporte: el jugador ya no existe o la función no está disponible."
    );
  }
  if (status === 422) {
    return "Revisá los datos del reporte: el motivo es obligatorio y la descripción no puede superar los 500 caracteres.";
  }
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;

  return "No se pudo enviar el reporte. Intentá de nuevo.";
}
