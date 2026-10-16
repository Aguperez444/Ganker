import { act, renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { useAuthFederado } from "./useAuthFederado";
import { obtenerUrlAutorizacionFederada } from "../api/federatedAuthApi";

vi.mock("../api/federatedAuthApi", () => ({
  obtenerUrlAutorizacionFederada: vi.fn(),
}));

describe("useAuthFederado", () => {
  const assign = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("location", { ...window.location, assign });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirige a la URL del proveedor y deja el botón marcado como cargando", async () => {
    obtenerUrlAutorizacionFederada.mockResolvedValue({
      authorization_url: "https://discord.com/oauth2/authorize?x=1",
      provider: "discord",
    });
    const { result } = renderHook(() => useAuthFederado());

    await act(() => result.current.conectar("discord"));

    expect(obtenerUrlAutorizacionFederada).toHaveBeenCalledWith("discord");
    expect(assign).toHaveBeenCalledWith(
      "https://discord.com/oauth2/authorize?x=1"
    );
    expect(result.current.proveedorCargando).toBe("discord");
    expect(result.current.errorFederado).toBeNull();
  });

  it("muestra el mensaje del backend si el proveedor no está disponible", async () => {
    obtenerUrlAutorizacionFederada.mockRejectedValue({
      response: {
        status: 503,
        data: { error: "El inicio de sesión con Discord no está disponible." },
      },
    });
    const { result } = renderHook(() => useAuthFederado());

    await act(() => result.current.conectar("discord"));

    expect(result.current.errorFederado).toBe(
      "El inicio de sesión con Discord no está disponible."
    );
    expect(result.current.proveedorCargando).toBeNull();
    expect(assign).not.toHaveBeenCalled();
  });

  it("usa un mensaje genérico si el backend no responde", async () => {
    obtenerUrlAutorizacionFederada.mockRejectedValue(
      new Error("Network Error")
    );
    const { result } = renderHook(() => useAuthFederado());

    await act(() => result.current.conectar("steam"));

    expect(result.current.errorFederado).toMatch(
      /no pudimos iniciar la conexión/i
    );
  });
});
