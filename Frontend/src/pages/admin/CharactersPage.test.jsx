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
  async function elegirJuego(usuario, etiqueta, nombreJuego) {
    const disparador = await screen.findByLabelText(etiqueta);
    await usuario.click(disparador);
    const lista = within(disparador.parentElement).getByRole("list");
    await usuario.click(within(lista).getByText(nombreJuego));
  }

  it("no ofrece registrar personajes en juegos con 'Tiene personajes' desactivado", async () => {
    const usuario = userEvent.setup();
    render(<CharactersPage />);

    await elegirJuego(usuario, "Ver personajes de", "CS2");
    expect(
      screen.getByText(/no se le pueden registrar personajes nuevos/i)
    ).toBeInTheDocument();

    await usuario.click(
      screen.getByRole("button", { name: /registrar personaje/i })
    );

    const selectJuego = screen.getByLabelText(/^Videojuego/);
    // CS2 estaba elegido en el filtro de la lista, pero no queda
    // preseleccionado en el formulario.
    expect(selectJuego).toHaveTextContent("Seleccioná un videojuego");

    await usuario.click(selectJuego);
    const lista = within(selectJuego.parentElement).getByRole("list");
    const opciones = within(lista)
      .getAllByRole("button")
      .map((opcion) => opcion.textContent);

    expect(opciones.some((texto) => texto.includes("League of Legends"))).toBe(
      true
    );
    expect(opciones.some((texto) => texto.includes("CS2"))).toBe(false);
  });
});
