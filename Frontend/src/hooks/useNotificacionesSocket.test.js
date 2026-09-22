import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useNotificacionesSocket } from "./useNotificacionesSocket";

class MockWebSocket {
  static instances = [];
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSED = 3;

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
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
}

describe("useNotificacionesSocket", () => {
  const wsOriginal = globalThis.WebSocket;

  beforeEach(() => {
    MockWebSocket.instances = [];
    globalThis.WebSocket = MockWebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = wsOriginal;
    vi.clearAllMocks();
  });

  it("no conecta si no hay token", () => {
    renderHook(() => useNotificacionesSocket(null, vi.fn()));
    expect(MockWebSocket.instances).toHaveLength(0);
  });

  it("se conecta a /api/v1/ws/notifications con el token en la query", () => {
    renderHook(() => useNotificacionesSocket("mi-token", vi.fn()));

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toContain(
      "/api/v1/ws/notifications?token=mi-token"
    );
  });

  it("llama a onNotificacion solo para eventos NEW_MESSAGE_NOTIFICATION", () => {
    const onNotificacion = vi.fn();
    renderHook(() => useNotificacionesSocket("mi-token", onNotificacion));
    const socket = MockWebSocket.instances[0];

    act(() => socket.simularApertura());
    act(() => socket.simularMensaje({ type: "OTRA_COSA" }));
    expect(onNotificacion).not.toHaveBeenCalled();

    const notif = {
      type: "NEW_MESSAGE_NOTIFICATION",
      conversation_id: 42,
      sender_id: 3,
      content: "hola",
      timestamp: "2026-01-01T00:00:00Z",
    };
    act(() => socket.simularMensaje(notif));
    expect(onNotificacion).toHaveBeenCalledWith(notif);
  });
});
