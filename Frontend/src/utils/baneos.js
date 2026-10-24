// US 36 - Banear jugador (admin).
//
// El backend define los baneos con una duracion en dias (duration_days >= 1).
// No hay un "permanente" como tal: el valor que se manda en dias es lo que
// dura la sancion, y al vencer el backend desbanea solo al jugador. El baneo
// "Permanente" de la UI manda DIAS_BANEO_PERMANENTE (unos 100 años).
export const LARGO_MAXIMO_MOTIVO_BANEO = 500;

export const DIAS_MINIMOS_BANEO = 1;

// Tope de la UI: el backend no tiene maximo de negocio, pero un input sin
// limite es incomodo y propenso a errores de tipeo (ej. 3650 en vez de 365).
export const DIAS_MAXIMOS_BANEO = 36500;

// US 36 - Baneo permanente: el backend no lo soporta, se manda el tope de dias.
export const DIAS_BANEO_PERMANENTE = DIAS_MAXIMOS_BANEO;

// Un vencimiento a mas de este plazo se muestra como permanente en el listado.
const ANIOS_PARA_CONSIDERAR_PERMANENTE = 50;

// Presets que cubren los casos habituales de sancion.
export const DURACIONES_BANEO = [
  { value: 1, label: "1 día" },
  { value: 3, label: "3 días" },
  { value: 7, label: "7 días" },
  { value: 30, label: "30 días" },
  { value: 365, label: "1 año" },
  { value: DIAS_BANEO_PERMANENTE, label: "Permanente" },
];

export function esBaneoPermanente(dias) {
  return Number(dias) >= DIAS_BANEO_PERMANENTE;
}

// Valida el formulario de baneo. `miId` (opcional) permite frenar el baneo de
// la propia cuenta antes de llegar al backend (que tambien lo rechaza).
export function validarFormularioBaneo({
  jugador,
  motivo,
  duracionDias,
  miId,
}) {
  const errores = {};

  if (!jugador?.user_id) {
    errores.jugador = "Seleccioná un jugador para banear.";
  } else if (miId != null && jugador.user_id === miId) {
    errores.jugador = "No podés banear tu propia cuenta.";
  }

  const motivoLimpio = (motivo ?? "").trim();
  if (!motivoLimpio) {
    errores.motivo = "Ingresá el motivo del baneo.";
  } else if (motivoLimpio.length > LARGO_MAXIMO_MOTIVO_BANEO) {
    errores.motivo = `El motivo no puede superar los ${LARGO_MAXIMO_MOTIVO_BANEO} caracteres.`;
  }

  const dias = Number(duracionDias);
  if (!Number.isInteger(dias) || dias < DIAS_MINIMOS_BANEO) {
    errores.duracion = `La duración debe ser de al menos ${DIAS_MINIMOS_BANEO} día.`;
  } else if (dias > DIAS_MAXIMOS_BANEO) {
    errores.duracion = `La duración no puede superar los ${DIAS_MAXIMOS_BANEO} días.`;
  }

  return errores;
}

export function formatearDuracionBaneo(dias) {
  const cantidad = Number(dias);
  if (!Number.isFinite(cantidad)) return "";
  if (esBaneoPermanente(cantidad)) return "Permanente";
  return cantidad === 1 ? "1 día" : `${cantidad} días`;
}

