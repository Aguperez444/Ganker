import axiosClient from "./axiosClient";

/**
 * US 01 / US 02 / US 03 - API de Equipos y Salas de Chat (Lobby).
 */

export const searchTeams = async (filters = {}) => {
  const params = {};

  if (filters.videogame_id) params.videogame_id = Number(filters.videogame_id);
  if (filters.region_id) params.region_id = Number(filters.region_id);
  if (filters.rank_id) params.rank_id = Number(filters.rank_id);
  if (
    filters.vacant_slots !== undefined &&
    filters.vacant_slots !== null &&
    filters.vacant_slots !== ""
  ) {
    params.vacant_slots = Number(filters.vacant_slots);
  }
  if (filters.role_id) params.role_id = Number(filters.role_id);
  if (filters.search && filters.search.trim()) {
    params.search = filters.search.trim();
  }

  const response = await axiosClient.get("/api/v1/teams", { params });
  return response.data;
};

export const createTeam = async (teamData) => {
  const payload = {
    name: teamData.name.trim(),
    description: teamData.description?.trim() || null,
    icon_url: teamData.icon_url?.trim() || null,
    allow_other_regions: Boolean(teamData.allow_other_regions),
    videogame_id: Number(teamData.videogame_id),
    region_id: teamData.region_id ? Number(teamData.region_id) : null,
    min_rank_id: Number(teamData.min_rank_id),
    max_rank_id: Number(teamData.max_rank_id),
    creator_game_role_id: Number(teamData.creator_game_role_id),
    vacant_game_role_ids: (teamData.vacant_game_role_ids || []).map(Number),
  };

  const response = await axiosClient.post("/api/v1/teams", payload);
  return response.data;
};

export const joinTeam = async (teamId, targetTeamMemberRoleId) => {
  const response = await axiosClient.post(`/api/v1/teams/${teamId}/join`, {
    target_team_member_role_id: Number(targetTeamMemberRoleId),
  });
  return response.data;
};

export const getMyActiveTeam = async () => {
  const response = await axiosClient.get("/api/v1/teams/me");
  return response.data;
};

export const getTeamById = async (teamId) => {
  const response = await axiosClient.get(`/api/v1/teams/${teamId}`);
  return response.data;
};
