import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { AuthProvider } from "../context/AuthContext";
import LoginPage from "./LoginPage";
import ProtectedRoute from "../routes/ProtectedRoute";
import { ROLES_ADMIN } from "../utils/rutas";
import { obtenerJugadorActual } from "../api/jugadoresApi";
import axiosClient from "../api/axiosClient";

vi.mock("../api/jugadoresApi", () => ({
  registrarJugador: vi.fn(),
  obtenerJugadorActual: vi.fn(),
  actualizarJugador: vi.fn(),
}));

vi.mock("../api/axiosClient", () => ({
  default: { post: vi.fn(), get: vi.fn(), put: vi.fn() },
  registrarOnSesionExpirada: vi.fn(),
}));

const TOKENS = {
  access_token: "acceso",
  refresh_token: "refresco",
  token_type: "Bearer",
};

const base = {
  name: "Alguien",
  mail: "alguien@ejemplo.com",
  profiles: [],
  icon_url: null,
};
const JUGADOR = { ...base, username: "un_player", role: "player" };
const ADMIN = { ...base, username: "admin_user", role: "admin" };
const OWNER = { ...base, username: "owner_user", role: "owner" };

function renderApp(rutaInicial = "/login") {
  render(
    <MemoryRouter initialEntries={[rutaInicial]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app" element={<p>home de jugador</p>} />
          <Route element={<ProtectedRoute rolesPermitidos={ROLES_ADMIN} />}>
            <Route path="/app/admin" element={<p>panel de admin</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

async function iniciarSesion() {
  const usuario = userEvent.setup();
  await usuario.type(
    screen.getByPlaceholderText("tuemail@ejemplo.com"),
    "alguien@ejemplo.com"
  );
  await usuario.type(
    screen.getByPlaceholderText("Tu contraseña"),
    "Password12"
  );
  await usuario.click(screen.getByRole("button", { name: /iniciar sesión/i }));
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  axiosClient.post.mockResolvedValue({ data: TOKENS });
});

describe("a donde cae cada rol al iniciar sesion", () => {
  // Esta es la trampa del caso: LoginPage NO puede leer el rol del estado
  // `user` en el mismo evento, porque setUser no actualiza la closure que ya
  // se esta ejecutando. Si alguien lo reescribe usando useAuth().user, este
  // test se pone rojo. Ojo que para el jugador el destino coincide igual, asi
  // que el caso admin es el que realmente protege.
  it("manda al admin al panel", async () => {
    obtenerJugadorActual.mockResolvedValue(ADMIN);
    renderApp();
    await iniciarSesion();

    expect(await screen.findByText("panel de admin")).toBeInTheDocument();
  });

  it("manda al owner al panel", async () => {
    obtenerJugadorActual.mockResolvedValue(OWNER);
    renderApp();
    await iniciarSesion();

    expect(await screen.findByText("panel de admin")).toBeInTheDocument();
  });

  it("manda al jugador a su home", async () => {
    obtenerJugadorActual.mockResolvedValue(JUGADOR);
    renderApp();
    await iniciarSesion();

    expect(await screen.findByText("home de jugador")).toBeInTheDocument();
  });
});

describe("acceso al area administrativa", () => {
  it("saca al jugador que fuerza la URL del panel", async () => {
    obtenerJugadorActual.mockResolvedValue(JUGADOR);
    localStorage.setItem("access_token", TOKENS.access_token);
    localStorage.setItem("refresh_token", TOKENS.refresh_token);

    renderApp("/app/admin");

    expect(await screen.findByText("home de jugador")).toBeInTheDocument();
    expect(screen.queryByText("panel de admin")).toBeNull();
  });

  it("deja entrar al admin", async () => {
    obtenerJugadorActual.mockResolvedValue(ADMIN);
    localStorage.setItem("access_token", TOKENS.access_token);
    localStorage.setItem("refresh_token", TOKENS.refresh_token);

    renderApp("/app/admin");

    expect(await screen.findByText("panel de admin")).toBeInTheDocument();
  });
});
