import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import SelectorJuegoComponent from "./SelectorJuegoComponent";

const JUEGOS = [
  { id: 1, name: "Valorant", icon_url: "/media/valorant.png" },
  { id: 2, name: "League of Legends", icon_url: null },
];

describe("SelectorJuegoComponent", () => {
  it("muestra todos los juegos siempre visibles y marca el elegido", () => {
    render(
      <SelectorJuegoComponent
        etiqueta="Videojuego"
        juegos={JUEGOS}
        value="2"
        onChange={() => {}}
      />
    );

    const grupo = screen.getByRole("radiogroup", { name: "Videojuego" });
    expect(within(grupo).getAllByRole("radio")).toHaveLength(2);
    expect(
      within(grupo).getByRole("radio", { name: "League of Legends" })
    ).toHaveAttribute("aria-checked", "true");
    expect(
      within(grupo).getByRole("radio", { name: "Valorant" })
    ).toHaveAttribute("aria-checked", "false");
  });

  it("al hacer click avisa el id como string", async () => {
    const usuario = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SelectorJuegoComponent
        etiqueta="Videojuego"
        juegos={JUEGOS}
        value=""
        onChange={onChange}
      />
    );

    await usuario.click(screen.getByRole("radio", { name: "Valorant" }));
    expect(onChange).toHaveBeenCalledWith("1");
  });

  it("con opcionTodos agrega una primera opción que vuelve a ''", async () => {
    const usuario = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SelectorJuegoComponent
        etiqueta="Videojuego"
        juegos={JUEGOS}
        value="1"
        onChange={onChange}
        opcionTodos="Todos"
      />
    );

    const opciones = screen.getAllByRole("radio");
    expect(opciones[0]).toHaveAccessibleName("Todos");
    await usuario.click(opciones[0]);
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("deshabilitado no permite elegir", () => {
    render(
      <SelectorJuegoComponent
        etiqueta="Videojuego"
        juegos={JUEGOS}
        value=""
        onChange={() => {}}
        disabled
      />
    );

    screen.getAllByRole("radio").forEach((r) => expect(r).toBeDisabled());
  });
});
