import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";

import GamesPage from "./GamesPage";
import { deleteGame, getGames } from "../../api/gameApi";
import { useAuth } from "../../context/AuthContext";

vi.mock("../../api/gameApi", () => ({
  getGames: vi.fn(),
  createGame: vi.fn(),
  updateGame: vi.fn(),
  deleteGame: vi.fn(),
}));
vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));

const JUEGOS = [
  { id: 1, name: "League of Legends", rank_per_role: true },
  { id: 2, name: "Valorant", rank_per_role: false },
];

function filaDe(nombre) {
  return screen.getByText(nombre).closest("li");
}

async function abrirComo(role) {
  useAuth.mockReturnValue({ user: { role } });
  render(<GamesPage />);
  await screen.findByText("League of Legends");
}

describe("GamesPage - US 23 Eliminar juego", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGames.mockResolvedValue(JUEGOS);
  });

  it("un admin que no es owner no ve el botón Eliminar", async () => {
    await abrirComo("admin");

    expect(
      within(filaDe("Valorant")).queryByRole("button", { name: "Eliminar" })
    ).toBeNull();
  });

  it("el owner confirma con aviso de impacto, elimina y ve el mensaje", async () => {
    const usuario = userEvent.setup();
    deleteGame.mockResolvedValue({
      message: "El videojuego ha sido eliminado exitosamente.",
    });
    await abrirComo("owner");

    await usuario.click(
      within(filaDe("Valorant")).getByRole("button", { name: "Eliminar" })
    );
    const modal = screen.getByRole("dialog");
    expect(modal).toHaveTextContent(/roles, rangos y personajes/);
    expect(modal).toHaveTextContent(/perfiles de juego/);

    await usuario.click(
      within(modal).getByRole("button", { name: "Eliminar" })
    );

    expect(deleteGame).toHaveBeenCalledWith(2);
    expect(
      await screen.findByText(/El videojuego ha sido eliminado exitosamente/)
    ).toBeInTheDocument();
    expect(screen.queryByText("Valorant")).toBeNull();
  });

  it("cancelar no elimina el juego", async () => {
    const usuario = userEvent.setup();
    await abrirComo("owner");

    await usuario.click(
      within(filaDe("Valorant")).getByRole("button", { name: "Eliminar" })
    );
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(deleteGame).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("Valorant")).toBeInTheDocument();
  });

  it("avisa si el juego no existe o ya fue eliminado y refresca la lista", async () => {
    const usuario = userEvent.setup();
    deleteGame.mockRejectedValue({
      response: { status: 404, data: { error: "Videojuego no encontrado" } },
    });
    await abrirComo("owner");

    await usuario.click(
      within(filaDe("Valorant")).getByRole("button", { name: "Eliminar" })
    );
    await usuario.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Eliminar",
      })
    );

    expect(
      await screen.findByText("El videojuego no existe o ya fue eliminado.")
    ).toBeInTheDocument();
    expect(getGames).toHaveBeenCalledTimes(2);
  });

  it("avisa si no tiene permisos de owner", async () => {
    const usuario = userEvent.setup();
    deleteGame.mockRejectedValue({
      response: { status: 403, data: { detail: "Sin permisos" } },
    });
    await abrirComo("owner");

    await usuario.click(
      within(filaDe("Valorant")).getByRole("button", { name: "Eliminar" })
    );
    await usuario.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Eliminar",
      })
    );

    expect(
      await screen.findByText(
        "No tenés permisos de owner para eliminar videojuegos."
      )
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("list")).getByText("Valorant")
    ).toBeInTheDocument();
  });
});
