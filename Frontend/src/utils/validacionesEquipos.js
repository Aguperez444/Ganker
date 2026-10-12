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

// US 18 - Unirse a equipo.
// Igual que en Crear equipo, esto repite las reglas del backend
// (Team._validate_user_for_slot) solo para mostrar de antemano a que
// vacantes puede entrar el jugador. El backend sigue decidiendo.

// Perfil de juego del jugador para el videojuego del equipo, o null.
// `perfiles` es user.profiles de AuthContext.
export function perfilDelJuego(perfiles, videojuegoId) {
  return (
    (perfiles ?? []).find(
      (perfil) => String(perfil.videogame?.id) === String(videojuegoId)
    ) ?? null
  );
}

function rangoPermitidoTexto(equipo) {
  if (!equipo.min_rank || !equipo.max_rank) return "";
  return equipo.min_rank.rank_id === equipo.max_rank.rank_id
    ? equipo.min_rank.name
    : `${equipo.min_rank.name} a ${equipo.max_rank.name}`;
}

// Motivo por el que el jugador no puede ocupar `vacante` (un elemento de
// equipo.members con is_vacant), o null si cumple los requisitos.
// Mismo orden de chequeos que el backend: perfil de juego, perfil de rol,
// region y rango.
export function motivoVacanteNoDisponible({ equipo, vacante, perfil }) {
  if (!perfil) {
    return `Necesitás un perfil de ${equipo.videogame?.name ?? "este juego"} para unirte.`;
  }

  const rolVacante = vacante.active_game_profile.active_role_profile;
  const perfilRol = (perfil.role_profiles ?? []).find(
    (pr) => String(pr.role?.role_id) === String(rolVacante.role_id)
  );
  if (!perfilRol) {
    return `No tenés un perfil para el rol ${rolVacante.role_name}.`;
  }

  if (!equipo.allow_other_regions && equipo.region?.region_id) {
    if (String(perfil.region?.region_id) !== String(equipo.region.region_id)) {
      return `El equipo solo admite jugadores de ${equipo.region.region_name}.`;
    }
  }

  if (
    equipo.min_rank &&
    equipo.max_rank &&
    !rangoDentroDelRango(perfilRol.rank, equipo.min_rank, equipo.max_rank)
  ) {
    return `Tu rango como ${rolVacante.role_name} (${perfilRol.rank.name}) está fuera del rango del equipo (${rangoPermitidoTexto(equipo)}).`;
  }

  return null;
}

// Los mensajes de dominio del backend (al unirse, y el `reason` de
// join_eligibility) traen IDs internos y el status no alcanza para
// distinguirlos (rango, region y cupo son todos 400). Se reconocen por su
// texto y se reemplazan por uno pensado para el jugador.
const RECHAZOS_AL_UNIRSE = [
  {
    patron: /está completo/i,
    mensaje: () => "El equipo ya no tiene vacantes disponibles.",
  },
  {
    patron: /solo admite jugadores de la región/i,
    mensaje: (equipo) =>
      equipo?.region?.region_name
        ? `El equipo solo admite jugadores de ${equipo.region.region_name} y tu perfil es de otra región.`
        : "El equipo no admite jugadores de tu región.",
  },
  {
    patron: /rango con ID .* no es válido/i,
    mensaje: (equipo) =>
      equipo && rangoPermitidoTexto(equipo)
        ? `Tu rango está fuera del rango permitido por el equipo (${rangoPermitidoTexto(equipo)}).`
        : "Tu rango está fuera del rango permitido por el equipo.",
  },
  {
    patron: /perfil de juego .*no fue encontrado/i,
    mensaje: (equipo) =>
      `Necesitás un perfil de ${equipo?.videogame?.name ?? "este juego"} para unirte.`,
  },
  {
    patron: /no tiene un perfil de rol válido/i,
    mensaje: () => "No tenés un perfil para el rol de esa vacante.",
  },
  {
    patron: /ya forma parte de un equipo activo/i,
    mensaje: () =>
      "Ya formás parte de otro equipo activo. Tenés que salir de él para unirte a otro.",
  },
  {
    patron: /ya está en el equipo/i,
    mensaje: () => "Ya sos miembro de este equipo.",
  },
  {
    patron: /ya está ocupado/i,
    mensaje: () => "Otro jugador acaba de ocupar esa vacante. Elegí otra.",
  },
  {
    patron: /ya no está activo/i,
    mensaje: () => "El equipo ya no está activo.",
  },
  {
    patron: /slot con ID .* no existe/i,
    mensaje: () => "Esa vacante ya no existe. Elegí otra.",
  },
];

export function mensajeDeRechazoAlUnirse(mensaje, equipo) {
  if (typeof mensaje !== "string" || !mensaje) return null;

  const rechazo = RECHAZOS_AL_UNIRSE.find(({ patron }) => patron.test(mensaje));
  if (rechazo) return rechazo.mensaje(equipo);

  // Mensajes ya pensados para el jugador ("Ya formás parte de otro equipo
  // activo") pasan tal cual; si traen IDs, mejor uno generico.
  return /\bid\b/i.test(mensaje)
    ? "No cumplís los requisitos para unirte a este equipo."
    : mensaje;
}

// Vacantes del equipo (members con is_vacant), cada una con el motivo por
// el que el jugador no podria ocuparla (null si puede).
export function vacantesDelEquipo(equipo, perfil) {
  return (equipo?.members ?? [])
    .filter((integrante) => integrante.is_vacant)
    .map((vacante) => ({
      ...vacante,
      motivo: motivoVacanteNoDisponible({ equipo, vacante, perfil }),
    }));
}

// Si el jugador puede unirse al equipo en general, segun lo que informa el
// backend en consultant_player_info (cupo, otro equipo activo, alguna
// vacante que cumpla). Su `reason` trae IDs, por eso se traduce.
export function elegibilidadDelEquipo(equipo) {
  const info = equipo?.consultant_player_info;

  if (info?.is_member) {
    return { puedeUnirse: false, motivo: "Ya sos miembro de este equipo." };
  }
  if (info?.join_eligibility?.can_join) {
    return { puedeUnirse: true, motivo: null };
  }

  return {
    puedeUnirse: false,
    motivo:
      mensajeDeRechazoAlUnirse(info?.join_eligibility?.reason, equipo) ??
      "No cumplís los requisitos para unirte a este equipo.",
  };
}
