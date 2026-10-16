import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { AuthProvider } from "../context/AuthContext";
import CallbackFederadoPage from "./CallbackFederadoPage";
import CompletarRegistroFederadoPage from "./CompletarRegistroFederadoPage";
import { obtenerJugadorActual } from "../api/jugadoresApi";
import { procesarCallbackFederado } from "../api/federatedAuthApi";

vi.mock("../api/jugadoresApi", () => ({
  registrarJugador: vi.fn(),
  obtenerJugadorActual: vi.fn(),
  actualizarJugador: vi.fn(),
}));

vi.mock("../api/federatedAuthApi", () => ({
  obtenerUrlAutorizacionFederada: vi.fn(),
  procesarCallbackFederado: vi.fn(),
  completarRegistroFederado: vi.fn(),
}));

vi.mock("../api/axiosClient", () => ({
  revocarRefreshToken: vi.fn(() => Promise.resolve()),
  default: { post: vi.fn(), get: vi.fn(), put: vi.fn() },
  registrarOnSesionExpirada: vi.fn(),
  registrarOnTokensRenovados: vi.fn(),
}));

const JUGADOR = {
  name: "Ana Discord",
  username: "ana",
  mail: "ana@ejemplo.com",
  role: "player",
  profiles: [],
  icon_url: null,
};

function renderCallback(ruta) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>pantalla de login</p>} />
          <Route
            path="/auth/callback/:provider"
            element={<CallbackFederadoPage />}
          />
          <Route
            path="/completar-registro"
            element={<CompletarRegistroFederadoPage />}
          />
          <Route path="/app" element={<p>home de jugador</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe("CallbackFederadoPage", () => {
  it("entra directo a /app cuando la identidad ya estaba vinculada", async () => {
    procesarCallbackFederado.mockResolvedValue({
      status: "authenticated",
      provider: "google",
      access_token: "a",
      refresh_token: "r",
      token_type: "bearer",
    });
    obtenerJugadorActual.mockResolvedValue(JUGADOR);

    renderCallback("/auth/callback/google?code=codigo123&state=estado123");

    expect(await screen.findByText("home de jugador")).toBeInTheDocument();
  });

  it("lleva a completar el registro cuando el usuario es nuevo", async () => {
    procesarCallbackFederado.mockResolvedValue({
      status: "needs_registration",
      provider: "discord",
      registration_token: "token-reg",
      suggested_username: "ana_sugerida",
      suggested_name: "Ana Discord",
      email: null,
      avatar_url: null,
    });

    renderCallback("/auth/callback/discord?code=cod&state=st");

    expect(
      await screen.findByText(/completá tu registro con discord/i)
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("ana_sugerida")).toBeInTheDocument();
  });

  it("muestra el error y un link para volver al login", async () => {
    renderCallback("/auth/callback/steam?openid.mode=cancel&state=st");

    expect(await screen.findByRole("alert")).toHaveTextContent(/se canceló/i);
    expect(
      screen.getByRole("link", { name: /volver al inicio de sesión/i })
    ).toHaveAttribute("href", "/login");
  });
});
