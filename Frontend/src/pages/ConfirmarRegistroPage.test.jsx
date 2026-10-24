import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ConfirmarRegistroPage from "./ConfirmarRegistroPage";
import {
  confirmarRegistro,
  reenviarConfirmacionRegistro,
} from "../api/confirmacionRegistroApi";

vi.mock("../api/confirmacionRegistroApi", () => ({
  confirmarRegistro: vi.fn(),
  reenviarConfirmacionRegistro: vi.fn(),
}));

const TOKEN = "t".repeat(43);

function renderPagina(entry = `/confirm-registration?token=${TOKEN}`) {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <ConfirmarRegistroPage />
    </MemoryRouter>
  );
}

describe("ConfirmarRegistroPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmarRegistro.mockResolvedValue({
      message: "Tu cuenta fue creada correctamente. Ya podés iniciar sesión.",
    });
    reenviarConfirmacionRegistro.mockResolvedValue({
      message:
        "Si hay un registro pendiente para ese correo, recibirás un nuevo enlace de confirmación.",
    });
  });

  it("requiere confirmar explícitamente y permite iniciar sesión al terminar", async () => {
    renderPagina();
    expect(confirmarRegistro).not.toHaveBeenCalled();

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Confirmar mi cuenta" }));

    expect(confirmarRegistro).toHaveBeenCalledExactlyOnceWith(TOKEN);
    expect(
      await screen.findByRole("heading", { name: "Cuenta confirmada" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Iniciar sesión" })
    ).toHaveAttribute("href", "/login");
    expect(
      screen.queryByRole("button", { name: "Confirmar mi cuenta" })
    ).not.toBeInTheDocument();
  });

  it("muestra el correo del registro y permite reenviar sin volver a pedir la contraseña", async () => {
    renderPagina({
      pathname: "/confirm-registration",
      state: {
        email: "juan@example.com",
        mensaje: "Revisá tu correo para confirmar la creación de tu cuenta.",
      },
    });

    expect(
      screen.getByRole("heading", { name: "Revisá tu correo" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Email de registro" })
    ).toHaveValue("juan@example.com");
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Reenviar confirmación" }));

    expect(reenviarConfirmacionRegistro).toHaveBeenCalledWith(
      "juan@example.com"
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "recibirás un nuevo enlace"
    );
    expect(confirmarRegistro).not.toHaveBeenCalled();
  });

  it("después de reenviar espera antes de permitir otro reenvío", async () => {
    renderPagina({
      pathname: "/confirm-registration",
      state: { email: "juan@example.com" },
    });
    const usuario = userEvent.setup();

    await usuario.click(
      screen.getByRole("button", { name: "Reenviar confirmación" })
    );

    const boton = await screen.findByRole("button", {
      name: /Reenviar en \d+ s/,
    });
    expect(boton).toBeDisabled();
    await usuario.click(boton);
    expect(reenviarConfirmacionRegistro).toHaveBeenCalledTimes(1);
  });

  it("si falta el token permite solicitar un enlace nuevo", async () => {
    renderPagina("/confirm-registration");
    expect(
      screen.getByText(/Falta el enlace de confirmación/)
    ).toBeInTheDocument();
    const usuario = userEvent.setup();
    await usuario.type(
      screen.getByRole("textbox", { name: "Email de registro" }),
      "juan@example.com"
    );
    await usuario.click(
      screen.getByRole("button", { name: "Reenviar confirmación" })
    );
    expect(reenviarConfirmacionRegistro).toHaveBeenCalledWith(
      "juan@example.com"
    );
    expect(confirmarRegistro).not.toHaveBeenCalled();
  });

  it("muestra el error de un enlace vencido y ofrece reenviar", async () => {
    confirmarRegistro.mockRejectedValue({
      response: {
        status: 400,
        data: { error: "El enlace venció. Solicitá uno nuevo." },
      },
    });
    renderPagina();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Confirmar mi cuenta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El enlace venció"
    );
    expect(
      screen.getByRole("button", { name: "Reenviar confirmación" })
    ).toBeInTheDocument();
  });

  it("no reenvía un correo con formato inválido", async () => {
    renderPagina("/confirm-registration");
    const usuario = userEvent.setup();
    await usuario.type(
      screen.getByRole("textbox", { name: "Email de registro" }),
      "invalido"
    );
    await usuario.click(
      screen.getByRole("button", { name: "Reenviar confirmación" })
    );
    expect(reenviarConfirmacionRegistro).not.toHaveBeenCalled();
  });

  it("muestra el límite de reenvíos informado por el backend", async () => {
    reenviarConfirmacionRegistro.mockRejectedValue({
      response: {
        status: 429,
        data: {
          error: "Demasiadas solicitudes de registro. Intente más tarde.",
        },
      },
    });
    renderPagina({
      pathname: "/confirm-registration",
      state: { email: "juan@example.com" },
    });
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Reenviar confirmación" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Demasiadas solicitudes de registro"
    );
  });
});
