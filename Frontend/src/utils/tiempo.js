// Formatea un timestamp de ultima conexion como texto relativo corto
// ("hace 5 min", "hace 2 h", "hace 3 d"). Usado en Buscar jugadores, donde
// el backend ya filtra a jugadores conectados en los ultimos 4 dias (ver
// ByLastConnectionSpecification), asi que nunca deberia superar los dias.
export function formatearConexionReciente(timestamp) {
  if (!timestamp) return null;

  const fecha = new Date(timestamp);
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
