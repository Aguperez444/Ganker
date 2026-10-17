// La visibilidad elegida antes de ir a discord.com y el resultado de la
// conexion tienen que sobrevivir a la redireccion: se guardan un momento en
// sessionStorage. Siempre con try/catch: en modo privado puede fallar, y en
// ese caso se usa el valor por defecto.
const CLAVE_VISIBILIDAD = "ganker_discord_visibilidad";
const CLAVE_MENSAJE = "ganker_discord_mensaje";

export const VISIBILIDADES_DISCORD = [
  { value: "teammates", label: "Solo mis compañeros de equipo" },
  { value: "everyone", label: "Todos los jugadores" },
];

export const VISIBILIDAD_POR_DEFECTO = "teammates";

function guardar(clave, valor) {
  try {
    sessionStorage.setItem(clave, valor);
  } catch {
    // Sin sessionStorage se pierde solo la preferencia, no la conexion
  }
}

function tomar(clave) {
  try {
    const valor = sessionStorage.getItem(clave);
    sessionStorage.removeItem(clave);
    return valor;
  } catch {
    return null;
  }
}

export function guardarVisibilidadPendiente(visibilidad) {
  guardar(CLAVE_VISIBILIDAD, visibilidad);
}

export function tomarVisibilidadPendiente() {
  const valor = tomar(CLAVE_VISIBILIDAD);
  return VISIBILIDADES_DISCORD.some((v) => v.value === valor)
    ? valor
    : VISIBILIDAD_POR_DEFECTO;
}

export function guardarMensajeDiscord(mensaje) {
  guardar(CLAVE_MENSAJE, JSON.stringify(mensaje));
}

// { tipo: "exito" | "error", texto } o null.
export function tomarMensajeDiscord() {
  const valor = tomar(CLAVE_MENSAJE);
  if (!valor) return null;
  try {
    return JSON.parse(valor);
  } catch {
    return null;
  }
}
