import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import IconSelectComponent from "./IconSelectComponent";

const PERSONAJES = [
  { character_id: 1, name: "Ahri", icon_url: null },
  { character_id: 2, name: "Lux", icon_url: null },
  { character_id: 3, name: "Jinx", icon_url: null },
];

describe("IconSelectComponent", () => {
  it("abre la lista y selecciona una opción", async () => {
    const usuario = userEvent.setup();
    const onChange = vi.fn();

    render(
      <IconSelectComponent
        value=""
        onChange={onChange}
        options={PERSONAJES}
        getOptionId={(c) => c.character_id}
      />
    );

    await usuario.click(screen.getByRole("button", { name: /selecciona/i }));
    await usuario.click(screen.getByRole("button", { name: /Lux/ }));

    expect(onChange).toHaveBeenCalledWith("2");
  });

  it("con buscable, escribir filtra las opciones mostradas", async () => {
    const usuario = userEvent.setup();

    render(
      <IconSelectComponent
        value=""
        onChange={vi.fn()}
        options={PERSONAJES}
        buscable
        getOptionId={(c) => c.character_id}
      />
    );

    await usuario.click(screen.getByRole("button", { name: /selecciona/i }));
    expect(screen.getByRole("button", { name: /Ahri/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lux/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Jinx/ })).toBeInTheDocument();

    await usuario.type(screen.getByPlaceholderText(/buscar\.\.\./i), "jin");

    expect(screen.getByRole("button", { name: /Jinx/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ahri/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Lux/ })).toBeNull();
  });

  it("sin buscable, no muestra el campo de texto", async () => {
    const usuario = userEvent.setup();

    render(
      <IconSelectComponent
        value=""
        onChange={vi.fn()}
        options={PERSONAJES}
        getOptionId={(c) => c.character_id}
      />
    );

    await usuario.click(screen.getByRole("button", { name: /selecciona/i }));

    expect(screen.queryByPlaceholderText(/buscar\.\.\./i)).toBeNull();
  });

  it("con incluirOpcionCualquiera, la opción resetea el valor a vacío", async () => {
    const usuario = userEvent.setup();
    const onChange = vi.fn();

    render(
      <IconSelectComponent
        value="2"
        onChange={onChange}
        options={PERSONAJES}
        incluirOpcionCualquiera
        getOptionId={(c) => c.character_id}
      />
    );

    await usuario.click(screen.getByRole("button", { name: /Lux/ }));
    await usuario.click(screen.getByRole("button", { name: /Cualquiera/ }));

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("sin incluirOpcionCualquiera, no ofrece esa opción", async () => {
    const usuario = userEvent.setup();

    render(
      <IconSelectComponent
        value=""
        onChange={vi.fn()}
        options={PERSONAJES}
        getOptionId={(c) => c.character_id}
      />
    );

    await usuario.click(screen.getByRole("button", { name: /selecciona/i }));

    expect(screen.queryByRole("button", { name: /Cualquiera/ })).toBeNull();
  });

  it("con buscable, si no hay coincidencias lo avisa", async () => {
    const usuario = userEvent.setup();

    render(
      <IconSelectComponent
        value=""
        onChange={vi.fn()}
        options={PERSONAJES}
        buscable
        getOptionId={(c) => c.character_id}
      />
    );

    await usuario.click(screen.getByRole("button", { name: /selecciona/i }));
    await usuario.type(screen.getByPlaceholderText(/buscar\.\.\./i), "zzz");

    expect(screen.getByText(/sin coincidencias/i)).toBeInTheDocument();
  });
});
