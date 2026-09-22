import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useChatSocket } from "./useChatSocket";

class MockWebSocket {
  static instances = [];
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.send = vi.fn();
    this.close = vi.fn((code, reason) => {
      this.readyState = MockWebSocket.CLOSED;
      this.onclose?.({ code: code ?? 1000, reason });
    });
    MockWebSocket.instances.push(this);
  }

  simularApertura() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.({});
  }

  simularMensaje(data) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simularCierre(code, reason) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code, reason });
  }
}

describe("useChatSocket", () => {
  const wsOriginal = globalThis.WebSocket;

  beforeEach(() => {
    MockWebSocket.instances = [];
    globalThis.WebSocket = MockWebSocket;
    localStorage.setItem("access_token", "token-de-prueba");
  });

  afterEach(() => {
    globalThis.WebSocket = wsOriginal;
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("se conecta a la conversacion indicada con el token en la query", () => {
    renderHook(() => useChatSocket(42));

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toContain(
      "/api/v1/ws/chat/conversations/42?token=token-de-prueba"
    );
  });

  it("agrega los mensajes que llegan por el socket, sin duplicar por message_id", () => {
    const { result } = renderHook(() => useChatSocket(1));
    const socket = MockWebSocket.instances[0];

    act(() => socket.simularApertura());
    expect(result.current.estado).toBe("ABIERTO");

    act(() =>
      socket.simularMensaje({
        message_id: 5,
        conversation_id: 1,
        sender_id: 9,
        content: "hola",
        timestamp: "2026-01-01T00:00:00Z",
      })
    );
    act(() =>
      socket.simularMensaje({
        message_id: 5,
        conversation_id: 1,
        sender_id: 9,
        content: "hola",
        timestamp: "2026-01-01T00:00:00Z",
      })
    );

    expect(result.current.mensajes).toHaveLength(1);
  });

  it("avisa via onMensaje de cada mensaje entrante", () => {
    const onMensaje = vi.fn();
    renderHook(() => useChatSocket(1, [], onMensaje));
    const socket = MockWebSocket.instances[0];

    act(() => socket.simularApertura());
    act(() =>
      socket.simularMensaje({
        message_id: 1,
        conversation_id: 1,
        sender_id: 9,
        content: "hola",
        timestamp: "2026-01-01T00:00:00Z",
      })
    );

    expect(onMensaje).toHaveBeenCalledWith(
      expect.objectContaining({ content: "hola" })
    );
  });

  it("enviarMensaje manda el contenido y devuelve true si el socket esta abierto", () => {
    const { result } = renderHook(() => useChatSocket(1));
    const socket = MockWebSocket.instances[0];
    act(() => socket.simularApertura());

    let enviado;
    act(() => {
      enviado = result.current.enviarMensaje("hola de prueba");
    });

    expect(enviado).toBe(true);
    expect(socket.send).toHaveBeenCalledWith(
      JSON.stringify({ content: "hola de prueba" })
    );
  });

  it("no envia si el socket todavia no esta abierto y marca un error", () => {
    const { result } = renderHook(() => useChatSocket(1));

    let enviado;
    act(() => {
      enviado = result.current.enviarMensaje("hola");
    });

    expect(enviado).toBe(false);
    expect(result.current.error).toMatch(/no hay conexión/i);
  });

  it("cierra sin acceso a la conversacion (1008) y no reintenta", async () => {
    const { result } = renderHook(() => useChatSocket(1));
    const socket = MockWebSocket.instances[0];

    act(() =>
      socket.simularCierre(1008, "No tenés acceso a esta conversación.")
    );

    await waitFor(() =>
      expect(result.current.error).toBe("No tenés acceso a esta conversación.")
    );
    expect(MockWebSocket.instances).toHaveLength(1);
  });
});
