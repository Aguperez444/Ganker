import axiosClient from "./axiosClient";

// Cuenta de Discord vinculada al perfil general (OAuth2 "Conectar con
// Discord"). Las respuestas de cuenta son { linked, discord_user_id, username,
// display_name, avatar_url, profile_url, visibility, linked_at } (ver
// GetDiscordAccountResponse); `visibility` y `linked_at` solo llegan al dueño.

export const getMyDiscord = async () => {
  const response = await axiosClient.get("/api/v1/users/me/discord");
  return response.data;
};

// Discord de otro jugador: si no lo comparte con quien consulta, llega
// { linked: false }, igual que si no tuviera.
export const getPlayerDiscord = async (userId) => {
  const response = await axiosClient.get(`/api/v1/users/${userId}/discord`);
  return response.data;
};

// Primer paso: URL de discord.com a la que se manda al jugador.
export const getDiscordAuthorizeUrl = async () => {
  const response = await axiosClient.get("/api/v1/users/me/discord/authorize");
  return response.data.authorization_url;
};

// Segundo paso: con el `code` y el `state` que devolvio Discord en el callback.
export const linkDiscord = async ({ code, state, visibility }) => {
  const response = await axiosClient.post("/api/v1/users/me/discord", {
    code,
    state,
    visibility,
  });
  return response.data;
};

// "everyone" (todos los jugadores) o "teammates" (companeros de equipo).
export const updateDiscordVisibility = async (visibility) => {
  const response = await axiosClient.put(
    "/api/v1/users/me/discord/visibility",
    { visibility }
  );
  return response.data;
};

export const unlinkDiscord = async () => {
  const response = await axiosClient.delete("/api/v1/users/me/discord");
  return response.data;
};
