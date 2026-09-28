import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { AuthProvider } from "./AuthContext";
import { ChatProvider, useChat } from "./ChatContext";
import { obtenerJugadorActual } from "../api/jugadoresApi";
import {
  iniciarConversacion,
  obtenerConversaciones,
  marcarConversacionComoLeida,
} from "../api/chatApi";

vi.mock("../api/jugadoresApi", () => ({
  registrarJugador: vi.fn(),
  obtenerJugadorActual: vi.fn(),
  actualizarJugador: vi.fn(),
}));

vi.mock("../api/chatApi", () => ({
  iniciarConversacion: vi.fn(),
  obtenerConversaciones: vi.fn(),
  marcarConversacionComoLeida: vi.fn(),
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

  simularApertura() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.({});
  }

  simularNotificacion(data) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

// sub = 1: coincide con JUGADOR (el usuario logueado en estos tests).
function tokenFalso(userId) {
  const base64url = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${base64url({ alg: "HS256" })}.${base64url({ sub: String(userId) })}.firma`;
}

const JUGADOR = {
  username: "testuser",
  name: "No name",
  mail: "testmail@test.com",
  role: "player",
  profiles: [],
  icon_url: null,
};

const CONVERSACIONES = [
  {
    conversation_id: 1,
    other_participant: { user_id: 2, username: "owner_user", name: "owner" },
    last_message: null,
  },
  {
    conversation_id: 2,
    other_participant: { user_id: 3, username: "admin_user", name: "admin1" },
    last_message: null,
  },
];

function Harness() {
  const chat = useChat();
  return (
    <div>
      <span data-testid="total-no-leidos">{chat.totalNoLeidos}</span>
      <span data-testid="activa-id">{chat.conversacionActivaId ?? ""}</span>
      <span data-testid="error">{chat.error ?? ""}</span>
      <ul>
        {chat.conversaciones.map((c) => (
          <li key={c.conversation_id} data-testid={`conv-${c.conversation_id}`}>
            {c.other_participant.username}:{c.unread_count ?? 0}
          </li>
        ))}
      </ul>
      <button onClick={() => chat.iniciarChat(2)}>iniciar-con-2</button>
      <button onClick={() => chat.iniciarChat(1)}>iniciar-con-uno-mismo</button>
      <button onClick={() => chat.seleccionarConversacion(1)}>
        seleccionar-1
      </button>
    </div>
  );
}

async function renderConSesion() {
  localStorage.setItem("access_token", tokenFalso(1));
  localStorage.setItem("refresh_token", "refresco");
  obtenerJugadorActual.mockResolvedValue(JUGADOR);
  obtenerConversaciones.mockResolvedValue(CONVERSACIONES);
  marcarConversacionComoLeida.mockResolvedValue({
    status: "ok",
    messages_marked: 0,
  });

  render(
    <AuthProvider>
      <ChatProvider>
        <Harness />
      </ChatProvider>
    </AuthProvider>
  );

  return screen.findByTestId("conv-1");
}

describe("ChatContext", () => {
  const wsOriginal = globalThis.WebSocket;

  beforeEach(() => {
    MockWebSocket.instances = [];
    globalThis.WebSocket = MockWebSocket;
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.WebSocket = wsOriginal;
  });

  it("inicia una conversación nueva y la deja seleccionada", async () => {
    const usuario = userEvent.setup();
    iniciarConversacion.mockResolvedValue({
      conversation_id: 2,
      player_1_id: 1,
      player_2_id: 3,
    });

    await renderConSesion();
    await usuario.click(screen.getByText("iniciar-con-2"));

    await waitFor(() =>
      expect(screen.getByTestId("activa-id")).toHaveTextContent("2")
    );
    expect(iniciarConversacion).toHaveBeenCalledWith(2);
  });

  it("no permite iniciar una conversación con uno mismo", async () => {
    const usuario = userEvent.setup();
    await renderConSesion();

    await usuario.click(screen.getByText("iniciar-con-uno-mismo"));

    expect(
      await screen.findByText(
        /no podés iniciar una conversación con vos mismo/i
      )
    ).toBeInTheDocument();
    expect(iniciarConversacion).not.toHaveBeenCalled();
  });

  it("muestra un error claro si falla la conexión al iniciar la conversación", async () => {
    const usuario = userEvent.setup();
    iniciarConversacion.mockRejectedValue(new Error("Network Error"));

    await renderConSesion();
    await usuario.click(screen.getByText("iniciar-con-2"));

    expect(
      await screen.findByText(/no pudimos conectar con el servidor/i)
    ).toBeInTheDocument();
  });

  it("suma no leídos cuando llega una notificación de una conversación que no se está viendo", async () => {
    await renderConSesion();
    const socket = MockWebSocket.instances[0];
    act(() => socket.simularApertura());

    act(() =>
      socket.simularNotificacion({
        type: "NEW_MESSAGE_NOTIFICATION",
        conversation_id: 1,
        sender_id: 2,
        content: "hola",
        timestamp: "2026-01-01T00:00:00Z",
      })
    );

    await waitFor(() =>
      expect(screen.getByTestId("total-no-leidos")).toHaveTextContent("1")
    );
    expect(screen.getByTestId("conv-1")).toHaveTextContent("owner_user:1");
  });

  it("no suma no leídos si la conversación notificada ya está seleccionada", async () => {
    const usuario = userEvent.setup();
    await renderConSesion();
    await usuario.click(screen.getByText("seleccionar-1"));

    const socket = MockWebSocket.instances[0];
    act(() => socket.simularApertura());
    act(() =>
      socket.simularNotificacion({
        type: "NEW_MESSAGE_NOTIFICATION",
        conversation_id: 1,
        sender_id: 2,
        content: "hola",
        timestamp: "2026-01-01T00:00:00Z",
      })
    );

    await waitFor(() =>
      expect(screen.getByTestId("conv-1")).toHaveTextContent("owner_user:0")
    );
    expect(screen.getByTestId("total-no-leidos")).toHaveTextContent("0");
  });

  it("limpia el contador de no leídos al seleccionar la conversación", async () => {
    const usuario = userEvent.setup();
    await renderConSesion();

    const socket = MockWebSocket.instances[0];
    act(() => socket.simularApertura());
    act(() =>
      socket.simularNotificacion({
        type: "NEW_MESSAGE_NOTIFICATION",
        conversation_id: 1,
        sender_id: 2,
        content: "hola",
        timestamp: "2026-01-01T00:00:00Z",
      })
    );
    await waitFor(() =>
      expect(screen.getByTestId("conv-1")).toHaveTextContent("owner_user:1")
    );

    await usuario.click(screen.getByText("seleccionar-1"));

    expect(screen.getByTestId("conv-1")).toHaveTextContent("owner_user:0");
    expect(screen.getByTestId("total-no-leidos")).toHaveTextContent("0");
  });
});
