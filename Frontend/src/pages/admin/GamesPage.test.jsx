import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import GamesPage from "./GamesPage";
import { getGames } from "../../api/gameApi";

vi.mock("../../api/gameApi", () => ({
  getGames: vi.fn(),
  createGame: vi.fn(),
  updateGame: vi.fn(),
}));

const GAMES = [
  {
    videogame_id: 1,
    name: "League of Legends",
    icon_url: "/media/games/lol.png",
    rank_per_role: true,
  },
  {
    videogame_id: 2,
    name: "Valorant",
    icon_url: "/media/games/valorant.png",
    rank_per_role: false,
  },
];

// GamesPage solo navega, no renderiza la pagina destino. EsteSibling espia la
// ruta y el state para poder afirmar a donde se caigo y con que juego.
function Destino() {
  const location = useLocation();

  return (
    <p data-testid="destino">
      {`${location.pathname}|${location.state?.videogameId ?? ""}`}
    </p>
  );
}

async function renderPagina() {
  render(
    <MemoryRouter initialEntries={["/app/admin/games"]}>
      <GamesPage />
      <Destino />
    </MemoryRouter>
  );

  await screen.findByText("League of Legends");
}

function botonEn(gameName, nombreBoton) {
  const fila = screen.getByText(gameName).closest("li");

  return within(fila).getByRole("button", { name: nombreBoton });
}

beforeEach(() => {
  vi.clearAllMocks();
  getGames.mockResolvedValue(GAMES);
});

describe("GamesPage - redirecciones por juego", () => {
  it("lleva a la pagina de rangos con el juego tocado", async () => {
    const usuario = userEvent.setup();
    await renderPagina();

    await usuario.click(botonEn("Valorant", /modificar rangos/i));

    expect(screen.getByTestId("destino")).toHaveTextContent(
      "/app/admin/ranks|2"
    );
  });

  it("lleva a la pagina de roles con el juego tocado", async () => {
    const usuario = userEvent.setup();
    await renderPagina();

    await usuario.click(botonEn("League of Legends", /modificar roles/i));

    expect(screen.getByTestId("destino")).toHaveTextContent(
      "/app/admin/roles|1"
    );
  });

  it("lleva a la pagina de personajes con el juego tocado", async () => {
    const usuario = userEvent.setup();
    await renderPagina();

    await usuario.click(botonEn("Valorant", /modificar personajes/i));

    expect(screen.getByTestId("destino")).toHaveTextContent(
      "/app/admin/characters|2"
    );
  });

  it("no saca el juego de la lista al redirigir", async () => {
    const usuario = userEvent.setup();
    await renderPagina();

    await usuario.click(botonEn("Valorant", /modificar roles/i));

    // El estado de la pagina no se toco: sigue mostrando la lista de juegos.
    expect(screen.getByText("Videojuegos soportados")).toBeInTheDocument();
    expect(screen.getByText("League of Legends")).toBeInTheDocument();
  });
});
