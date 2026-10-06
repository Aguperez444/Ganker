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
  let body;

  if (teamData instanceof FormData) {
    body = teamData;
  } else {
    const formData = new FormData();
    formData.append("name", teamData.name.trim());
    if (teamData.description && teamData.description.trim()) {
      formData.append("description", teamData.description.trim());
    }
    formData.append(
      "allow_other_regions",
      String(Boolean(teamData.allow_other_regions))
    );
    formData.append("videogame_id", String(Number(teamData.videogame_id)));
    if (teamData.region_id) {
      formData.append("region_id", String(Number(teamData.region_id)));
    }
    formData.append("min_rank_id", String(Number(teamData.min_rank_id)));
    formData.append("max_rank_id", String(Number(teamData.max_rank_id)));
    formData.append(
      "creator_game_role_id",
      String(Number(teamData.creator_game_role_id))
    );

    (teamData.vacant_game_role_ids || []).forEach((id) => {
      formData.append("vacant_game_role_ids", String(Number(id)));
    });

    if (
      teamData.team_icon instanceof File ||
      teamData.team_icon instanceof Blob
    ) {
      formData.append(
        "team_icon",
        teamData.team_icon,
        teamData.team_icon.name || "team_icon.png"
      );
    }

    body = formData;
  }

  const response = await axiosClient.post("/api/v1/teams", body, {
    headers: {
      "Content-Type": undefined,
    },
  });
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
