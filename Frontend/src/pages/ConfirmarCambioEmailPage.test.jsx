import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ConfirmarCambioEmailPage from "./ConfirmarCambioEmailPage";
import { confirmarCambioEmail } from "../api/cambioEmailApi";
import { useAuth } from "../context/AuthContext";

vi.mock("../api/cambioEmailApi", () => ({ confirmarCambioEmail: vi.fn() }));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

const TOKEN = "t".repeat(43);
const refrescarUsuario = vi.fn();

function renderPagina(entry = `/confirm-email-change?token=${TOKEN}`) {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <ConfirmarCambioEmailPage />
    </MemoryRouter>
  );
}

describe("ConfirmarCambioEmailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: null, refrescarUsuario });
    confirmarCambioEmail.mockResolvedValue({
      message: "Tu email se actualizó correctamente.",
    });
    refrescarUsuario.mockResolvedValue({ mail: "new@example.com" });
  });

  it("permite confirmar sin sesión y requiere una acción explícita", async () => {
    renderPagina();
    expect(confirmarCambioEmail).not.toHaveBeenCalled();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Confirmar nuevo email" }));
    expect(confirmarCambioEmail).toHaveBeenCalledExactlyOnceWith(TOKEN);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Tu email se actualizó correctamente."
    );
    expect(
      screen.queryByRole("button", { name: "Confirmar nuevo email" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Iniciar sesión" })
    ).toHaveAttribute("href", "/login");
    expect(refrescarUsuario).not.toHaveBeenCalled();
  });

  it("actualiza los datos de la sesión después de confirmar", async () => {
    useAuth.mockReturnValue({
      user: { mail: "old@example.com" },
      refrescarUsuario,
    });
    renderPagina();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Confirmar nuevo email" }));
    await waitFor(() => expect(refrescarUsuario).toHaveBeenCalledTimes(1));
  });

  it("si falta el token indica cómo solicitar otro enlace", () => {
    renderPagina("/confirm-email-change");
    expect(screen.getByText(/Falta el enlace/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Confirmar nuevo email" })
    ).not.toBeInTheDocument();
    expect(confirmarCambioEmail).not.toHaveBeenCalled();
  });

  it.each([400, 409])(
    "muestra el rechazo de la API (%s) y conserva el acceso a Mi cuenta",
    async (status) => {
      confirmarCambioEmail.mockRejectedValue({
        response: {
          status,
          data: { error: "No se pudo confirmar este correo." },
        },
      });
      renderPagina();
      await userEvent
        .setup()
        .click(screen.getByRole("button", { name: "Confirmar nuevo email" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "No se pudo confirmar este correo."
      );
      expect(
        screen.getByRole("link", { name: "Ir a Mi cuenta" })
      ).toHaveAttribute("href", "/app/cuenta");
      expect(refrescarUsuario).not.toHaveBeenCalled();
    }
  );
});
