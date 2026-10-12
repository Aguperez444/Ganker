import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useChatHistory } from "./useChatHistory";
import {
  obtenerHistorialChatroom,
  obtenerHistorialMensajes,
} from "../api/chatApi";

vi.mock("../api/chatApi", () => ({
  obtenerHistorialMensajes: vi.fn(),
  obtenerHistorialChatroom: vi.fn(),
}));

describe("useChatHistory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("US 45 - recupera el historial del chat del equipo ordenado del más viejo al más nuevo", async () => {
    // El backend los devuelve del más nuevo al más viejo.
    obtenerHistorialChatroom.mockResolvedValue([
      { message_id: 3, content: "tercero" },
      { message_id: 2, content: "segundo" },
      { message_id: 1, content: "primero" },
    ]);
    const { result } = renderHook(() => useChatHistory(9, "equipo"));

    const mensajes = await result.current.cargarPaginaHistorial({
      page: 1,
      size: 50,
    });

    expect(obtenerHistorialChatroom).toHaveBeenCalledWith(9, {
      page: 1,
      size: 50,
    });
    expect(obtenerHistorialMensajes).not.toHaveBeenCalled();
    expect(mensajes.map((m) => m.content)).toEqual([
      "primero",
      "segundo",
      "tercero",
    ]);
  });

  it("los chats privados siguen usando su propio endpoint", async () => {
    obtenerHistorialMensajes.mockResolvedValue([]);
    const { result } = renderHook(() => useChatHistory(4));

    await result.current.cargarPaginaHistorial();

    expect(obtenerHistorialMensajes).toHaveBeenCalledWith(4, {
      page: 1,
      size: 50,
    });
    expect(obtenerHistorialChatroom).not.toHaveBeenCalled();
  });
});
