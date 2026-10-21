import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { AuthProvider, useAuth } from "../../context/AuthContext";
import EliminarCuentaComponent from "./EliminarCuentaComponent";
import LoginPage from "../../pages/LoginPage";
import ProtectedRoute from "../../routes/ProtectedRoute";
import PublicOnlyRoute from "../../routes/PublicOnlyRoute";
import { eliminarMiCuenta, obtenerJugadorActual } from "../../api/jugadoresApi";
import {
  MENSAJE_CUENTA_ELIMINADA,
  useEliminarCuenta,
} from "../../hooks/useEliminarCuenta";

// Mismo cableado que CuentaPage (hook en la pagina, props al componente),
// sin el resto de las secciones de Mi cuenta.
function SeccionEliminarCuenta() {
  const { user } = useAuth();
  const eliminarCuenta = useEliminarCuenta();

  return (
    <EliminarCuentaComponent
      username={user.username}
      abierto={eliminarCuenta.abierto}
      confirmacion={eliminarCuenta.confirmacion}
      puedeConfirmar={eliminarCuenta.puedeConfirmar}
      cargando={eliminarCuenta.cargando}
      error={eliminarCuenta.error}
      onConfirmacionChange={eliminarCuenta.setConfirmacion}
      onAbrir={eliminarCuenta.abrir}
      onCancelar={eliminarCuenta.cancelar}
      onConfirmar={eliminarCuenta.confirmar}
    />
  );
}

vi.mock("../../api/jugadoresApi", () => ({
  registrarJugador: vi.fn(),
  obtenerJugadorActual: vi.fn(),
  actualizarJugador: vi.fn(),
  eliminarMiCuenta: vi.fn(),
}));

vi.mock("../../api/axiosClient", () => ({
  revocarRefreshToken: vi.fn(() => Promise.resolve()),
  default: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn() },
  registrarOnSesionExpirada: vi.fn(),
  registrarOnTokensRenovados: vi.fn(),
}));

const JUGADOR = {
  username: "joaco_gg",
  name: "Joaquin",
  mail: "joaco@ejemplo.com",
  role: "player",
  profiles: [],
  icon_url: null,
};

function renderApp() {
  render(
    <MemoryRouter initialEntries={["/app/cuenta"]}>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/" element={<p>landing</p>} />
            <Route path="/login" element={<LoginPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/app/cuenta" element={<SeccionEliminarCuenta />} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

async function abrirModal(usuario) {
  await usuario.click(
    await screen.findByRole("button", { name: "Eliminar mi cuenta" })
  );
  return screen.getByRole("dialog");
}

function botonConfirmar(modal) {
  return within(modal).getByRole("button", { name: "Eliminar mi cuenta" });
}

describe("US 04 - Eliminar jugador", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("access_token", "acceso");
    localStorage.setItem("refresh_token", "refresco");
    obtenerJugadorActual.mockResolvedValue(JUGADOR);
  });

  it("con la confirmación correcta da de baja, cierra la sesión y avisa en el login", async () => {
    const usuario = userEvent.setup();
    eliminarMiCuenta.mockResolvedValue({
      message: "El usuario ha sido eliminado exitosamente.",
    });
    renderApp();

    const modal = await abrirModal(usuario);
    expect(modal).toHaveTextContent(/perfiles de juego/);
    await usuario.type(within(modal).getByRole("textbox"), "joaco_gg");
    await usuario.click(botonConfirmar(modal));

    expect(eliminarMiCuenta).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(new RegExp(MENSAJE_CUENTA_ELIMINADA))
    ).toBeInTheDocument();
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
  });

  it("con una confirmación incorrecta no deja eliminar", async () => {
    const usuario = userEvent.setup();
    renderApp();

    const modal = await abrirModal(usuario);
    await usuario.type(within(modal).getByRole("textbox"), "otro_usuario");

    expect(botonConfirmar(modal)).toBeDisabled();
    expect(eliminarMiCuenta).not.toHaveBeenCalled();
  });

  it("si la cuenta ya fue eliminada muestra el error y no cierra la sesión", async () => {
    const usuario = userEvent.setup();
    eliminarMiCuenta.mockRejectedValue({
      response: { status: 404, data: { error: "Usuario no encontrado" } },
    });
    renderApp();

    const modal = await abrirModal(usuario);
    await usuario.type(within(modal).getByRole("textbox"), "joaco_gg");
    await usuario.click(botonConfirmar(modal));

    expect(
      await within(modal).findByText("Tu cuenta no existe o ya fue eliminada.")
    ).toBeInTheDocument();
    expect(localStorage.getItem("access_token")).toBe("acceso");
  });

  it("cancelar no elimina la cuenta", async () => {
    const usuario = userEvent.setup();
    renderApp();

    await abrirModal(usuario);
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(eliminarMiCuenta).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(localStorage.getItem("access_token")).toBe("acceso");
  });
});
