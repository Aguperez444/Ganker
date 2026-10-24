import axiosClient from "./axiosClient";

// US 35 - Reportar a otro jugador.
//   POST /api/v1/moderation/ -> { reported_id, reason, description }
//
// `reason` es uno de los valores de ReportReason en el backend:
// cheating | abusive_behavior | spamming | inappropriate_content | other.
// La descripcion es opcional para el jugador, pero el backend la declara
// obligatoria en el request: se manda siempre, vacia si no escribio nada.
export function reportarJugador({ reportedId, motivo, descripcion }) {
  return axiosClient
    .post("/api/v1/moderation/", {
      reported_id: Number(reportedId),
      reason: motivo,
      description: (descripcion ?? "").trim(),
    })
    .then((res) => res.data);
}

// US 36 - Banear jugador.
//   POST /api/v1/moderation/ban -> { player_id, reason, duration_days }
//
// Requiere admin u owner (require_admin). El backend rechaza banearse a uno
// mismo y banear a un admin de igual o mayor jerarquia.
export function banearJugador({ jugadorId, motivo, duracionDias }) {
  return axiosClient
    .post("/api/v1/moderation/ban", {
      player_id: Number(jugadorId),
      reason: (motivo ?? "").trim(),
      duration_days: Number(duracionDias),
    })
    .then((res) => res.data);
}

// Buscar jugadores baneados (admin).
//   GET /api/v1/moderation/banned-players?banned_user=&banned_by=&reason=
//       &min_date_create=&max_date_create=&min_date_expire=&max_date_expire=
//       &skip=&limit=
//
// Devuelve el historial de baneos (vigentes, vencidos y levantados), ordenado
// del más nuevo al más viejo y sin los usuarios borrados: [{ id,
// banned_by_user_id, banned_by_user_username, banned_user_id,
// banned_user_username, date_created, date_expire, reason }].
// Los nombres buscan coincidencias parciales; `reason`, el motivo exacto.
// Las fechas van en ISO 8601. No devuelve el total de resultados.
export function buscarBaneos({
  usuario,
  admin,
  motivo,
  creadoDesde,
  creadoHasta,
  vencimientoDesde,
  vencimientoHasta,
  skip = 0,
  limit = 10,
} = {}) {
  return axiosClient
    .get("/api/v1/moderation/banned-players", {
      params: {
        banned_user: usuario || undefined,
        banned_by: admin || undefined,
        reason: motivo || undefined,
        min_date_create: creadoDesde || undefined,
        max_date_create: creadoHasta || undefined,
        min_date_expire: vencimientoDesde || undefined,
        max_date_expire: vencimientoHasta || undefined,
        skip,
        limit,
      },
    })
    .then((res) => res.data.list_banned_players ?? []);
}

// US 53 - Levantar la suspensión de un jugador (admin).
//   POST /api/v1/moderation/{player_id}/unban
//
// Marca el baneo vigente como vencido y reactiva la cuenta. El backend
// rechaza con 400 si el jugador no está baneado y con 403 si no hay permisos.
export function desbanearJugador(jugadorId) {
  return axiosClient
    .post(`/api/v1/moderation/${Number(jugadorId)}/unban`)
    .then((res) => res.data);
}
