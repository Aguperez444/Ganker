import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RegistroPage from "./RegistroPage";
import ConfirmarRegistroPage from "./ConfirmarRegistroPage";
import { registrarJugador } from "../api/jugadoresApi";

vi.mock("../api/jugadoresApi", () => ({ registrarJugador: vi.fn() }));
vi.mock("../api/confirmacionRegistroApi", () => ({
  confirmarRegistro: vi.fn(),
  reenviarConfirmacionRegistro: vi.fn(),
}));

function renderPagina() {
  render(
    <MemoryRouter initialEntries={["/registro"]}>
      <Routes>
        <Route path="/registro" element={<RegistroPage />} />
        <Route
          path="/confirm-registration"
          element={<ConfirmarRegistroPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

async function registrar() {
  const usuario = userEvent.setup();
  await usuario.type(
    screen.getByPlaceholderText("Elegí tu nombre de usuario"),
    "juancito123"
  );
  await usuario.type(
    screen.getByPlaceholderText("tuemail@ejemplo.com"),
    "juan@example.com"
  );
  await usuario.type(
    screen.getByPlaceholderText("Creá una contraseña"),
    "Password123"
  );
  await usuario.type(
    screen.getByPlaceholderText("Repetí tu contraseña"),
    "Password123"
  );
  await usuario.type(
    screen.getByPlaceholderText("Tu nombre completo"),
    "Juan Pérez"
  );
  await usuario.click(screen.getByRole("button", { name: "Crear mi cuenta" }));
}

describe("RegistroPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("pide confirmar el correo antes de abrir una sesión", async () => {
    registrarJugador.mockResolvedValue({
      message: "Te enviamos un correo para confirmar la creación de tu cuenta.",
    });
    renderPagina();
    await registrar();
    expect(
      await screen.findByRole("heading", { name: "Revisá tu correo" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Email de registro" })
    ).toHaveValue("juan@example.com");
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
    expect(
      screen.queryByPlaceholderText("Creá una contraseña")
    ).not.toBeInTheDocument();
  });

  it("conserva el formulario y muestra el conflicto de username", async () => {
    registrarJugador.mockRejectedValue({
      response: {
        status: 409,
        data: { error: "El username ya está ocupado." },
      },
    });
    renderPagina();
    await registrar();
    expect(
      await screen.findByText("El username ya está ocupado.")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Elegí tu nombre de usuario")
    ).toHaveValue("juancito123");
  });
});
