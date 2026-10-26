import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import HomePage from "./HomePage";
import { useAuth } from "../context/AuthContext";
import useMiEquipo from "../hooks/useMiEquipo";
import useGames from "../hooks/useGames";

vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../hooks/useMiEquipo", () => ({ default: vi.fn() }));
vi.mock("../hooks/useGames", () => ({ default: vi.fn() }));

const perfilValorant = {
  game_profile_id: 4,
  videogame: { id: 1, name: "Valorant", icon_url: "/media/valorant.png" },
  in_game_name: "ana_player#LAS",
  region: null,
  role_profiles: [
    {
      role_profile_id: 7,
      role: { name: "Duelista", icon_url: "/media/duelist.png" },
      rank: { name: "Platino 1", value: 13, icon_url: "/media/plat1.svg" },
    },
    {
      role_profile_id: 8,
      role: { name: "Controlador", icon_url: "/media/controller.png" },
      rank: { name: "Oro 2", value: 11, icon_url: "/media/gold2.svg" },
    },
  ],
};

function renderPagina() {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
}

describe("HomePage - inicio del jugador", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { username: "ana_player", icon_url: null, profiles: [] },
    });
    useMiEquipo.mockReturnValue({ equipo: null, cargando: false, error: "" });
    useGames.mockReturnValue({ games: [], isLoading: false });
  });

  it("saluda al jugador y ofrece buscar jugadores y equipos", () => {
    renderPagina();

    expect(
      screen.getByRole("heading", { level: 1, name: "ana_player" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /buscar jugadores/i })[0]
    ).toHaveAttribute("href", "/app/jugadores");
    expect(
      screen.getAllByRole("link", { name: /buscar equipos/i })[0]
    ).toHaveAttribute("href", "/app/equipos");
  });

  it("sin perfiles invita a crear el primero", () => {
    renderPagina();

    expect(
      screen.getByText("Todavía no tenés perfiles de juego")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Crear perfil de juego" })
    ).toHaveAttribute("href", "/app/perfil");
  });

  it("muestra cada perfil con su rango principal (el de mayor valor)", () => {
    useAuth.mockReturnValue({
      user: {
        username: "ana_player",
        icon_url: null,
        profiles: [perfilValorant],
      },
    });
    renderPagina();

    const tarjeta = screen.getByRole("link", { name: "Perfil de Valorant" });
    expect(tarjeta).toHaveTextContent("Rango principal");
    expect(tarjeta).toHaveTextContent("Platino 1");
    expect(tarjeta).toHaveTextContent("Duelista");
    expect(tarjeta).toHaveTextContent("Controlador · Oro 2");
  });

  it("sin equipo ofrece crear uno", () => {
    renderPagina();

    expect(
      screen.getByText(/Todavía no estás en un equipo/)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear equipo" })).toHaveAttribute(
      "href",
      "/app/equipos/crear"
    );
  });

  it("con equipo muestra su resumen y el enlace a Mi equipo", () => {
    useMiEquipo.mockReturnValue({
      equipo: {
        team_name: "Los Gankers",
        icon_url: null,
        player_count: 3,
        max_players: 5,
        videogame: { name: "Valorant" },
        representative_rank: null,
        members: [
          { user_id: 1, username: "ana_player", icon_url: "", is_leader: true },
          { user_id: null, username: "", icon_url: "", is_vacant: true },
        ],
      },
      cargando: false,
      error: "",
    });
    renderPagina();

    expect(screen.getByText("Los Gankers")).toBeInTheDocument();
    expect(screen.getByText(/3\/5 jugadores/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver equipo/i })).toHaveAttribute(
      "href",
      "/app/equipos/mi-equipo"
    );
    expect(screen.getAllByRole("img", { name: "ana_player" })).toHaveLength(1);
  });

  it("lista los juegos del catálogo", () => {
    useGames.mockReturnValue({
      games: [
        { id: 1, name: "Valorant" },
        { id: 2, name: "League of Legends" },
      ],
      isLoading: false,
    });
    renderPagina();

    expect(
      screen.getByRole("link", { name: "Equipos de Valorant" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Equipos de League of Legends" })
    ).toBeInTheDocument();
  });
});
