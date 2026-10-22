import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useJugadoresBaneados } from "./useJugadoresBaneados";
import { useDesbanearJugador } from "./useDesbanearJugador";
import {
  desbanearJugador,
  obtenerJugadoresBaneados,
} from "../api/moderacionApi";

vi.mock("../api/moderacionApi", () => ({
  obtenerJugadoresBaneados: vi.fn(),
  desbanearJugador: vi.fn(),
}));

function banFuturo(id, userId) {
  return {
    user_id: userId,
    username: `jugador${userId}`,
    reason: `motivo ${id}`,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

describe("useJugadoresBaneados - US 53", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga al montar y muestra lo que devuelve el backend sin filtrar", async () => {
    obtenerJugadoresBaneados.mockResolvedValue([
      banFuturo(1, 10),
      banFuturo(2, 20),
    ]);

    const { result } = renderHook(() => useJugadoresBaneados());

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });
    expect(obtenerJugadoresBaneados).toHaveBeenCalledTimes(1);
    expect(result.current.baneados.map((b) => b.user_id)).toEqual([10, 20]);
  });

  it("recargar vuelve a pedir el listado al backend", async () => {
    obtenerJugadoresBaneados.mockResolvedValueOnce([banFuturo(1, 10)]);
    obtenerJugadoresBaneados.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useJugadoresBaneados());
    await waitFor(() => {
      expect(result.current.baneados).toHaveLength(1);
    });

    await act(async () => {
      await result.current.recargar();
    });

    expect(obtenerJugadoresBaneados).toHaveBeenCalledTimes(2);
    expect(result.current.baneados).toHaveLength(0);
  });

  it("muestra un error si el admin no tiene permisos", async () => {
    obtenerJugadoresBaneados.mockRejectedValue({ response: { status: 403 } });

    const { result } = renderHook(() => useJugadoresBaneados());

    await waitFor(() => {
      expect(result.current.error).toBe(
        "No tenés permisos para ver los baneos."
      );
    });
  });
});

describe("useDesbanearJugador - US 53", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("confirma el desbaneo y devuelve el mensaje de exito", async () => {
    desbanearJugador.mockResolvedValue("Jugador desbaneado exitosamente");

    const { result } = renderHook(() => useDesbanearJugador());
    act(() => {
      result.current.abrir(banFuturo(1, 10));
    });

    let mensaje;
    await act(async () => {
      mensaje = await result.current.confirmar();
    });

    expect(desbanearJugador).toHaveBeenCalledWith(10);
    expect(mensaje).toMatch(/@jugador10 fue desbaneada/);
    expect(result.current.baneo).toBeNull();
  });

  it("muestra el error del backend si no se puede desbanear", async () => {
    desbanearJugador.mockRejectedValue({
      response: {
        status: 400,
        data: { error: "El jugador no se encuentra baneado" },
      },
    });

    const { result } = renderHook(() => useDesbanearJugador());
    act(() => {
      result.current.abrir(banFuturo(1, 10));
    });

    let mensaje;
    await act(async () => {
      mensaje = await result.current.confirmar();
    });

    expect(mensaje).toBeNull();
    expect(result.current.error).toBe("El jugador no se encuentra baneado");
  });
});
