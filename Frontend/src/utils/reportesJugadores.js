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

// El backend manda la fecha en ISO dentro del mensaje (ej. el 429 del limite
// de reportes): se reemplaza por la fecha en hora local.
const FECHA_ISO =
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?/;

function conFechaLocal(mensaje) {
  return mensaje.replace(FECHA_ISO, (iso) => {
    const fecha = new Date(/Z|[+-]\d{2}:\d{2}$/.test(iso) ? iso : `${iso}Z`);
    if (Number.isNaN(fecha.getTime())) return iso;

    return fecha.toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  });
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
  // US 35 - Limite de reportes al mismo jugador: lo controla el backend.
  if (status === 429) {
    return typeof data?.error === "string"
      ? conFechaLocal(data.error)
      : "Ya reportaste a este jugador recientemente. Esperá antes de volver a intentarlo.";
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
