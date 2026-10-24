import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TAMANIO_PAGINA_BANEOS, useBuscarBaneos } from "./useBuscarBaneos";
import { useDesbanearJugador } from "./useDesbanearJugador";
import { buscarBaneos, desbanearJugador } from "../api/moderacionApi";
import { FILTROS_BANEOS_VACIOS } from "../utils/baneos";

vi.mock("../api/moderacionApi", () => ({
  buscarBaneos: vi.fn(),
  desbanearJugador: vi.fn(),
}));

// Registro tal como lo devuelve GET /api/v1/moderation/banned-players.
function registro(id, userId) {
  return {
    id,
    banned_by_user_id: 1,
    banned_by_user_username: "admin",
    banned_user_id: userId,
    banned_user_username: `jugador${userId}`,
    date_created: "2026-10-20T10:00:00+00:00",
    date_expire: null,
    reason: `motivo ${id}`,
  };
}

function banFuturo(id, userId) {
  return {
    user_id: userId,
    username: `jugador${userId}`,
    reason: `motivo ${id}`,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

describe("useBuscarBaneos - Buscar jugadores baneados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("al montar busca sin filtros en la primera página", async () => {
    buscarBaneos.mockResolvedValue([registro(1, 10), registro(2, 20)]);

    const { result } = renderHook(() => useBuscarBaneos());

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });
    expect(buscarBaneos).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario: "",
        skip: 0,
        limit: TAMANIO_PAGINA_BANEOS + 1,
      })
    );
    expect(result.current.baneos).toEqual([
      expect.objectContaining({
        id: 1,
        user_id: 10,
        username: "jugador10",
        admin_username: "admin",
        reason: "motivo 1",
      }),
      expect.objectContaining({ id: 2, user_id: 20 }),
    ]);
    expect(result.current.hayMas).toBe(false);
  });

  it("detecta que hay página siguiente y la pide con los mismos filtros", async () => {
    const pagina1 = Array.from({ length: TAMANIO_PAGINA_BANEOS + 1 }, (_, i) =>
      registro(i + 1, i + 1)
    );
    buscarBaneos.mockResolvedValue(pagina1);

    const { result } = renderHook(() => useBuscarBaneos());
    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    await act(async () => {
      await result.current.buscar({ ...FILTROS_BANEOS_VACIOS, admin: "mod" });
    });
    expect(result.current.baneos).toHaveLength(TAMANIO_PAGINA_BANEOS);
    expect(result.current.hayMas).toBe(true);

    buscarBaneos.mockResolvedValue([registro(99, 99)]);
    await act(async () => {
      await result.current.paginaSiguiente();
    });

    expect(buscarBaneos).toHaveBeenLastCalledWith(
      expect.objectContaining({ admin: "mod", skip: TAMANIO_PAGINA_BANEOS })
    );
    expect(result.current.pagina).toBe(1);
    expect(result.current.hayMas).toBe(false);
  });

  it("buscar con filtros combinados vuelve a la primera página", async () => {
    buscarBaneos.mockResolvedValue([]);

    const { result } = renderHook(() => useBuscarBaneos());
    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    await act(async () => {
      await result.current.buscar({
        ...FILTROS_BANEOS_VACIOS,
        usuario: "@pedro",
        motivo: "Cheats",
        creadoDesde: "2026-10-01",
      });
    });

    expect(buscarBaneos).toHaveBeenLastCalledWith(
      expect.objectContaining({
        usuario: "pedro",
        motivo: "Cheats",
        creadoDesde: new Date(2026, 9, 1).toISOString(),
        skip: 0,
      })
    );
    expect(result.current.baneos).toEqual([]);
  });

  it("muestra un error si no tiene permisos de admin", async () => {
    buscarBaneos.mockRejectedValue({ response: { status: 403 } });

    const { result } = renderHook(() => useBuscarBaneos());

    await waitFor(() => {
      expect(result.current.error).toBe(
        "No tenés permisos para ver los baneos."
      );
    });
    expect(result.current.baneos).toEqual([]);
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
