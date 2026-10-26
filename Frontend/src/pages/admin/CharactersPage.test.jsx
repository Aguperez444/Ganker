import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, it, expect, vi } from "vitest";

import CharactersPage from "./CharactersPage";

vi.mock("../../hooks/useGames", () => ({
  default: () => ({
    games: [
      { id: 1, name: "League of Legends", has_characters: true },
      { id: 2, name: "CS2", has_characters: false },
    ],
    isLoading: false,
  }),
}));

// Estado del hook mockeado que cada test puede ajustar (ej. si el juego
// admite importar personajes desde una API).
const hookCharacters = vi.hoisted(() => ({
  syncSupport: null,
  syncError: "",
  syncFromCatalog: null,
}));

vi.mock("../../hooks/useCharacters", () => ({
  default: () => ({
    characters: [],
    isLoading: false,
    isSaving: false,
    error: "",
    actionError: "",
    loadCharacters: vi.fn(),
    registerCharacter: vi.fn(),
    editCharacter: vi.fn(),
    removeCharacter: vi.fn(),
    clearActionError: vi.fn(),
    syncSupport: hookCharacters.syncSupport,
    isSyncing: false,
    syncError: hookCharacters.syncError,
    loadSyncSupport: vi.fn(),
    syncFromCatalog: hookCharacters.syncFromCatalog,
  }),
}));

beforeEach(() => {
  hookCharacters.syncSupport = null;
  hookCharacters.syncError = "";
  hookCharacters.syncFromCatalog = vi.fn();
});

describe("CharactersPage - videojuegos sin personajes", () => {
  it("no ofrece registrar personajes en juegos con 'Tiene personajes' desactivado", async () => {
    const usuario = userEvent.setup();
    render(<CharactersPage />);

    // El filtro muestra los juegos siempre visibles (SelectorJuegoComponent);
    // el del formulario es un IconSelectComponent: se abre con un click.
    const filtro = screen.getByLabelText("Ver personajes de");
    await usuario.click(filtro);
    await usuario.click(within(filtro.parentElement).getByText("CS2"));
    expect(
      screen.getByText(/no se le pueden registrar personajes nuevos/i)
    ).toBeInTheDocument();

    await usuario.click(
      screen.getByRole("button", { name: /registrar personaje/i })
    );

    const selectJuego = screen.getByLabelText(/^Videojuego/);
    // CS2 estaba elegido en la lista, pero no queda preseleccionado.
    expect(selectJuego).toHaveTextContent("Seleccioná un videojuego");

    await usuario.click(selectJuego);
    const lista = within(selectJuego.parentElement).getByRole("list");
    expect(within(lista).getByText("League of Legends")).toBeInTheDocument();
    expect(within(lista).queryByText("CS2")).toBeNull();
  });
});

describe("CharactersPage - importar personajes desde una API", () => {
  it("no muestra el botón de importar en juegos de carga manual", () => {
    render(<CharactersPage />);

    expect(
      screen.queryByRole("button", { name: /importar desde api/i })
    ).toBeNull();
  });

  it("importa los personajes y muestra el resumen", async () => {
    const usuario = userEvent.setup();
    hookCharacters.syncSupport = {
      supported: true,
      source: "Riot Games (Data Dragon)",
    };
    hookCharacters.syncFromCatalog.mockResolvedValue({
      source: "Riot Games (Data Dragon)",
      created: [{ character_id: 9, name: "Wukong", icon_url: "/media/w.png" }],
      skipped_count: 4,
      failed: ["Ahri"],
    });
    render(<CharactersPage />);

    expect(
      screen.getByText(/se pueden importar automáticamente desde Riot Games/i)
    ).toBeInTheDocument();

    await usuario.click(
      screen.getByRole("button", { name: /importar desde api/i })
    );

    expect(hookCharacters.syncFromCatalog).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(
        /Se importaron 1 personaje nuevo desde Riot Games \(Data Dragon\) \(4 ya estaban registrados\)\. No se pudieron importar: Ahri\./
      )
    ).toBeInTheDocument();
  });

  it("muestra el error si la API no responde", () => {
    hookCharacters.syncSupport = {
      supported: true,
      source: "Riot Games (Data Dragon)",
    };
    hookCharacters.syncError =
      "No se pudo obtener la información desde Riot Games (Data Dragon).";
    render(<CharactersPage />);

    expect(
      screen.getByText(/No se pudo obtener la información desde Riot Games/)
    ).toBeInTheDocument();
  });
});
