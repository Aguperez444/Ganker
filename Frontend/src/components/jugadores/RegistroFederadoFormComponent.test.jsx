import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";

import RegistroFederadoFormComponent from "./RegistroFederadoFormComponent";

const VALORES = { username: "ana", nombre: "Ana", mail: "" };

function renderForm(props = {}) {
  const handlers = {
    onChange: vi.fn(),
    onBlur: vi.fn(),
    onSubmit: vi.fn((e) => e.preventDefault()),
    onCancelar: vi.fn(),
  };
  render(
    <MemoryRouter>
      <RegistroFederadoFormComponent
        proveedor="discord"
        valores={VALORES}
        errores={{}}
        cargando={false}
        errorServidor={null}
        {...handlers}
        {...props}
      />
    </MemoryRouter>
  );
  return handlers;
}

describe("RegistroFederadoFormComponent", () => {
  it("muestra el proveedor y los valores recibidos", () => {
    renderForm({ avatarUrl: "https://cdn.ejemplo/avatar.png" });

    expect(
      screen.getByRole("heading", { name: /completá tu registro con discord/i })
    ).toBeInTheDocument();
    expect(screen.getByAltText("Avatar de Discord")).toHaveAttribute(
      "src",
      "https://cdn.ejemplo/avatar.png"
    );
    expect(screen.getByDisplayValue("ana")).toBeInTheDocument();
  });

  it("avisa cada cambio con el nombre del campo", async () => {
    const { onChange } = renderForm();

    await userEvent
      .setup()
      .type(screen.getByPlaceholderText("tuemail@ejemplo.com"), "x");

    expect(onChange).toHaveBeenCalledWith("mail", "x");
  });

  it("envía el formulario y permite cancelar", async () => {
    const { onSubmit, onCancelar } = renderForm();
    const usuario = userEvent.setup();

    await usuario.click(
      screen.getByRole("button", { name: /finalizar registro y entrar/i })
    );
    await usuario.click(screen.getByRole("link", { name: /cancelar/i }));

    expect(onSubmit).toHaveBeenCalled();
    expect(onCancelar).toHaveBeenCalled();
  });

  it("muestra errores de campo y del servidor", () => {
    renderForm({
      errores: { username: "Elegí un nombre de usuario." },
      errorServidor: "Algo falló.",
    });

    expect(screen.getByText("Elegí un nombre de usuario.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Algo falló.");
  });
});
