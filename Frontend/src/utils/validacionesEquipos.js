// US 14 - Crear equipo.
// Mismas reglas que valida el backend (CreateTeam), repetidas aca para dar
// feedback antes de enviar. El backend sigue siendo la fuente de verdad: si
// algo se escapa, su mensaje se muestra igual (ver useCrearEquipo).

export const LARGO_MAXIMO_NOMBRE_EQUIPO = 100;
export const LARGO_MAXIMO_DESCRIPCION_EQUIPO = 500;

// Ninguno de los juegos soportados (LoL, Valorant, CS, Overwatch) arma
// equipos de mas de 5, pero se deja margen por si el catalogo crece.
export const CUPOS_VACANTES_MINIMO = 1;
export const CUPOS_VACANTES_MAXIMO = 9;

// Los rangos se comparan por `value` (la jerarquia del juego), nunca por id:
// el id solo indica el orden en que el admin los cargo.
export function rangoDentroDelRango(rango, rangoMinimo, rangoMaximo) {
  return rango.value >= rangoMinimo.value && rango.value <= rangoMaximo.value;
}

// `rangoMinimo`, `rangoMaximo` y `rangoJugador` son objetos de rango
// ({ rank_id, name, value }) o null si todavia no se eligieron. El rango del
// jugador es el de su perfil de rol para el rol con el que va a jugar.
// `regionJugador` es la region de su perfil de juego ({ region_id, name }) o
// null si no cargo ninguna.
export function validarFormularioEquipo({
  nombre,
  descripcion,
  videojuegoId,
  regionId,
  regionJugador,
  admiteOtrasRegiones,
  rangoMinimo,
  rangoMaximo,
  rangoJugador,
  rolCreadorId,
  rolesVacantesIds,
}) {
  const errores = {};

  if (!nombre.trim()) {
    errores.nombre = "Ingresá el nombre del equipo.";
  } else if (nombre.trim().length > LARGO_MAXIMO_NOMBRE_EQUIPO) {
    errores.nombre = `El nombre no puede superar los ${LARGO_MAXIMO_NOMBRE_EQUIPO} caracteres.`;
  }

  if (descripcion.trim().length > LARGO_MAXIMO_DESCRIPCION_EQUIPO) {
    errores.descripcion = `La descripción no puede superar los ${LARGO_MAXIMO_DESCRIPCION_EQUIPO} caracteres.`;
  }

  if (!videojuegoId) {
    errores.videojuego = "Elegí el videojuego del equipo.";
  }

  // Un equipo sin region solo tiene sentido si acepta cualquier region; el
  // backend lo rechaza igual (TeamWithoutRegionMustAllowOthersException).
  if (!regionId && !admiteOtrasRegiones) {
    errores.region = "Elegí una región o permití jugadores de otras regiones.";
  } else if (
    regionId &&
    !admiteOtrasRegiones &&
    String(regionJugador?.region_id) !== String(regionId)
  ) {
    // El creador tambien tiene que cumplir la regla de region del equipo
    // (InvalidRegionException en el backend).
    errores.region = regionJugador
      ? `Tu región es ${regionJugador.name}: elegila o permití jugadores de otras regiones.`
      : "Tu perfil de juego no tiene región: permití jugadores de otras regiones.";
  }

  if (!rangoMinimo) errores.rangoMinimo = "Elegí el rango mínimo.";
  if (!rangoMaximo) errores.rangoMaximo = "Elegí el rango máximo.";

  // Mismo rango en ambos esta permitido: el equipo admite un solo rango.
  if (rangoMinimo && rangoMaximo && rangoMinimo.value > rangoMaximo.value) {
    errores.rangoMaximo =
      "El rango mínimo no puede ser superior al rango máximo.";
  }

  if (!rolCreadorId) {
    errores.rolCreador = "Elegí el rol con el que vas a jugar.";
  } else if (
    rangoJugador &&
    rangoMinimo &&
    rangoMaximo &&
    !errores.rangoMaximo &&
    !rangoDentroDelRango(rangoJugador, rangoMinimo, rangoMaximo)
  ) {
    errores.rolCreador = `Tu rango (${rangoJugador.name}) tiene que estar entre el rango mínimo y el máximo del equipo.`;
  }

  if (
    rolesVacantesIds.length < CUPOS_VACANTES_MINIMO ||
    rolesVacantesIds.length > CUPOS_VACANTES_MAXIMO
  ) {
    errores.rolesVacantes = `El equipo tiene que tener entre ${CUPOS_VACANTES_MINIMO} y ${CUPOS_VACANTES_MAXIMO} cupos vacantes.`;
  } else if (rolesVacantesIds.some((rolId) => !rolId)) {
    errores.rolesVacantes = "Elegí un rol para cada cupo vacante.";
  }

  return errores;
}