// El backend puede mandar las fechas con zona (o sin ella): se normaliza
// agregando la Z para mostrarlas en la hora local.
function fechaDesdeBackend(fechaIso) {
  if (!fechaIso) return null;

  const conZona = /[zZ]|[+-]\d\d:\d\d$/.test(fechaIso)
    ? fechaIso
    : `${fechaIso}Z`;
  const fecha = new Date(conZona);

  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function esVencimientoPermanente(fechaIso) {
  const fecha = fechaDesdeBackend(fechaIso);
  if (!fecha) return false;

  return (
    fecha.getFullYear() - new Date().getFullYear() >=
    ANIOS_PARA_CONSIDERAR_PERMANENTE
  );
}

// Fecha de vencimiento como texto, para el listado de baneos.
export function formatearVencimiento(fechaIso) {
  const fecha = fechaDesdeBackend(fechaIso);
  if (!fecha) return "sin vencimiento";

  return formatearFechaBaneo(fechaIso);
}

// Fecha y hora local de un baneo (cuándo se aplicó o cuándo vence).
export function formatearFechaBaneo(fechaIso) {
  const fecha = fechaDesdeBackend(fechaIso);
  if (!fecha) return "";

  return fecha.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

// Buscar jugadores baneados: el historial trae también los baneos vencidos y
// los levantados a mano (el backend les pone como vencimiento el momento del
// desbaneo), así que un registro está vigente si no vence o vence más
// adelante. Solo decide si se ofrece "Desbanear": el backend vuelve a
// validarlo y responde 400 si el jugador ya no está baneado.
export function esBaneoVigente(fechaIso, ahora = new Date()) {
  if (!fechaIso) return true;

  const fecha = fechaDesdeBackend(fechaIso);
  return fecha !== null && fecha > ahora;
}

export const FILTROS_BANEOS_VACIOS = {
  usuario: "",
  admin: "",
  motivo: "",
  creadoDesde: "",
  creadoHasta: "",
  vencimientoDesde: "",
  vencimientoHasta: "",
};

export function hayFiltrosDeBaneos(filtros) {
  return Object.values(filtros ?? {}).some((valor) => valor.trim() !== "");
}

// Los <input type="date"> dan "YYYY-MM-DD" sin hora. Para que "hasta el 10"
// incluya todo ese día, el rango va del inicio del día "desde" al final del
// día "hasta", en la hora local del admin, y viaja al backend en UTC.
function inicioDelDia(fecha) {
  return fecha ? new Date(`${fecha}T00:00:00`).toISOString() : undefined;
}

function finDelDia(fecha) {
  return fecha ? new Date(`${fecha}T23:59:59.999`).toISOString() : undefined;
}

// Filtros del formulario -> parámetros de buscarBaneos. Los nombres se
// aceptan con o sin @, como en el resto de Moderación.
export function armarFiltrosBusquedaBaneos(filtros = FILTROS_BANEOS_VACIOS) {
  const sinArroba = (texto) => (texto ?? "").trim().replace(/^@/, "");

  return {
    usuario: sinArroba(filtros.usuario),
    admin: sinArroba(filtros.admin),
    motivo: (filtros.motivo ?? "").trim(),
    creadoDesde: inicioDelDia(filtros.creadoDesde),
    creadoHasta: finDelDia(filtros.creadoHasta),
    vencimientoDesde: inicioDelDia(filtros.vencimientoDesde),
    vencimientoHasta: finDelDia(filtros.vencimientoHasta),
  };
}

// Mismo criterio que validarPeriodoReporte: en "YYYY-MM-DD" el orden
// alfabético es el cronológico.
export function validarFiltrosBaneos(filtros) {
  const errores = {};

  if (
    filtros.creadoDesde &&
    filtros.creadoHasta &&
    filtros.creadoDesde > filtros.creadoHasta
  ) {
    errores.creado = "La fecha inicial no puede ser posterior a la final.";
  }
  if (
    filtros.vencimientoDesde &&
    filtros.vencimientoHasta &&
    filtros.vencimientoDesde > filtros.vencimientoHasta
  ) {
    errores.vencimiento = "La fecha inicial no puede ser posterior a la final.";
  }

  return errores;
}

export function mensajeDeErrorBusquedaBaneos(error) {
  const data = error?.response?.data;
  const status = error?.response?.status;

  if (!error?.response) {
    return "No pudimos conectar con el servidor. Intentá de nuevo.";
  }
  if (status === 403) {
    return "No tenés permisos para ver los baneos.";
  }
  if (status === 422) {
    return "Revisá los filtros: alguna fecha no es válida.";
  }
  if (typeof data?.error === "string") return data.error;

  return "No se pudo cargar la lista de baneados.";
}

// US 36 - Mensaje del login para una cuenta suspendida. El backend manda
// "El baneo del jugador aún no ha finalizado. Motivo: <motivo>. Vencimiento:
// <fecha ISO>" (o ". Sin fecha de vencimiento"): se arma un texto legible con
// la fecha en hora local. Si el formato no coincide, se muestra tal cual.
export function mensajeDeCuentaBaneada(mensajeBackend) {
  const coincidencia =
    /Motivo: (.+?)(?:\. Vencimiento: (\S+)|\. Sin fecha de vencimiento)?$/.exec(
      mensajeBackend ?? ""
    );
  if (!coincidencia) {
    return (
      mensajeBackend || "Tu cuenta está suspendida y no puede iniciar sesión."
    );
  }

  const [, motivo, vencimiento] = coincidencia;
  const duracion =
    !vencimiento || esVencimientoPermanente(vencimiento)
      ? "La suspensión es permanente."
      : `La suspensión vence el ${formatearVencimiento(vencimiento)}.`;

  return `Tu cuenta está suspendida. Motivo: ${motivo}. ${duracion}`;
}

// Los errores de dominio del backend llegan en `error`; los de validacion de
// FastAPI (422), en `detail`.
export function mensajeDeErrorBaneo(error) {
  const data = error?.response?.data;
  const status = error?.response?.status;

  if (!error?.response) {
    return "No pudimos conectar con el servidor. Intentá de nuevo.";
  }
  if (status === 403) {
    return data?.error ?? "No tenés permisos para banear a este jugador.";
  }
  if (status === 422) {
    return "Revisá los datos: el motivo es obligatorio y la duración debe ser de al menos un día.";
  }
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;

  return "No se pudo banear al jugador. Intentá de nuevo.";
}

// US 36 - Errores al desbanear a mano.
//   400 = el jugador no está baneado (o es uno mismo), 403 = sin permisos.
export function mensajeDeErrorDesbaneo(error) {
  const data = error?.response?.data;
  const status = error?.response?.status;

  if (!error?.response) {
    return "No pudimos conectar con el servidor. Intentá de nuevo.";
  }
  if (status === 403) {
    return data?.error ?? "No tenés permisos para desbanear a este jugador.";
  }
  if (status === 404) {
    return "El jugador no existe o ya fue dado de baja.";
  }
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;

  return "No se pudo desbanear al jugador. Intentá de nuevo.";
}
