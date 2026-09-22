import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { AuthProvider, useAuth } from "../context/AuthContext";
import { ChatProvider, useChat } from "../context/ChatContext";
import BuscarJugadoresPage from "./BuscarJugadoresPage";
import { obtenerJugadorActual } from "../api/jugadoresApi";
import { iniciarConversacion, obtenerConversaciones } from "../api/chatApi";
import { getGames } from "../api/gameApi";
import {
  getRanksByGame,
  getRolesByGame,
  getCharactersByGame,
  searchGameProfiles,
} from "../api/gameProfileApi";

vi.mock("../api/jugadoresApi", () => ({
  registrarJugador: vi.fn(),
  obtenerJugadorActual: vi.fn(),
  actualizarJugador: vi.fn(),
}));

vi.mock("../api/chatApi", () => ({
  iniciarConversacion: vi.fn(),
  obtenerConversaciones: vi.fn(),
  marcarConversacionComoLeida: vi.fn().mockResolvedValue({}),
}));

vi.mock("../api/gameApi", () => ({
  getGames: vi.fn(),
  createGame: vi.fn(),
  updateGame: vi.fn(),
}));

vi.mock("../api/gameProfileApi", () => ({
  getRanksByGame: vi.fn(),
  getRolesByGame: vi.fn(),
  getCharactersByGame: vi.fn(),
  createGameProfile: vi.fn(),
  updateGameProfile: vi.fn(),
  searchGameProfiles: vi.fn(),
}));

vi.mock("../api/axiosClient", () => ({
  default: { post: vi.fn(), get: vi.fn(), put: vi.fn() },
  registrarOnSesionExpirada: vi.fn(),
  registrarOnTokensRenovados: vi.fn(),
  CLAVES_SESION: {
    access: "access_token",
    refresh: "refresh_token",
    user: "user",
  },
}));

class MockWebSocket {
  static instances = [];
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSED = 3;

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.close = vi.fn();
    MockWebSocket.instances.push(this);
  }
}

// Arma un JWT con el "sub" que necesitemos, sin firmar: obtenerIdUsuarioDesdeToken
// solo decodifica el payload, no valida la firma (eso ya lo hace el backend).
function tokenFalso(userId) {
  const base64url = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  return `${base64url({ alg: "HS256", typ: "JWT" })}.${base64url({ sub: String(userId) })}.firma-falsa`;
}

const JUGADOR = {
  username: "testuser",
  name: "No name",
  mail: "testmail@test.com",
  role: "player",
  profiles: [],
  icon_url: null,
};

const JUEGOS = [
  { id: 1, name: "League of Legends", icon_url: null, rank_per_role: true },
];
const RANGOS = [
  { rank_id: 1, name: "Oro", icon_url: null },
  { rank_id: 2, name: "Diamante", icon_url: null },
];
const ROLES = [
  { role_id: 1, name: "Mid", icon_url: null },
  { role_id: 2, name: "Support", icon_url: null },
];
const PERSONAJES = [
  { character_id: 1, name: "Ahri", icon_url: null },
  { character_id: 2, name: "Lux", icon_url: null },
];

// Simula POST /api/v1/game_profiles/search: 3 jugadores de prueba que ciclan
// entre los rangos/roles/personajes de arriba (mismo esquema que usaba antes
// el mock del hook), pero ya en la forma real que devuelve el backend
// (player anidado + listas de characters/role_profiles).
const JUGADORES_BASE = [
  { player_id: 2, username: "testuser" },
  { player_id: 3, username: "owner_user" },
  { player_id: 4, username: "admin_user" },
];

