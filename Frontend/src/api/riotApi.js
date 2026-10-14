import axiosClient from "./axiosClient";

// Cuenta de Riot vinculada a un perfil de juego de League of Legends.
// Todas devuelven { supported, linked, riot_id, server, last_synced_at,
// next_refresh_at, rank_sync, stats } (ver GetRiotAccountLinkResponse).

// Estadisticas guardadas: no consulta a Riot, la puede ver cualquier jugador.
export const getRiotAccount = async (gameProfileId) => {
  const response = await axiosClient.get(
    `/api/v1/game_profiles/${gameProfileId}/riot`
  );

  return response.data;
};

// `server` es el codigo de plataforma de Riot (ej. "la2" para LAS).
export const linkRiotAccount = async (gameProfileId, { riotId, server }) => {
  const response = await axiosClient.post(
    `/api/v1/game_profiles/${gameProfileId}/riot`,
    { riot_id: riotId, server }
  );

  return response.data;
};

export const refreshRiotStats = async (gameProfileId) => {
  const response = await axiosClient.post(
    `/api/v1/game_profiles/${gameProfileId}/riot/refresh`
  );

  return response.data;
};

export const unlinkRiotAccount = async (gameProfileId) => {
  const response = await axiosClient.delete(
    `/api/v1/game_profiles/${gameProfileId}/riot`
  );

  return response.data;
};
