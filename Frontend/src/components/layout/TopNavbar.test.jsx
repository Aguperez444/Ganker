import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { AuthProvider, useAuth } from "../../context/AuthContext";
import { ChatProvider } from "../../context/ChatContext";
import TopNavbar from "./TopNavbar";
import { obtenerJugadorActual } from "../../api/jugadoresApi";
import { obtenerConversaciones } from "../../api/chatApi";
import { revocarRefreshToken } from "../../api/axiosClient";

vi.mock("../../api/jugadoresApi", () => ({
  registrarJugador: vi.fn(),
  obtenerJugadorActual: vi.fn(),
  actualizarJugador: vi.fn(),
}));

vi.mock("../../api/chatApi", () => ({
  obtenerChatrooms: vi.fn(() => Promise.resolve([])),
  marcarChatroomComoLeido: vi.fn(() => Promise.resolve({})),
  iniciarConversacion: vi.fn(),
  obtenerConversaciones: vi.fn(),
  marcarConversacionComoLeida: vi.fn().mockResolvedValue({}),
}));

vi.mock("../../api/axiosClient", () => ({
  revocarRefreshToken: vi.fn(() => Promise.resolve()),
  default: { post: vi.fn(), get: vi.fn(), put: vi.fn() },
  registrarOnSesionExpirada: vi.fn(),
  registrarOnTokensRenovados: vi.fn(),
  CLAVES_SESION: {
    access: "access_token",
    refresh: "refresh_token",
    user: "user",
  },
}));

// TopNavbar lee useChat(), que abre un websocket de notificaciones en
// segundo plano en cuanto hay sesion. jsdom no trae WebSocket: lo stubeamos
// para que ChatProvider pueda montar sin explotar (igual que en
// BuscarJugadoresPage.test.jsx).
class MockWebSocket {
  constructor() {
    this.readyState = 0;
    this.close = vi.fn();
  }
}

const base = {
  name: "Alguien",
  mail: "alguien@ejemplo.com",
  profiles: [],
  icon_url: null,
};
const JUGADOR = { ...base, username: "un_player", role: "player" };
const ADMIN = { ...base, username: "admin_user", role: "admin" };

function RutaActual() {
  return <p data-testid="ruta">{useLocation().pathname}</p>;
}

// Hace de ProtectedRoute: el navbar solo se renderiza con sesion cargada.
function ConSesion({ children }) {
  const { loading, user } = useAuth();
  if (loading || !user) return <p>cargando</p>;
  return children;
}

async function abrirMenuComo(usuario, ruta = "/app") {
  obtenerJugadorActual.mockResolvedValue(usuario);
  localStorage.setItem("access_token", "acceso");
  localStorage.setItem("refresh_token", "refresco");

  render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <ConSesion>
          <ChatProvider>
            <TopNavbar />
            <RutaActual />
          </ChatProvider>
        </ConSesion>
      </AuthProvider>
    </MemoryRouter>
  );

  const boton = await screen.findByRole("button", {
    name: new RegExp(usuario.username),
  });
  await userEvent.setup().click(boton);
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  globalThis.WebSocket = MockWebSocket;
  obtenerConversaciones.mockResolvedValue([]);
});

describe("menu del avatar", () => {
  it("le da al admin un boton directo al panel de administracion desde el de jugador", async () => {
    await abrirMenuComo(ADMIN, "/app");

    expect(screen.getByRole("link", { name: "Panel admin" })).toHaveAttribute(
      "href",
      "/app/admin"
    );
  });

  it("le da al admin un boton directo al panel de jugador desde el de administracion", async () => {
    await abrirMenuComo(ADMIN, "/app/admin");

    expect(screen.getByRole("link", { name: "Panel jugador" })).toHaveAttribute(
      "href",
      "/app"
    );
  });

  it("ya no ofrece el cambio de panel dentro del menu del avatar", async () => {
    await abrirMenuComo(ADMIN);

    expect(
      screen.queryByRole("link", { name: /panel de administración/i })
    ).toBeNull();
    // "Pagina principal" era redundante: se llega a la landing por otro lado.
    expect(
      screen.queryByRole("link", { name: /página principal/i })
    ).toBeNull();
    expect(screen.getByRole("link", { name: "Mi cuenta" })).toBeInTheDocument();
  });

  // El sidebar de jugador no ofrece admin, asi que el boton del navbar es el
  // unico lugar donde podria filtrarse el acceso al panel.
  it("no le muestra nada de admin al jugador", async () => {
    await abrirMenuComo(JUGADOR);

    expect(screen.queryByRole("link", { name: /panel admin/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /panel jugador/i })).toBeNull();
    expect(screen.getByRole("link", { name: "Mi cuenta" })).toBeInTheDocument();
  });
});

describe("boton Atrás", () => {
  it("no aparece en el inicio de cada panel", async () => {
    await abrirMenuComo(JUGADOR, "/app");
    expect(screen.queryByRole("button", { name: "Atrás" })).toBeNull();
  });

  it("no aparece en el inicio del panel de administracion", async () => {
    await abrirMenuComo(ADMIN, "/app/admin");
    expect(screen.queryByRole("button", { name: "Atrás" })).toBeNull();
  });

  it("sin historial dentro de la app vuelve al inicio del panel", async () => {
    await abrirMenuComo(JUGADOR, "/app/equipos/4");

    await userEvent.click(screen.getByRole("button", { name: "Atrás" }));

    expect(screen.getByTestId("ruta")).toHaveTextContent(/^\/app$/);
  });
});

describe("cerrar sesión", () => {
  it("revoca el refresh token en el backend y borra la sesión local", async () => {
    await abrirMenuComo(JUGADOR);

    await userEvent.click(
      screen.getByRole("button", { name: /cerrar sesión/i })
    );

    expect(revocarRefreshToken).toHaveBeenCalledWith("refresco");
    expect(localStorage.getItem("refresh_token")).toBeNull();
    expect(localStorage.getItem("access_token")).toBeNull();
  });

  it("cierra la sesión local aunque el backend falle al revocar", async () => {
    revocarRefreshToken.mockRejectedValueOnce(new Error("Network Error"));
    await abrirMenuComo(JUGADOR);

    await userEvent.click(
      screen.getByRole("button", { name: /cerrar sesión/i })
    );

    expect(localStorage.getItem("refresh_token")).toBeNull();
  });
});