function perfilesDePrueba({ ranks, roles, characters, name } = {}) {
  return JUGADORES_BASE.map((jugador, indice) => ({
    player: {
      player_id: jugador.player_id,
      player_name: jugador.username,
      icon_url: null,
      last_connection: null,
    },
    characters: [PERSONAJES[indice % PERSONAJES.length]],
    role_profiles: [
      {
        role_profile_id: indice + 1,
        role: ROLES[indice % ROLES.length],
        rank: RANGOS[indice % RANGOS.length],
      },
    ],
  })).filter((perfil) => {
    if (ranks && !ranks.includes(perfil.role_profiles[0].rank.rank_id)) {
      return false;
    }
    if (roles && !roles.includes(perfil.role_profiles[0].role.role_id)) {
      return false;
    }
    if (
      characters &&
      !characters.includes(perfil.characters[0].character_id)
    ) {
      return false;
    }
    if (
      name &&
      !perfil.player.player_name.toLowerCase().includes(name.toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}

function ConSesion({ children }) {
  const { loading, user } = useAuth();
  if (loading || !user) return <p>cargando</p>;
  return children;
}

function EstadoDelChat() {
  const { conversacionActivaId, chatAbierto } = useChat();
  return (
    <p data-testid="estado-chat">
      {chatAbierto ? `abierto:${conversacionActivaId}` : "cerrado"}
    </p>
  );
}

async function renderPagina({ userId = 2 } = {}) {
  localStorage.setItem("access_token", tokenFalso(userId));
  localStorage.setItem("refresh_token", "refresco");

  render(
    <AuthProvider>
      <ConSesion>
        <ChatProvider>
          <BuscarJugadoresPage />
          <EstadoDelChat />
        </ChatProvider>
      </ConSesion>
    </AuthProvider>
  );

  return screen.findByRole("button", { name: /seleccioná un videojuego/i });
}

async function seleccionarVideojuego(usuario) {
  await usuario.click(
    screen.getByRole("button", { name: /seleccioná un videojuego/i })
  );
  await usuario.click(
    await screen.findByRole("button", { name: /League of Legends/ })
  );
  await screen.findAllByRole("button", { name: /enviar mensaje/i });
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  MockWebSocket.instances = [];
  globalThis.WebSocket = MockWebSocket;
  obtenerJugadorActual.mockResolvedValue(JUGADOR);
  obtenerConversaciones.mockResolvedValue([]);
  getGames.mockResolvedValue(JUEGOS);
  getRanksByGame.mockResolvedValue(RANGOS);
  getRolesByGame.mockResolvedValue(ROLES);
  getCharactersByGame.mockResolvedValue(PERSONAJES);
  searchGameProfiles.mockImplementation((filters) =>
    Promise.resolve(perfilesDePrueba(filters))
  );
});

describe("US 03 - Buscar jugadores", () => {
  it("no muestra resultados hasta elegir un videojuego", async () => {
    await renderPagina();

    expect(
      screen.getByText(/seleccioná un videojuego para empezar a buscar/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /enviar mensaje/i })
    ).toBeNull();
  });

  it("al elegir un videojuego muestra la lista de jugadores con sus insignias", async () => {
    const usuario = userEvent.setup();
    await renderPagina({ userId: 999 });

    await seleccionarVideojuego(usuario);

    expect(
      screen.getAllByRole("button", { name: /enviar mensaje/i }).length
    ).toBe(3);
    expect(screen.getAllByText("Oro").length).toBeGreaterThan(0);
  });

  it("filtra por rango y muestra un mensaje claro si no hay coincidencias", async () => {
    const usuario = userEvent.setup();
    await renderPagina({ userId: 999 });
    await seleccionarVideojuego(usuario);

    // Los 3 jugadores mock ciclan entre 2 rangos, así que filtrar por uno
    // reduce la lista sin vaciarla. Los 3 selects opcionales (rango/rol/
    // personaje) arrancan todos con el placeholder "Cualquiera": el de
    // rango es el primero en el orden del DOM.
    await usuario.click(
      screen.getAllByRole("button", { name: /cualquiera/i })[0]
    );
    await usuario.click(screen.getByRole("button", { name: /Diamante/ }));

    const botones = screen.getAllByRole("button", { name: /enviar mensaje/i });
    expect(botones.length).toBeGreaterThan(0);
    expect(botones.length).toBeLessThan(3);
  });

  it("limpiar filtros vuelve a mostrar la lista completa del videojuego", async () => {
    const usuario = userEvent.setup();
    await renderPagina({ userId: 999 });
    await seleccionarVideojuego(usuario);

    await usuario.type(
      screen.getByPlaceholderText(/buscar por username/i),
      "no-existe-nadie-asi"
    );
    expect(
      await screen.findByText(/no se encontraron jugadores/i)
    ).toBeInTheDocument();

    await usuario.click(
      screen.getByRole("button", { name: /limpiar filtros/i })
    );

    expect(
      screen.getAllByRole("button", { name: /enviar mensaje/i }).length
    ).toBe(3);
  });

  it("no muestra el botón de enviar mensaje en la propia tarjeta", async () => {
    const usuario = userEvent.setup();
    // userId 2 = testuser, el primero de la lista mock.
    await renderPagina({ userId: 2 });
    await seleccionarVideojuego(usuario);

    expect(
      screen.getAllByRole("button", { name: /enviar mensaje/i }).length
    ).toBe(2);
  });

  it("al hacer click inicia la conversación y la deja seleccionada en el chat", async () => {
    const usuario = userEvent.setup();
    iniciarConversacion.mockResolvedValue({
      conversation_id: 42,
      player_1_id: 2,
      player_2_id: 3,
    });

    await renderPagina({ userId: 2 });
    await seleccionarVideojuego(usuario);

    await usuario.click(
      screen.getAllByRole("button", { name: /enviar mensaje/i })[0]
    );

    expect(await screen.findByTestId("estado-chat")).toHaveTextContent(
      "abierto:42"
    );
  });

  it("muestra un mensaje de error claro si falla la conexión con el servidor", async () => {
    const usuario = userEvent.setup();
    iniciarConversacion.mockRejectedValue(new Error("Network Error"));

    await renderPagina({ userId: 2 });
    await seleccionarVideojuego(usuario);

    await usuario.click(
      screen.getAllByRole("button", { name: /enviar mensaje/i })[0]
    );

    expect(
      await screen.findByText(/no pudimos conectar con el servidor/i)
    ).toBeInTheDocument();
  });
});
