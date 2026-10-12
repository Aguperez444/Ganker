import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buscarEquipos,
  obtenerMiEquipo,
  obtenerEquipo,
  unirseAEquipo,
  actualizarEquipo,
} from "./teamApi";
import axiosClient from "./axiosClient";

vi.mock("./axiosClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe("teamApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buscarEquipos - GET /api/v1/teams", () => {
    it("envía los filtros como query params", async () => {
      axiosClient.get.mockResolvedValue({ data: [{ team_id: 1 }] });

      const equipos = await buscarEquipos({
        videogame_id: 1,
        region_id: 2,
        rank_id: 3,
        vacant_slots: 2,
        role_id: 4,
        search: "pibes",
        page: 2,
        size: 20,
      });

      expect(axiosClient.get).toHaveBeenCalledWith("/api/v1/teams", {
        params: {
          videogame_id: 1,
          region_id: 2,
          rank_id: 3,
          vacant_slots: 2,
          role_id: 4,
          search: "pibes",
          page: 2,
          size: 20,
        },
      });
      expect(equipos).toEqual([{ team_id: 1 }]);
    });

    it("no manda la búsqueda vacía ni los filtros sin valor", async () => {
      axiosClient.get.mockResolvedValue({ data: [] });

      await buscarEquipos({ videogame_id: 1, search: "   " });

      expect(axiosClient.get).toHaveBeenCalledWith("/api/v1/teams", {
        params: {
          videogame_id: 1,
          region_id: undefined,
          rank_id: undefined,
          vacant_slots: undefined,
          role_id: undefined,
          search: undefined,
          page: 1,
          size: 20,
        },
      });
    });
  });

  describe("unirseAEquipo - POST /api/v1/teams/{id}/join", () => {
    it("postea el slot elegido (target_team_member_role_id)", async () => {
      axiosClient.post.mockResolvedValue({
        data: { status: "success", message: "Te uniste", chatroom_id: 9 },
      });

      const respuesta = await unirseAEquipo(7, 42);

      expect(axiosClient.post).toHaveBeenCalledWith("/api/v1/teams/7/join", {
        target_team_member_role_id: 42,
      });
      expect(respuesta).toEqual({
        status: "success",
        message: "Te uniste",
        chatroom_id: 9,
      });
    });
  });

  describe("actualizarEquipo - PUT /api/v1/teams/{id}", () => {
    it("hace PUT con los campos editables del equipo", async () => {
      axiosClient.put.mockResolvedValue({
        data: {
          status: "success",
          message: "El equipo Los Pibes ha sido modificado exitosamente",
          data: { team_id: 5, team_name: "Los Pibes" },
        },
      });

      const respuesta = await actualizarEquipo(5, {
        name: "Los Pibes",
        description: "Nueva descripción",
        allow_other_regions: true,
        region_id: 2,
        min_rank_id: 1,
        max_rank_id: 4,
      });

      expect(axiosClient.put).toHaveBeenCalledWith("/api/v1/teams/5", {
        name: "Los Pibes",
        description: "Nueva descripción",
        allow_other_regions: true,
        region_id: 2,
        min_rank_id: 1,
        max_rank_id: 4,
      });
      expect(respuesta.data).toEqual({ team_id: 5, team_name: "Los Pibes" });
    });
  });

  describe("consultas de un equipo puntual", () => {
    it("obtenerMiEquipo hace GET a /api/v1/teams/me y devuelve null sin equipo", async () => {
      axiosClient.get.mockResolvedValue({ data: null });

      const equipo = await obtenerMiEquipo();

      expect(axiosClient.get).toHaveBeenCalledWith("/api/v1/teams/me");
      expect(equipo).toBeNull();
    });

    it("obtenerEquipo hace GET al detalle del equipo", async () => {
      axiosClient.get.mockResolvedValue({
        data: { team_id: 5, team_name: "Los Pibes" },
      });

      const equipo = await obtenerEquipo(5);

      expect(axiosClient.get).toHaveBeenCalledWith("/api/v1/teams/5");
      expect(equipo).toEqual({ team_id: 5, team_name: "Los Pibes" });
    });
  });
});