import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { AuthProvider } from "../context/AuthContext";
import LoginPage from "./LoginPage";
import FederatedCallbackPage from "./FederatedCallbackPage";
import CompletarRegistroFederadoPage from "./CompletarRegistroFederadoPage";
import { obtenerJugadorActual } from "../api/jugadoresApi";
import {
  obtenerUrlAutorizacionFederada,
  procesarCallbackFederado,
  completarRegistroFederado,
} from "../api/federatedAuthApi";

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

const TOKENS = {
  access_token: "acceso-federado",
  refresh_token: "refresco-federado",
  token_type: "bearer",
};

const JUGADOR = {
  name: "Ana Discord",
  username: "ana_elegido",
  mail: "ana@ejemplo.com",
  role: "player",
  profiles: [],
  icon_url: null,
};

function renderFederatedApp(rutaInicial = "/login") {
  render(
    <MemoryRouter initialEntries={[rutaInicial]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback/:provider" element={<FederatedCallbackPage />} />
          <Route path="/completar-registro" element={<CompletarRegistroFederadoPage />} />
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

describe("inicio de sesión y registro con identidades federadas", () => {
  it("muestra los botones de Discord, Steam, Twitch y Google y maneja error 503", async () => {
    obtenerUrlAutorizacionFederada.mockRejectedValue({
      response: {
        status: 503,
        data: { error: "El inicio de sesión con Discord no está disponible en este momento." },
      },
    });

    renderFederatedApp("/login");

    expect(screen.getByRole("button", { name: "Discord" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Steam" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Twitch" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Google" })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Discord" }));

    expect(
      await screen.findByText(/El inicio de sesión con Discord no está disponible/i)
    ).toBeInTheDocument();
  });

  it("entra directo a /app cuando el callback responde status authenticated", async () => {
    procesarCallbackFederado.mockResolvedValue({
      status: "authenticated",
      provider: "google",
      ...TOKENS,
    });
    obtenerJugadorActual.mockResolvedValue(JUGADOR);

    renderFederatedApp("/auth/callback/google?code=codigo123&state=estado123");

    expect(await screen.findByText("home de jugador")).toBeInTheDocument();
    expect(procesarCallbackFederado).toHaveBeenCalledWith("google", {
      state: "estado123",
      code: "codigo123",
      openidParams: null,
    });
  });

  it("redirige a completar-registro cuando es un usuario nuevo y permite elegir username y nombre", async () => {
    procesarCallbackFederado.mockResolvedValue({
      status: "needs_registration",
      provider: "discord",
      registration_token: "token-reg-firmado",
      suggested_username: "ana_sugerida",
      suggested_name: "Ana Discord",
      email: "ana@ejemplo.com",
      avatar_url: "https://cdn.discordapp.com/avatars/1/a.png",
    });
    completarRegistroFederado.mockResolvedValue(TOKENS);
    obtenerJugadorActual.mockResolvedValue(JUGADOR);

    renderFederatedApp("/auth/callback/discord?code=cod&state=st");

    expect(
      await screen.findByText(/Completá tu registro con Discord/i)
    ).toBeInTheDocument();

    const inputUsername = screen.getByDisplayValue("ana_sugerida");
    expect(inputUsername).toBeInTheDocument();

    const user = userEvent.setup();
    await user.clear(inputUsername);
    await user.type(inputUsername, "ana_elegido");
    await user.click(
      screen.getByRole("button", { name: /Finalizar registro y entrar/i })
    );

    expect(await screen.findByText("home de jugador")).toBeInTheDocument();
    expect(completarRegistroFederado).toHaveBeenCalledWith({
      registrationToken: "token-reg-firmado",
      username: "ana_elegido",
      nombre: "Ana Discord",
      mail: "ana@ejemplo.com",
    });
  });
});
