import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import EquiposPage from "./EquiposPage";
import { buscarEquipos, obtenerMiEquipo } from "../api/teamApi";
import { getGames } from "../api/gameApi";
import { getRanksByGame } from "../api/rankApi";
import { getRegionsByGame } from "../api/regionApi";
import { getRolesByGame } from "../api/roleApi";

const { usuario, chat } = vi.hoisted(() => ({
  usuario: {
    profiles: [
      {
        videogame: { id: 1, name: "League of Legends" },
        region: { region_id: 2, name: "LAS" },
        role_profiles: [
          {
            role: { role_id: 10, name: "Mid" },
            rank: { rank_id: 1, name: "Hierro", value: 1 },
          },
        ],
      },
    ],
  },
  chat: {
    cargarConversaciones: vi.fn(),
    seleccionarConversacion: vi.fn(),
  },
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: usuario }),
}));

vi.mock("../context/ChatContext", () => ({
  useChat: () => chat,
}));

vi.mock("../api/teamApi", () => ({
  crearEquipo: vi.fn(),
  obtenerMiEquipo: vi.fn(),
  buscarEquipos: vi.fn(),
  obtenerEquipo: vi.fn(),
  unirseAEquipo: vi.fn(),
}));
vi.mock("../api/gameApi", () => ({ getGames: vi.fn() }));
vi.mock("../api/rankApi", () => ({ getRanksByGame: vi.fn() }));
vi.mock("../api/regionApi", () => ({ getRegionsByGame: vi.fn() }));
vi.mock("../api/roleApi", () => ({ getRolesByGame: vi.fn() }));

const equipoEncontrado = {
  team_id: 4,
  team_name: "Los Rivales",
  description: "Buscamos mid para rankeds",
  player_count: 1,
  max_players: 2,
  allow_other_regions: false,
  videogame: { videogame_id: 1, name: "League of Legends" },
  region: { region_id: 2, region_name: "LAS" },
  min_rank: { rank_id: 2, name: "Plata", value: 2 },
  max_rank: { rank_id: 4, name: "Platino", value: 4 },
  representative_rank: {
    rank_id: 3,
    name: "Oro",
    icon_url: "/media/oro.png",
    average_value: 3,
  },
  consultant_player_info: {
    is_member: false,
    join_eligibility: {
      can_join: false,
      reason:
        "El rango con ID 1 no es válido para el equipo con ID 4. Valor: 1, Mínimo admitido: 2, Máximo admitido: 4",
    },
  },
  members: [
    {
      team_member_role_id: 20,
      is_vacant: false,
      is_leader: true,
      user_id: 1,
      username: "lider",
      icon_url: "",
      active_game_profile: {
        active_role_profile: {
          role_id: 11,
          role_name: "Jungla",
          rank_name: "Oro",
          rank_icon_url: "",
        },
      },
    },
    {
      team_member_role_id: 30,
      is_vacant: true,
      is_leader: false,
      user_id: null,
      username: "Libre",
      icon_url: "",
      active_game_profile: {
        active_role_profile: { role_id: 10, role_name: "Mid", rank_name: "" },
      },
    },
  ],
};

function renderPagina() {
  return render(
    <MemoryRouter>
      <EquiposPage />
    </MemoryRouter>
  );
}

