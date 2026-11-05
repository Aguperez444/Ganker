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

// Evidencia opcional: una imagen y/o un link de YouTube. El backend vuelve a
// validar ambos (tipo real del archivo, 5 MB y formato del link).
export const TIPOS_IMAGEN_EVIDENCIA = ["image/png", "image/jpeg", "image/webp"];
export const TAMANO_MAXIMO_EVIDENCIA_MB = 5;

const ID_VIDEO_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;
const HOSTS_YOUTUBE = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
];
const HOSTS_YOUTUBE_CORTO = ["youtu.be", "www.youtu.be"];
const PREFIJOS_RUTA_YOUTUBE = ["/shorts/", "/embed/", "/live/", "/v/"];

// Devuelve el id del video si el link es de YouTube (watch, youtu.be, shorts,
// embed o live), o null si no lo es. Misma regla que YoutubeUrlService.
export function idDeVideoYoutube(link) {
  let url;
  try {
    url = new URL((link ?? "").trim());
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(url.protocol)) return null;

  const host = url.hostname.toLowerCase();
  let id = null;

  if (HOSTS_YOUTUBE_CORTO.includes(host)) {
    id = url.pathname.replace(/^\/+/, "").split("/")[0];
  } else if (HOSTS_YOUTUBE.includes(host)) {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else {
      const prefijo = PREFIJOS_RUTA_YOUTUBE.find((p) =>
        url.pathname.startsWith(p)
      );
      if (prefijo) id = url.pathname.slice(prefijo.length).split("/")[0];
    }
  }

  return id && ID_VIDEO_YOUTUBE.test(id) ? id : null;
}

export function validarImagenEvidencia(imagen) {
  if (!imagen) return undefined;
  if (!TIPOS_IMAGEN_EVIDENCIA.includes(imagen.type)) {
    return "La imagen debe ser PNG, JPG o WEBP.";
  }
  if (imagen.size > TAMANO_MAXIMO_EVIDENCIA_MB * 1024 * 1024) {
    return `La imagen no puede superar los ${TAMANO_MAXIMO_EVIDENCIA_MB} MB.`;
  }
  return undefined;
}

export function nombreDeMotivoReporte(motivo) {
  return (
    MOTIVOS_REPORTE.find((opcion) => opcion.value === motivo)?.label ?? motivo
  );
}

export function validarFormularioReporte({
  motivo,
  descripcion,
  imagen,
  linkVideo,
}) {
  const errores = {};

  if (!motivo) {
    errores.motivo = "Seleccioná un motivo para el reporte.";
  } else if (!MOTIVOS_REPORTE.some((opcion) => opcion.value === motivo)) {
    errores.motivo = "Seleccioná un motivo válido para el reporte.";
  }

  if ((descripcion ?? "").trim().length > LARGO_MAXIMO_DESCRIPCION_REPORTE) {
    errores.descripcion = `La descripción no puede superar los ${LARGO_MAXIMO_DESCRIPCION_REPORTE} caracteres.`;
  }

  const errorImagen = validarImagenEvidencia(imagen);
  if (errorImagen) errores.imagen = errorImagen;

  if ((linkVideo ?? "").trim() && !idDeVideoYoutube(linkVideo)) {
    errores.linkVideo = "Pegá un link válido de un video de YouTube.";
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
    return "Revisá los datos del reporte: el motivo es obligatorio, la descripción no puede superar los 500 caracteres y el link de video no puede superar los 500.";
  }
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;

  return "No se pudo enviar el reporte. Intentá de nuevo.";
}
