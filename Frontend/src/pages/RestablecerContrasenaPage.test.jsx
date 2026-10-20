import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import RestablecerContrasenaPage from "./RestablecerContrasenaPage";
import { restablecerContrasena } from "../api/recuperacionContrasenaApi";
import { MENSAJE_LINK_INVALIDO } from "../hooks/useRestablecerContrasena";

vi.mock("../api/recuperacionContrasenaApi", () => ({
  restablecerContrasena: vi.fn(),
}));

const TOKEN = "t".repeat(43);

function renderPagina(ruta = `/reset-password?token=${TOKEN}`) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <RestablecerContrasenaPage />
    </MemoryRouter>
  );
}

async function cambiar(usuario, password, confirmacion = password) {
  await usuario.type(
    screen.getByPlaceholderText("Tu nueva contraseña"),
    password
  );
  await usuario.type(
    screen.getByPlaceholderText("Repetí la nueva contraseña"),
    confirmacion
  );
  await usuario.click(
    screen.getByRole("button", { name: "Cambiar contraseña" })
  );
}

describe("RestablecerContrasenaPage - US 34 Cambiar contraseña", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    restablecerContrasena.mockResolvedValue({
      message: "La contraseña ha sido restablecida correctamente",
    });
  });

  it("con el link del mail muestra el formulario de nueva contraseña", () => {
    renderPagina();

    expect(
      screen.getByRole("heading", { name: "Elegí tu nueva contraseña" })
    ).toBeInTheDocument();
  });

  it("sin token en el link avisa que es inválido", () => {
    renderPagina("/reset-password");

    expect(screen.getByText(MENSAJE_LINK_INVALIDO)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Pedir un enlace nuevo" })
    ).toHaveAttribute("href", "/recuperar-contrasena");
  });

  it("con una contraseña válida la cambia y notifica el éxito", async () => {
    const usuario = userEvent.setup();
    renderPagina();

    await cambiar(usuario, "NuevaPass1");

    expect(restablecerContrasena).toHaveBeenCalledWith(TOKEN, "NuevaPass1");
    expect(
      await screen.findByText(
        /La contraseña ha sido restablecida correctamente/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Iniciar sesión" })
    ).toHaveAttribute("href", "/login");
  });

  it.each([
    ["menos de 8 caracteres", "Abc12"],
    ["sin mayúscula", "nuevapass1"],
    ["sin minúscula", "NUEVAPASS1"],
    ["sin número", "NuevaPassword"],
  ])("rechaza una contraseña %s sin llamar al backend", async (_caso, pass) => {
    const usuario = userEvent.setup();
    renderPagina();

    await cambiar(usuario, pass);

    expect(
      screen.getByText(
        "Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número."
      )
    ).toBeInTheDocument();
    expect(restablecerContrasena).not.toHaveBeenCalled();
  });

  it("si el enlace venció o ya se usó muestra el error del backend", async () => {
    const usuario = userEvent.setup();
    restablecerContrasena.mockRejectedValue({
      response: {
        status: 400,
        data: {
          error: "El enlace de recuperación es inválido o ya fue utilizado.",
        },
      },
    });
    renderPagina();

    await cambiar(usuario, "NuevaPass1");

    expect(
      await screen.findByText(
        "El enlace de recuperación es inválido o ya fue utilizado."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Pedir un enlace nuevo" })
    ).toBeInTheDocument();
  });
});
