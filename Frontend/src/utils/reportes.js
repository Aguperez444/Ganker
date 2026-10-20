// Utilidades de los reportes del panel admin (US 37).

export const FORMATOS_EXPORTACION = [
  { valor: "csv", etiqueta: "CSV" },
  { valor: "excel", etiqueta: "Excel" },
  { valor: "pdf", etiqueta: "PDF" },
];

// Las fechas del periodo llegan como datetime sin zona ("2026-10-01T00:00:00").
// Representan un dia, asi que se toma solo la parte de la fecha: pasarlas por
// new Date() las correria un dia en husos negativos como el de Argentina.
export function formatearFechaReporte(fechaIso) {
  if (!fechaIso) return null;
  const [anio, mes, dia] = fechaIso.slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
}

export function describirPeriodo({ start_date, end_date }) {
  if (!start_date && !end_date) return "Histórico total";
  const desde = formatearFechaReporte(start_date) ?? "el inicio";
  const hasta = formatearFechaReporte(end_date) ?? "la fecha de generación";
  return `Del ${desde} al ${hasta}`;
}

// `generated_at` es un datetime UTC sin zona: se le agrega la Z para que el
// navegador lo muestre en la hora local.
export function formatearGeneradoEl(fechaIso) {
  if (!fechaIso) return "";
  const conZona = /[zZ]|[+-]\d\d:\d\d$/.test(fechaIso)
    ? fechaIso
    : `${fechaIso}Z`;
  return new Date(conZona).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

// Variacion respecto al reporte previo, ej. "+3 (+25%)", "-2 (-10%)", "0".
// Sin porcentaje cuando antes habia 0 perfiles (el backend manda null).
export function formatearVariacion(variation, variationPercentage) {
  if (variation === null || variation === undefined) return "—";
  const signo = variation > 0 ? "+" : "";
  const absoluta = `${signo}${variation}`;
  if (variationPercentage === null || variationPercentage === undefined) {
    return absoluta;
  }
  return `${absoluta} (${signo}${variationPercentage}%)`;
}

// Fechas como "YYYY-MM-DD" (lo que usan <input type="date"> y el backend).
// Se comparan como texto: en ese formato el orden alfabetico es el cronologico.
// Devuelve el mensaje de error o "" si el periodo es valido.
export function validarPeriodoReporte({ fechaInicio, fechaFin, inicioMinimo }) {
  if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
    return "La fecha inicial no puede ser posterior a la fecha final.";
  }
  if (inicioMinimo && fechaInicio && fechaInicio < inicioMinimo) {
    return `Ya existe un reporte hasta el ${formatearFechaReporte(
      restarUnDia(inicioMinimo)
    )}: la fecha inicial tiene que ser a partir del ${formatearFechaReporte(
      inicioMinimo
    )}.`;
  }
  return "";
}

function restarUnDia(fecha) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const d = new Date(Date.UTC(anio, mes - 1, dia - 1));
  return d.toISOString().slice(0, 10);
}
