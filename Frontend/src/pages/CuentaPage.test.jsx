import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { AuthProvider, useAuth } from "../context/AuthContext";
import CuentaPage from "./CuentaPage";
import { actualizarJugador, obtenerJugadorActual } from "../api/jugadoresApi";

vi.mock("../api/jugadoresApi", () => ({
  registrarJugador: vi.fn(),
  obtenerJugadorActual: vi.fn(),
  actualizarJugador: vi.fn(),
}));

vi.mock("../api/axiosClient", () => ({
  default: { post: vi.fn(), get: vi.fn(), put: vi.fn() },
  registrarOnSesionExpirada: vi.fn(),
}));

const JUGADOR = {
  username: "joaco_gg",
  name: "Joaquin Trabucco",
  mail: "joaco@ejemplo.com",
  role: "PLAYER",
  profiles: [],
  icon_url: "/media/users/icons/icon_example_1.png",
};

// Hace de ProtectedRoute: en la app real CuentaPage nunca se renderiza sin
// sesion cargada, asi que el test respeta la misma condicion.
function ConSesion({ children }) {
  const { loading, user } = useAuth();
  if (loading || !user) return <p>cargando</p>;
  return children;
}

function conflicto(mensaje) {
  return { response: { status: 409, data: { error: mensaje } } };
}

async function renderCuenta() {
  localStorage.setItem("access_token", "acceso");
  localStorage.setItem("refresh_token", "refresco");

  render(
    <MemoryRouter>
      <AuthProvider>
        <ConSesion>
          <CuentaPage />
        </ConSesion>
      </AuthProvider>
    </MemoryRouter>
  );

  // Espera a que /me responda y el formulario se precargue.
  return screen.findByDisplayValue(JUGADOR.username);
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  obtenerJugadorActual.mockResolvedValue(JUGADOR);
});

describe("US 02 - Modificar mis datos", () => {
  it("precarga el formulario con los datos actuales del jugador", async () => {
    await renderCuenta();

    expect(screen.getByDisplayValue(JUGADOR.name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(JUGADOR.mail)).toBeInTheDocument();
  });

  it("muestra la foto de perfil que devuelve /me", async () => {
    await renderCuenta();

    const foto = screen.getByAltText(`Foto de perfil de ${JUGADOR.username}`);
    // La ruta llega relativa desde el backend y hay que resolverla contra la
    // API, no contra el server de Vite.
    expect(foto).toHaveAttribute(
      "src",
      expect.stringContaining(JUGADOR.icon_url)
    );
    expect(foto.getAttribute("src").startsWith("/media")).toBe(false);
  });

  it("cae en la inicial del username si el backend no manda foto", async () => {
    obtenerJugadorActual.mockResolvedValue({ ...JUGADOR, icon_url: null });

    await renderCuenta();

    expect(screen.queryByAltText(/foto de perfil/i)).toBeNull();
    expect(screen.getAllByText("J").length).toBeGreaterThan(0);
  });

  it("no ofrece cambiar la contraseña desde esta pantalla", async () => {
    await renderCuenta();

    expect(document.querySelector('input[type="password"]')).toBeNull();
  });

  it("guarda los cambios y confirma cuando los datos son válidos", async () => {
    const usuario = userEvent.setup();
    actualizarJugador.mockResolvedValue({
      ...JUGADOR,
      username: "joaco_ganker",
    });

    await renderCuenta();

    const campoUsername = screen.getByPlaceholderText("Tu nombre de usuario");
    await usuario.clear(campoUsername);
    await usuario.type(campoUsername, "joaco_ganker");
    await usuario.click(
      screen.getByRole("button", { name: /guardar cambios/i })
    );

    await waitFor(() =>
      expect(actualizarJugador).toHaveBeenCalledWith({
        nombre: JUGADOR.name,
        username: "joaco_ganker",
        mail: JUGADOR.mail,
      })
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      /tus datos se guardaron correctamente/i
    );
  });

  it("no guarda si un campo obligatorio queda vacío", async () => {
    const usuario = userEvent.setup();
    await renderCuenta();

    await usuario.clear(screen.getByPlaceholderText("Tu nombre completo"));
    await usuario.click(
      screen.getByRole("button", { name: /guardar cambios/i })
    );

    expect(
      await screen.findByText(/ingresá tu nombre completo/i)
    ).toBeInTheDocument();
    expect(actualizarJugador).not.toHaveBeenCalled();
  });

  it("no guarda si el email tiene un formato inválido", async () => {
    const usuario = userEvent.setup();
    await renderCuenta();

    const campoMail = screen.getByPlaceholderText("tuemail@ejemplo.com");
    await usuario.clear(campoMail);
    await usuario.type(campoMail, "joaco.ejemplo.com");
    await usuario.click(
      screen.getByRole("button", { name: /guardar cambios/i })
    );

    expect(await screen.findByText(/formato válido/i)).toBeInTheDocument();
    expect(actualizarJugador).not.toHaveBeenCalled();
  });

  it("muestra el error en el campo cuando el email ya está usado por otra cuenta", async () => {
    const usuario = userEvent.setup();
    actualizarJugador.mockRejectedValue(
      conflicto('El correo: "ocupado@ejemplo.com" ya está ocupado.')
    );

    await renderCuenta();

    const campoMail = screen.getByPlaceholderText("tuemail@ejemplo.com");
    await usuario.clear(campoMail);
    await usuario.type(campoMail, "ocupado@ejemplo.com");
    await usuario.click(
      screen.getByRole("button", { name: /guardar cambios/i })
    );

    expect(
      await screen.findByText(/el correo.*ya está ocupado/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("muestra el error en el campo cuando el username ya está ocupado", async () => {
    const usuario = userEvent.setup();
    actualizarJugador.mockRejectedValue(
      conflicto('El username: "ocupado" ya está ocupado.')
    );

    await renderCuenta();

    const campoUsername = screen.getByPlaceholderText("Tu nombre de usuario");
    await usuario.clear(campoUsername);
    await usuario.type(campoUsername, "ocupado");
    await usuario.click(
      screen.getByRole("button", { name: /guardar cambios/i })
    );

    expect(
      await screen.findByText(/el username.*ya está ocupado/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
