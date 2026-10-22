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

// US 53 - Jugadores con un baneo vigente (requiere admin).
//   GET /api/v1/moderation/banned-players/active?username=&skip=&limit=
//
// El backend ya filtra los vencidos y los levantados. `limit` va de 1 a 100.
// Devuelve [{ user_id, username, reason, expires_at }], con expires_at null
// si el baneo no vence.
export function obtenerJugadoresBaneados({
  username,
  skip = 0,
  limit = 100,
} = {}) {
  return axiosClient
    .get("/api/v1/moderation/banned-players/active", {
      params: { username: username || undefined, skip, limit },
    })
    .then((res) => res.data.players ?? []);
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
