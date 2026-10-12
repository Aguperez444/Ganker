import axiosClient from "./axiosClient";

// US 14 - Crear equipo.
// Va como multipart/form-data (no JSON) porque el endpoint acepta un icono
// opcional para el equipo:
//   POST /api/v1/teams -> name, description, allow_other_regions,
//   videogame_id, region_id, min_rank_id, max_rank_id, creator_game_role_id,
//   vacant_game_role_ids (Form) + team_icon (File, opcional)
//
// vacant_game_role_ids es una lista: FastAPI la arma a partir de varias
// entradas con la misma clave, por eso se hace un append por cada cupo.
//
// El mismo POST deja al creador como lider del equipo y crea el chatroom.
// Devuelve el TeamSummaryResponse del equipo creado.
export function crearEquipo({
  nombre,
  descripcion,
  videojuegoId,
  regionId,
  admiteOtrasRegiones,
  rangoMinimoId,
  rangoMaximoId,
  rolCreadorId,
  rolesVacantesIds,
}) {
  const formData = new FormData();
  formData.append("name", nombre.trim());
  formData.append("allow_other_regions", String(admiteOtrasRegiones));
  formData.append("videogame_id", videojuegoId);
  formData.append("min_rank_id", rangoMinimoId);
  formData.append("max_rank_id", rangoMaximoId);
  formData.append("creator_game_role_id", rolCreadorId);

  if (descripcion?.trim()) {
    formData.append("description", descripcion.trim());
  }

  if (regionId) {
    formData.append("region_id", regionId);
  }

  rolesVacantesIds.forEach((rolId) => {
    formData.append("vacant_game_role_ids", rolId);
  });

  return axiosClient
    .post("/api/v1/teams", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);
}

// Equipo activo del jugador logueado, o null si no pertenece a ninguno.
export function obtenerMiEquipo() {
  return axiosClient.get("/api/v1/teams/me").then((res) => res.data);
}

// US 17 - Buscar equipos activos de un videojuego (videogame_id obligatorio).
//   GET /api/v1/teams?videogame_id=&region_id=&rank_id=&vacant_slots=
//                     &role_id=&search=&page=&size=
// - rank_id: equipos cuyo rango minimo/maximo incluye ese rango.
// - vacant_slots: equipos con al menos esa cantidad de vacantes.
// - role_id: equipos con alguna vacante de ese rol.
// - search: coincidencia en nombre o descripcion.
// Los filtros vacios no se mandan (axios omite los undefined).
// Cada TeamSummaryResponse trae consultant_player_info.join_eligibility,
// que indica si el jugador logueado cumple los requisitos para unirse.
export function buscarEquipos({
  videojuegoId,
  regionId,
  rangoId,
  rolId,
  vacantesMinimas,
  texto,
  pagina = 1,
  tamanio = 20,
}) {
  return axiosClient
    .get("/api/v1/teams", {
      params: {
        videogame_id: videojuegoId,
        region_id: regionId || undefined,
        rank_id: rangoId || undefined,
        role_id: rolId || undefined,
        vacant_slots: vacantesMinimas || undefined,
        search: texto || undefined,
        page: pagina,
        size: tamanio,
      },
    })
    .then((res) => res.data);
}

// Un equipo puntual, con la info de quien consulta (consultant_player_info).
export function obtenerEquipo(equipoId) {
  return axiosClient.get(`/api/v1/teams/${equipoId}`).then((res) => res.data);
}

// US 18 - Unirse a equipo.
//   POST /api/v1/teams/{team_id}/join -> { target_team_member_role_id }
// El id es el del cupo vacante (members[].team_member_role_id), no el del rol.
// El backend valida cupo, rango, region, perfil de juego/rol y que el jugador
// no este en otro equipo activo; si pasa, lo suma al chatroom del equipo.
// Devuelve { status, message, chatroom_id, data: TeamSummaryResponse }.
export function unirseAEquipo(equipoId, vacanteId) {
  return axiosClient
    .post(`/api/v1/teams/${equipoId}/join`, {
      target_team_member_role_id: vacanteId,
    })
    .then((res) => res.data);
}

// US - Expulsar jugador del equipo.
//   DELETE /api/v1/teams/{team_id}/kick/{target_user_id}
// Solo el lider puede expulsar y no puede expulsarse a si mismo (lo valida el
// backend). Libera el cupo y saca al jugador del chatroom del equipo.
// Devuelve { status, message, data: TeamSummaryResponse }.
export function expulsarIntegrante(equipoId, usuarioId) {
  return axiosClient
    .delete(`/api/v1/teams/${equipoId}/kick/${usuarioId}`)
    .then((res) => res.data);
}

// US 43 - Transferir liderazgo de equipo.
//   POST /api/v1/teams/{team_id}/transfer-leadership/{target_user_id}
// Solo el lider puede transferirlo, a otro integrante del equipo (lo valida
// el backend). El lider anterior queda como integrante comun y el backend
// avisa del cambio a todos los integrantes por el socket de notificaciones.
// Devuelve { status, message, data: TeamSummaryResponse }.
export function transferirLiderazgo(equipoId, usuarioId) {
  return axiosClient
    .post(`/api/v1/teams/${equipoId}/transfer-leadership/${usuarioId}`)
    .then((res) => res.data);
}

// US 16 - Eliminar equipo.
//   DELETE /api/v1/teams/{team_id}
// Solo el lider puede disolverlo (lo valida el backend). El backend
// desvincula a todos los integrantes, cierra el chatroom del equipo y les
// avisa por el socket de notificaciones.
// Devuelve { status, message }.
export function eliminarEquipo(equipoId) {
  return axiosClient
    .delete(`/api/v1/teams/${equipoId}`)
    .then((res) => res.data);
}
