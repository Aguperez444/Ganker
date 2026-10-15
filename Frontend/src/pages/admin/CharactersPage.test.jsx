import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

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
  }),
}));

describe("CharactersPage - videojuegos sin personajes", () => {
  it("no ofrece registrar personajes en juegos con 'Tiene personajes' desactivado", async () => {
    const usuario = userEvent.setup();
    render(<CharactersPage />);

    await usuario.selectOptions(
      screen.getByLabelText("Ver personajes de"),
      "2"
    );
    expect(
      screen.getByText(/no se le pueden registrar personajes nuevos/i)
    ).toBeInTheDocument();

    await usuario.click(
      screen.getByRole("button", { name: /registrar personaje/i })
    );

    const selectJuego = screen.getByLabelText(/^Videojuego/);
    const opciones = within(selectJuego)
      .getAllByRole("option")
      .map((opcion) => opcion.textContent);

    expect(opciones).toContain("League of Legends");
    expect(opciones).not.toContain("CS2");
    // CS2 estaba elegido en la lista, pero no queda preseleccionado.
    expect(selectJuego).toHaveValue("");
  });
});