describe("EquiposPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerMiEquipo.mockResolvedValue(null);
    buscarEquipos.mockResolvedValue([]);
    getGames.mockResolvedValue([
      { id: 1, name: "League of Legends", icon_url: "" },
    ]);
    getRanksByGame.mockResolvedValue([{ rank_id: 3, name: "Oro", value: 3 }]);
    getRegionsByGame.mockResolvedValue([{ region_id: 2, name: "LAS" }]);
    getRolesByGame.mockResolvedValue([{ role_id: 10, name: "Mid" }]);
  });

  it("ofrece crear un equipo si el jugador no está en ninguno", async () => {
    renderPagina();

    expect(
      screen.getByRole("heading", { level: 1, name: "Equipos" })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: /crear equipo/i })
    ).toHaveAttribute("href", "/app/equipos/crear");
  });

  it("lleva al equipo del jugador si ya está en uno", async () => {
    obtenerMiEquipo.mockResolvedValue({
      team_name: "Los Gankers",
      videogame: { name: "League of Legends" },
      player_count: 1,
      max_players: 5,
    });
    renderPagina();

    expect(await screen.findByText("Los Gankers")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ver mi equipo/i })
    ).toHaveAttribute("href", "/app/equipos/mi-equipo");
    expect(
      screen.queryByRole("link", { name: /crear equipo/i })
    ).not.toBeInTheDocument();
  });

  it("no ofrece crear un equipo si no pudo averiguar si el jugador ya tiene uno", async () => {
    obtenerMiEquipo.mockRejectedValue(new Error("Network Error"));
    renderPagina();

    expect(
      await screen.findByText("No se pudo cargar tu equipo.")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /crear equipo/i })
    ).not.toBeInTheDocument();
  });

  describe("US 17 - Buscar equipos", () => {
    it("lista los equipos con vacantes del juego del jugador con sus datos", async () => {
      buscarEquipos.mockResolvedValue([equipoEncontrado]);
      renderPagina();

      expect(
        await screen.findByRole("link", { name: "Los Rivales" })
      ).toHaveAttribute("href", "/app/equipos/4");
      expect(screen.getByText("Buscamos mid para rankeds")).toBeInTheDocument();
      expect(screen.getByText("1/2")).toBeInTheDocument();
      expect(screen.getByText("lider")).toBeInTheDocument();
      expect(screen.getByText("Disponible")).toBeInTheDocument();
      expect(screen.getByText(/Rango representativo/)).toHaveTextContent("Oro");
      expect(
        screen.getByRole("button", { name: "Unirse al equipo" })
      ).toBeInTheDocument();

      // Por defecto solo se piden equipos con al menos una vacante.
      expect(buscarEquipos).toHaveBeenCalledWith(
        expect.objectContaining({ videojuegoId: "1", vacantesMinimas: "1" })
      );
    });

    it("filtra por región y vacantes, y limpiar filtros vuelve al listado general", async () => {
      renderPagina();

      await userEvent.selectOptions(
        await screen.findByLabelText("Región"),
        "2"
      );
      await userEvent.selectOptions(
        screen.getByLabelText("Vacantes libres"),
        "3"
      );

      await waitFor(() =>
        expect(buscarEquipos).toHaveBeenLastCalledWith(
          expect.objectContaining({ regionId: "2", vacantesMinimas: "3" })
        )
      );

      await userEvent.click(
        screen.getByRole("button", { name: "Limpiar filtros" })
      );

      await waitFor(() =>
        expect(buscarEquipos).toHaveBeenLastCalledWith(
          expect.objectContaining({
            regionId: "",
            rangoId: "",
            rolId: "",
            texto: "",
            vacantesMinimas: "1",
          })
        )
      );
    });

    it("busca por texto en nombre o descripción", async () => {
      renderPagina();

      await userEvent.type(
        await screen.findByPlaceholderText(/nombre o descripción/i),
        "rankeds"
      );

      await waitFor(() =>
        expect(buscarEquipos).toHaveBeenLastCalledWith(
          expect.objectContaining({ texto: "rankeds" })
        )
      );
    });

    it("informa cuando no hay resultados", async () => {
      renderPagina();

      expect(
        await screen.findByText(/No se encontraron equipos con esos filtros/)
      ).toBeInTheDocument();
    });

    it("al intentar unirse sin cumplir los requisitos lo indica y no deja confirmar", async () => {
      buscarEquipos.mockResolvedValue([equipoEncontrado]);
      renderPagina();

      await userEvent.click(
        await screen.findByRole("button", { name: "Unirse al equipo" })
      );

      expect(
        screen.getByText("No cumplís los requisitos para unirte a este equipo")
      ).toBeInTheDocument();
      expect(
        screen.getByText(/fuera del rango permitido por el equipo/)
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Unirme" })).toBeDisabled();
    });
  });
});
