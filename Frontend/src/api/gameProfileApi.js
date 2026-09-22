import axiosClient from "./axiosClient";

export const getCharactersByGame = async (gameId) => {
  const response = await axiosClient.get(`/api/v1/characters/${gameId}`);

  return response.data.characters;
};

export const getRolesByGame = async (gameId) => {
  const response = await axiosClient.get(`/api/v1/roles/${gameId}`);

  return response.data.roles;
};

export const getRanksByGame = async (gameId) => {
  const response = await axiosClient.get(`/api/v1/ranks/${gameId}`);

  return response.data.ranks;
};

export const createGameProfile = async (profileData) => {
  const response = await axiosClient.post(
    "/api/v1/game_profiles/",
    profileData
  );

  return response.data;
};

// US 03 - Buscar jugadores.
// La respuesta trae { videogame_profiles: [...] }, cada uno con un "player"
// anidado ({ player_id, player_name, icon_url, last_connection }) en vez de
// username/name sueltos como en el resto de la app (ver mapeo en
// hooks/useBuscarJugadores.js). El filtro por conexion reciente NO viaja en
// este request: el backend lo aplica siempre, fijo a los ultimos 4 dias, y
// tambien excluye de entrada al jugador logueado.
export const searchGameProfiles = async (filters) => {
  const response = await axiosClient.post(
    "/api/v1/game_profiles/search",
    filters
  );

  return response.data.videogame_profiles;
};

// US 08 - Editar perfil de juego.
// El videojuego no viaja en el body: PUT /api/v1/game_profiles/{id} lo toma
// del perfil existente y no se puede cambiar (regla de negocio).
export const updateGameProfile = async (gameProfileId, profileData) => {
  const response = await axiosClient.put(
    `/api/v1/game_profiles/${gameProfileId}`,
    profileData
  );

  return response.data;
};
