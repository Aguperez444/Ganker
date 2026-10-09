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
