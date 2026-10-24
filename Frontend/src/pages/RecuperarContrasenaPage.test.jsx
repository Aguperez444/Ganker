import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import RecuperarContrasenaPage from "./RecuperarContrasenaPage";
import { solicitarRecuperacion } from "../api/recuperacionContrasenaApi";
import { MENSAJE_RECUPERACION_ENVIADA } from "../hooks/useRecuperarContrasena";

vi.mock("../api/recuperacionContrasenaApi", () => ({
  solicitarRecuperacion: vi.fn(),
}));

function renderPagina(state) {
  render(
    <MemoryRouter
      initialEntries={[{ pathname: "/recuperar-contrasena", state }]}
    >
      <RecuperarContrasenaPage />
    </MemoryRouter>
  );
}

async function enviar(usuario, email) {
  await usuario.type(screen.getByPlaceholderText("tuemail@ejemplo.com"), email);
  await usuario.click(screen.getByRole("button", { name: "Enviar enlace" }));
}

describe("RecuperarContrasenaPage - US 34 Cambiar contraseña", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // El backend responde lo mismo exista o no la cuenta.
    solicitarRecuperacion.mockResolvedValue({
      message:
        "Si el correo coincide con una cuenta activa, recibirás un enlace de recuperación",
    });
  });

  it("con un email válido pide el enlace y muestra el mensaje genérico", async () => {
    const usuario = userEvent.setup();
    renderPagina();

    await enviar(usuario, "ana@ejemplo.com");

    expect(solicitarRecuperacion).toHaveBeenCalledWith("ana@ejemplo.com");
    expect(
      await screen.findByText(/Si el correo coincide con una cuenta activa/)
    ).toBeInTheDocument();
  });

  it("no revela si el mail no está registrado: muestra el mismo mensaje", async () => {
    const usuario = userEvent.setup();
    solicitarRecuperacion.mockResolvedValue({});
    renderPagina();

    await enviar(usuario, "nadie@ejemplo.com");

    expect(
      await screen.findByText(new RegExp(MENSAJE_RECUPERACION_ENVIADA))
    ).toBeInTheDocument();
  });

  it("con un email inválido no envía nada", async () => {
    const usuario = userEvent.setup();
    renderPagina();

    await enviar(usuario, "no-es-mail");

    expect(
      screen.getByText("El email no tiene un formato válido.")
    ).toBeInTheDocument();
    expect(solicitarRecuperacion).not.toHaveBeenCalled();
  });

  it("precarga el email que llega desde Mi cuenta", () => {
    renderPagina({ email: "ana@ejemplo.com" });

    expect(screen.getByPlaceholderText("tuemail@ejemplo.com")).toHaveValue(
      "ana@ejemplo.com"
    );
  });

  it("después de enviar espera antes de permitir otro envío", async () => {
    const usuario = userEvent.setup();
    renderPagina();

    await enviar(usuario, "ana@ejemplo.com");

    const boton = await screen.findByRole("button", {
      name: /Reenviar en \d+ s/,
    });
    expect(boton).toBeDisabled();
    await usuario.click(boton);
    expect(solicitarRecuperacion).toHaveBeenCalledTimes(1);
  });

  it("si el backend corta por demasiados pedidos (429) muestra su mensaje", async () => {
    const usuario = userEvent.setup();
    solicitarRecuperacion.mockRejectedValue({
      response: {
        status: 429,
        data: {
          error:
            "Demasiadas solicitudes de recuperación. Por favor, intente nuevamente más tarde.",
        },
      },
    });
    renderPagina();

    await enviar(usuario, "ana@ejemplo.com");

    expect(
      await screen.findByText(/Demasiadas solicitudes de recuperación/)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/No pudimos enviar el enlace/)
    ).not.toBeInTheDocument();
  });
});
