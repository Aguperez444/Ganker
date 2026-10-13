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

    // Los selectores de videojuego usan IconSelectComponent (no un <select>
    // nativo): se abre la lista con un click y se elige por texto.
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
