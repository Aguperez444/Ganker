// El backend conserva algunos timestamps UTC sin zona en el esquema actual.
// Agregar Z solo si falta la zona; los offsets explícitos ya definen el instante.
// La conversión a la hora local se hace al mostrar la fecha.
export function parsearFechaUTC(timestamp) {
  const sinZona =
    typeof timestamp === "string" &&
    /[T ]\d{2}:\d{2}/.test(timestamp) &&
    !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(timestamp);
  return new Date(sinZona ? `${timestamp}Z` : timestamp);
}

// Formatea un timestamp de ultima conexion como texto relativo corto
// ("hace 5 min", "hace 2 h", "hace 3 d"). Usado en Buscar jugadores, donde
// el backend ya filtra a jugadores conectados en los ultimos 4 dias (ver
// ByLastConnectionSpecification), asi que nunca deberia superar los dias.
export function formatearConexionReciente(timestamp) {
  if (!timestamp) return null;

  const fecha = parsearFechaUTC(timestamp);
  if (Number.isNaN(fecha.getTime())) return null;

  const segundos = Math.floor((Date.now() - fecha.getTime()) / 1000);
  if (segundos < 60) return "Conectado hace instantes";

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `Conectado hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Conectado hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  return `Conectado hace ${dias} d`;
}

// Texto relativo corto para una fecha pasada: "hace instantes", "hace 5 min",
// "hace 2 h", "hace 3 d". Usado en las estadisticas de Riot.
export function formatearTiempoRelativo(timestamp) {
  if (!timestamp) return "";

  const fecha = parsearFechaUTC(timestamp);
  if (Number.isNaN(fecha.getTime())) return "";

  const segundos = Math.max(
    0,
    Math.floor((Date.now() - fecha.getTime()) / 1000)
  );
  if (segundos < 60) return "hace instantes";

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  return `hace ${Math.floor(horas / 24)} d`;
}
