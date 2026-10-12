import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";

import CampoContrasenaComponent from "./CampoContrasenaComponent";

describe("CampoContrasenaComponent", () => {
  it("arranca oculta y el ojito alterna entre mostrarla y ocultarla", async () => {
    render(
      <CampoContrasenaComponent
        label="CONTRASEÑA"
        placeholder="Tu contraseña"
        defaultValue="secreta123"
      />
    );

    const campo = screen.getByPlaceholderText("Tu contraseña");
    expect(campo).toHaveAttribute("type", "password");

    await userEvent.click(
      screen.getByRole("button", { name: "Mostrar contraseña" })
    );
    expect(campo).toHaveAttribute("type", "text");
    expect(campo).toHaveValue("secreta123");

    const boton = screen.getByRole("button", { name: "Ocultar contraseña" });
    expect(boton).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(boton);
    expect(campo).toHaveAttribute("type", "password");
  });
});
