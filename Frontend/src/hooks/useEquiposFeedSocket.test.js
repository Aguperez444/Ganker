import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useEquiposFeedSocket } from "./useEquiposFeedSocket";

const CLAVE_TOKEN = "access_token";

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

describe("useEquiposFeedSocket", () => {
  const wsOriginal = globalThis.WebSocket;

  beforeEach(() => {
    MockWebSocket.instances = [];
    globalThis.WebSocket = MockWebSocket;
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.WebSocket = wsOriginal;
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("no conecta si no hay sesión", () => {
    renderHook(() => useEquiposFeedSocket(vi.fn()));

    expect(MockWebSocket.instances).toHaveLength(0);
  });

  it("se conecta a /api/v1/ws/teams con el token de la sesión", () => {
    localStorage.setItem(CLAVE_TOKEN, "mi-token");

    const { result } = renderHook(() => useEquiposFeedSocket(vi.fn()));

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toContain(
      "/api/v1/ws/teams?token=mi-token"
    );

    act(() => MockWebSocket.instances[0].simularApertura());
    expect(result.current).toBe(true);
  });

  it("llama a onEvento solo para los eventos de equipos", () => {
    localStorage.setItem(CLAVE_TOKEN, "mi-token");
    const onEvento = vi.fn();

    renderHook(() => useEquiposFeedSocket(onEvento));
    const socket = MockWebSocket.instances[0];

    act(() => socket.simularApertura());

    act(() => socket.simularMensaje({ type: "OTRA_COSA", data: {} }));
    expect(onEvento).not.toHaveBeenCalled();

    const evento = { type: "TEAM_UPDATED", data: { team_id: 1 } };
    act(() => socket.simularMensaje(evento));
    expect(onEvento).toHaveBeenCalledWith(evento);
  });

  it("ignora mensajes que no son JSON válido", () => {
    localStorage.setItem(CLAVE_TOKEN, "mi-token");
    const onEvento = vi.fn();

    renderHook(() => useEquiposFeedSocket(onEvento));
    const socket = MockWebSocket.instances[0];

    act(() => socket.simularApertura());
    act(() => socket.onmessage({ data: "no-es-json" }));

    expect(onEvento).not.toHaveBeenCalled();
  });

  it("cierra el socket al desmontar", () => {
    localStorage.setItem(CLAVE_TOKEN, "mi-token");

    const { unmount } = renderHook(() => useEquiposFeedSocket(vi.fn()));
    const socket = MockWebSocket.instances[0];

    act(() => socket.simularApertura());
    unmount();

    expect(socket.close).toHaveBeenCalled();
  });
});
