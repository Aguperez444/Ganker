import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { AuthProvider, useAuth } from "./AuthContext";
import RegistroPage from "../pages/RegistroPage";
import LoginPage from "../pages/LoginPage";
import { registrarJugador, obtenerJugadorActual } from "../api/jugadoresApi";
import axiosClient from "../api/axiosClient";

vi.mock("../api/jugadoresApi", () => ({
  registrarJugador: vi.fn(),
  obtenerJugadorActual: vi.fn(),
}));

vi.mock("../api/axiosClient", () => ({
  default: { post: vi.fn(), get: vi.fn() },
  registrarOnSesionExpirada: vi.fn(),
}));

const TOKENS = {
  access_token: "acceso",
  refresh_token: "refresco",
  token_type: "Bearer",
};

const JUGADOR = {
  player_id: 1,
  username: "joaco_gg",
  name: "Joaquin Trabucco",
  mail: "joaco@ejemplo.com",
};

function MostrarUser() {
  const { user, loading } = useAuth();
  if (loading) return <p>cargando</p>;
  return <pre data-testid="user">{JSON.stringify(user)}</pre>;
}

function renderConSesion(pagina) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        {pagina}
        <MostrarUser />
      </AuthProvider>
    </MemoryRouter>
  );
}

async function esperarUsuarioCargado() {
  await waitFor(() =>
    expect(screen.getByTestId("user")).toHaveTextContent('"username"')
  );
  return screen.getByTestId("user").textContent;
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  obtenerJugadorActual.mockResolvedValue(JUGADOR);
});

describe("AuthContext: `user` no depende de por donde entro el jugador", () => {
  // Este es EL test del bug: antes, RegistroPage llamaba a guardarSesion() sin
  // datos de usuario y `user` quedaba en null, mientras que por login quedaba
  // en { email }. Mismo jugador logueado, dos estados distintos.
  it("el registro deja el mismo `user` que el login", async () => {
    const usuario = userEvent.setup();

    registrarJugador.mockResolvedValue(TOKENS);
    const registro = renderConSesion(<RegistroPage />);

    await usuario.type(
      screen.getByPlaceholderText("Elegí tu nombre de usuario"),
      "joaco_gg"
    );
    await usuario.type(
      screen.getByPlaceholderText("tuemail@ejemplo.com"),
      "joaco@ejemplo.com"
    );
    await usuario.type(
      screen.getByPlaceholderText("Creá una contraseña"),
      "Password12"
    );
    await usuario.type(
      screen.getByPlaceholderText("Repetí tu contraseña"),
      "Password12"
    );
    await usuario.type(
      screen.getByPlaceholderText("Tu nombre completo"),
      "Joaquin Trabucco"
    );
    await usuario.click(
      screen.getByRole("button", { name: /crear mi cuenta/i })
    );

    const userTrasRegistro = await esperarUsuarioCargado();
    registro.unmount();

    axiosClient.post.mockResolvedValue({ data: TOKENS });
    renderConSesion(<LoginPage />);

    await usuario.type(
      screen.getByPlaceholderText("tuemail@ejemplo.com"),
      "joaco@ejemplo.com"
    );
    await usuario.type(
      screen.getByPlaceholderText("Tu contraseña"),
      "Password12"
    );
    await usuario.click(
      screen.getByRole("button", { name: /iniciar sesión/i })
    );

    const userTrasLogin = await esperarUsuarioCargado();

    expect(userTrasRegistro).toBe(userTrasLogin);
    expect(JSON.parse(userTrasRegistro)).toEqual(JUGADOR);
  });
});

describe("AuthContext: restaurar sesion al recargar la pagina", () => {
  // Protege el orden del useEffect de montaje: si setLoading(false) se ejecuta
  // antes de traer el usuario, ProtectedRoute deja pasar con user en null.
  it("nunca expone una sesion autenticada con `user` en null", async () => {
    localStorage.setItem("access_token", TOKENS.access_token);
    localStorage.setItem("refresh_token", TOKENS.refresh_token);

    const estados = [];

    function Espia() {
      const { user, loading, isAuthenticated } = useAuth();
      estados.push({ user, loading, isAuthenticated });
      return null;
    }

    render(
      <MemoryRouter>
        <AuthProvider>
          <Espia />
          <MostrarUser />
        </AuthProvider>
      </MemoryRouter>
    );

    await esperarUsuarioCargado();

    const sesionAMedias = estados.some(
      (estado) =>
        !estado.loading && estado.isAuthenticated && estado.user === null
    );
    expect(sesionAMedias).toBe(false);
  });

  it("pide el usuario al backend en vez de leerlo de localStorage", async () => {
    localStorage.setItem("access_token", TOKENS.access_token);
    localStorage.setItem("refresh_token", TOKENS.refresh_token);
    localStorage.setItem(
      "user",
      JSON.stringify({ email: "viejo@ejemplo.com" })
    );

    renderConSesion(null);

    const userCargado = await esperarUsuarioCargado();

    expect(obtenerJugadorActual).toHaveBeenCalled();
    expect(JSON.parse(userCargado)).toEqual(JUGADOR);
  });
});
