import axiosClient from "./axiosClient";

// US 03 - Buscar equipos (GET /api/v1/teams).
// Solo devuelve equipos activos con al menos un cupo vacante, filtrables por
// videojuego, región, rango, cantidad de vacantes, rol disponible y texto
// (nombre o descripción). Si el usuario está autenticado (siempre acá), cada
// equipo trae además consultant_player_info. El backend pagina por page/size
// y devuelve una lista plana (sin total de páginas): "hay más" se infiere
// cuando la página viene completa.
export function buscarEquipos({
  videogame_id,
  region_id,
  rank_id,
  vacant_slots,
  role_id,
  search,
  page = 1,
  size = 20,
} = {}) {
  return axiosClient
    .get("/api/v1/teams", {
      params: {
        videogame_id,
        region_id,
        rank_id,
        vacant_slots,
        role_id,
        search: search?.trim() || undefined,
        page,
        size,
      },
    })
    .then((res) => res.data);
}

// Equipo activo del jugador logueado (null si no pertenece a ninguno).
export function obtenerMiEquipo() {
  return axiosClient.get("/api/v1/teams/me").then((res) => res.data);
}

// Detalle de un equipo puntual (con los datos que dependen del que consulta).
export function obtenerEquipo(teamId) {
  return axiosClient.get(`/api/v1/teams/${teamId}`).then((res) => res.data);
}

// Se une a la vacante puntual de un equipo. El backend aloja al jugador en el
// slot `target_team_member_role_id` (el rol que ese slot tiene asignado).
// Devuelve { status, message, chatroom_id, data }.
export function unirseAEquipo(teamId, targetTeamMemberRoleId) {
  return axiosClient
    .post(`/api/v1/teams/${teamId}/join`, {
      target_team_member_role_id: targetTeamMemberRoleId,
    })
    .then((res) => res.data);
}

// US 04 - Modificar equipo (PUT /api/v1/teams/{id}). Solo el líder del equipo
// puede hacerlo (el backend valida y responde 403 si no). El payload no lleva
// el videojuego: no se puede cambiar. Devuelve { status, message, data } con
// el resumen actualizado del equipo.
export function actualizarEquipo(
  teamId,
  { name, description, allow_other_regions, region_id, min_rank_id, max_rank_id }
) {
  return axiosClient
    .put(`/api/v1/teams/${teamId}`, {
      name,
      description,
      allow_other_regions,
      region_id,
      min_rank_id,
      max_rank_id,
    })
    .then((res) => res.data);
}