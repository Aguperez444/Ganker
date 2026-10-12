import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import EquiposPage from "./EquiposPage";
import { obtenerMiEquipo } from "../api/teamApi";

vi.mock("../api/teamApi", () => ({
  crearEquipo: vi.fn(),
  obtenerMiEquipo: vi.fn(),
}));

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
  });

  it("ofrece crear un equipo si el jugador no está en ninguno", async () => {
    obtenerMiEquipo.mockResolvedValue(null);
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
});
