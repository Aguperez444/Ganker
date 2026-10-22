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
    id,
    banned_user_id: userId,
    banned_user_username: `jugador${userId}`,
    date_expire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

function banVencido(id, userId) {
  return {
    id,
    banned_user_id: userId,
    banned_user_username: `jugador${userId}`,
    date_expire: new Date(Date.now() - 60 * 1000).toISOString(),
  };
}

describe("useJugadoresBaneados - US 36", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("solo deja los baneos que siguen vigentes", async () => {
    obtenerJugadoresBaneados.mockResolvedValue([
      banFuturo(1, 10),
      banVencido(2, 20),
    ]);

    const { result } = renderHook(() => useJugadoresBaneados());
    await act(async () => {
      await result.current.cargar();
    });

    await waitFor(() => {
      expect(result.current.baneados).toHaveLength(1);
    });
    expect(result.current.baneados[0].banned_user_id).toBe(10);
    expect(result.current.estaBaneado(10)).toBe(true);
    expect(result.current.estaBaneado(20)).toBe(false);
  });

  it("al refrescar tras desbanear, la cuenta deja de aparecer", async () => {
    obtenerJugadoresBaneados.mockResolvedValueOnce([banFuturo(1, 10)]);
    obtenerJugadoresBaneados.mockResolvedValueOnce([banVencido(1, 10)]);

    const { result } = renderHook(() => useJugadoresBaneados());
    await act(async () => {
      await result.current.cargar();
    });
    expect(result.current.baneados).toHaveLength(1);

    await act(async () => {
      await result.current.cargar({ forzar: true });
    });

    await waitFor(() => {
      expect(result.current.baneados).toHaveLength(0);
    });
    expect(result.current.estaBaneado(10)).toBe(false);
  });
});

describe("useDesbanearJugador - US 36", () => {
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
