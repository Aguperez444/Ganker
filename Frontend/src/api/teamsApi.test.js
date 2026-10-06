import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTeam,
  searchTeams,
  joinTeam,
  getMyActiveTeam,
  getTeamById,
} from "./teamsApi";
import axiosClient from "./axiosClient";

vi.mock("./axiosClient", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("teamsApi - Guía v3", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTeam", () => {
    it("convierte objeto plano a multipart/form-data con repetidos para vacant_game_role_ids", async () => {
      axiosClient.post.mockResolvedValue({
        data: {
          team_id: 1,
          team_name: "Equipo Test",
        },
      });

      const iconFile = new File(["icon"], "logo.png", { type: "image/png" });

      const teamData = {
        name: "  Equipo Test  ",
        description: "  Descripcion sala  ",
        allow_other_regions: true,
        videogame_id: 2,
        region_id: 3,
        min_rank_id: 4,
        max_rank_id: 5,
        creator_game_role_id: 1,
        vacant_game_role_ids: [2, 3],
        team_icon: iconFile,
      };

      const res = await createTeam(teamData);

      expect(axiosClient.post).toHaveBeenCalledTimes(1);
      const [url, formData, config] = axiosClient.post.mock.calls[0];

      expect(url).toBe("/api/v1/teams");
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get("name")).toBe("Equipo Test");
      expect(formData.get("description")).toBe("Descripcion sala");
      expect(formData.get("allow_other_regions")).toBe("true");
      expect(formData.get("videogame_id")).toBe("2");
      expect(formData.get("region_id")).toBe("3");
      expect(formData.get("min_rank_id")).toBe("4");
      expect(formData.get("max_rank_id")).toBe("5");
      expect(formData.get("creator_game_role_id")).toBe("1");

      const vacantes = formData.getAll("vacant_game_role_ids");
      expect(vacantes).toEqual(["2", "3"]);

      const iconEnviado = formData.get("team_icon");
      expect(iconEnviado).toBeInstanceOf(File);
      expect(iconEnviado.name).toBe("logo.png");

      expect(config).toEqual({
        headers: {
          "Content-Type": undefined,
        },
      });
      expect(res).toEqual({ team_id: 1, team_name: "Equipo Test" });
    });

    it("omite team_icon si no se adjunta", async () => {
      axiosClient.post.mockResolvedValue({ data: { team_id: 2 } });

      const teamData = {
        name: "Sin Logo",
        allow_other_regions: false,
        videogame_id: 1,
        min_rank_id: 1,
        max_rank_id: 2,
        creator_game_role_id: 1,
        vacant_game_role_ids: [2],
      };

      await createTeam(teamData);

      const [, formData] = axiosClient.post.mock.calls[0];
      expect(formData.get("team_icon")).toBeNull();
      expect(formData.get("region_id")).toBeNull();
    });

    it("soporta enviar FormData directamente", async () => {
      axiosClient.post.mockResolvedValue({ data: { team_id: 3 } });

      const customFd = new FormData();
      customFd.append("name", "Custom");

      await createTeam(customFd);

      const [, formData] = axiosClient.post.mock.calls[0];
      expect(formData).toBe(customFd);
    });
  });

  describe("searchTeams, joinTeam, getMyActiveTeam, getTeamById", () => {
    it("searchTeams arma query params correctamente", async () => {
      axiosClient.get.mockResolvedValue({ data: [] });

      await searchTeams({
        videogame_id: 1,
        region_id: 2,
        rank_id: 3,
        vacant_slots: 2,
        role_id: 1,
        search: "vengadores",
      });

      expect(axiosClient.get).toHaveBeenCalledWith("/api/v1/teams", {
        params: {
          videogame_id: 1,
          region_id: 2,
          rank_id: 3,
          vacant_slots: 2,
          role_id: 1,
          search: "vengadores",
        },
      });
    });

    it("joinTeam envía target_team_member_role_id por POST", async () => {
      axiosClient.post.mockResolvedValue({ data: { status: "success" } });

      await joinTeam(10, 32);

      expect(axiosClient.post).toHaveBeenCalledWith("/api/v1/teams/10/join", {
        target_team_member_role_id: 32,
      });
    });

    it("getMyActiveTeam llama a /api/v1/teams/me", async () => {
      axiosClient.get.mockResolvedValue({ data: null });
      await getMyActiveTeam();
      expect(axiosClient.get).toHaveBeenCalledWith("/api/v1/teams/me");
    });

    it("getTeamById llama a /api/v1/teams/:id", async () => {
      axiosClient.get.mockResolvedValue({ data: { team_id: 5 } });
      await getTeamById(5);
      expect(axiosClient.get).toHaveBeenCalledWith("/api/v1/teams/5");
    });
  });
});
