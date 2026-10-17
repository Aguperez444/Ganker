import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { AuthProvider } from "../context/AuthContext";
import CompletarRegistroFederadoPage from "./CompletarRegistroFederadoPage";
import { obtenerJugadorActual } from "../api/jugadoresApi";
import { completarRegistroFederado } from "../api/federatedAuthApi";
import { CLAVE_REGISTRO_FEDERADO } from "../utils/proveedoresFederados";

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

const DATOS = {
  status: "needs_registration",
  provider: "discord",
  registration_token: "token-reg-firmado",
  suggested_username: "ana_sugerida",
  suggested_name: "Ana Discord",
  email: "ana@ejemplo.com",
  avatar_url: null,
};

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

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/completar-registro"]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/completar-registro"
            element={<CompletarRegistroFederadoPage />}
          />
          <Route path="/registro" element={<p>pantalla de registro</p>} />
          <Route path="/login" element={<p>pantalla de login</p>} />
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

describe("CompletarRegistroFederadoPage", () => {
  it("vuelve a /registro si no hay un registro federado pendiente", () => {
    renderPage();

    expect(screen.getByText("pantalla de registro")).toBeInTheDocument();
  });

  it("permite elegir el username y entra a la app", async () => {
    sessionStorage.setItem(CLAVE_REGISTRO_FEDERADO, JSON.stringify(DATOS));
    completarRegistroFederado.mockResolvedValue(TOKENS);
    obtenerJugadorActual.mockResolvedValue(JUGADOR);

    renderPage();

    const usuario = userEvent.setup();
    const inputUsername = screen.getByDisplayValue("ana_sugerida");
    await usuario.clear(inputUsername);
    await usuario.type(inputUsername, "ana_elegido");
    await usuario.click(
      screen.getByRole("button", { name: /finalizar registro y entrar/i })
    );

    expect(await screen.findByText("home de jugador")).toBeInTheDocument();
    expect(completarRegistroFederado).toHaveBeenCalledWith({
      registrationToken: "token-reg-firmado",
      username: "ana_elegido",
      nombre: "Ana Discord",
      mail: "ana@ejemplo.com",
    });
  });

  it("manda al login si la cuenta se creó pero no se pudo traer el perfil", async () => {
    sessionStorage.setItem(CLAVE_REGISTRO_FEDERADO, JSON.stringify(DATOS));
    completarRegistroFederado.mockResolvedValue(TOKENS);
    obtenerJugadorActual.mockRejectedValue(new Error("fallo /me"));

    renderPage();

    await userEvent
      .setup()
      .click(
        screen.getByRole("button", { name: /finalizar registro y entrar/i })
      );

    expect(await screen.findByText("pantalla de login")).toBeInTheDocument();
  });
});
