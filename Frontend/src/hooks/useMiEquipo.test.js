import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

import useMiEquipo from "./useMiEquipo";
import { expulsarIntegrante, obtenerMiEquipo } from "../api/teamApi";

vi.mock("../api/teamApi", () => ({
  obtenerMiEquipo: vi.fn(),
  expulsarIntegrante: vi.fn(),
}));

const equipoCompleto = {
  team_id: 3,
  player_count: 2,
  max_players: 2,
  consultant_player_info: { is_member: true, is_leader: true },
  members: [
    { user_id: 1, username: "lider", is_leader: true, is_vacant: false },
    { user_id: 2, username: "pepe", is_leader: false, is_vacant: false },
  ],
};

const equipoConVacante = {
  ...equipoCompleto,
  player_count: 1,
  members: [
    equipoCompleto.members[0],
    { user_id: null, username: "Libre", is_leader: false, is_vacant: true },
  ],
};

async function renderHookListo() {
  const hook = renderHook(() => useMiEquipo());
  await waitFor(() => expect(hook.result.current.cargando).toBe(false));
  return hook;
}

describe("useMiEquipo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerMiEquipo.mockResolvedValue(equipoCompleto);
  });

  it("carga el equipo del jugador al montarse", async () => {
    const { result } = await renderHookListo();

    expect(result.current.equipo).toEqual(equipoCompleto);
    expect(result.current.error).toBe("");
  });

  it("expulsa al integrante y refresca el equipo con el cupo vacante", async () => {
    const { result } = await renderHookListo();
    expulsarIntegrante.mockResolvedValue({ status: "success" });
    obtenerMiEquipo.mockResolvedValue(equipoConVacante);

    let exito;
    await act(async () => {
      exito = await result.current.expulsarIntegrante(2);
    });

    expect(exito).toBe(true);
    expect(expulsarIntegrante).toHaveBeenCalledWith(3, 2);
    expect(result.current.equipo.player_count).toBe(1);
    expect(result.current.equipo.members[1].is_vacant).toBe(true);
    expect(result.current.errorExpulsion).toBe("");
  });

  it("muestra un mensaje propio si quien expulsa no es el líder (403)", async () => {
    const { result } = await renderHookListo();
    expulsarIntegrante.mockRejectedValue({
      response: {
        status: 403,
        data: {
          error: "El usuario con ID 2 no es el líder del equipo con ID 3.",
        },
      },
    });

    let exito;
    await act(async () => {
      exito = await result.current.expulsarIntegrante(1);
    });

    expect(exito).toBe(false);
    expect(result.current.errorExpulsion).toBe(
      "Solo el líder del equipo puede expulsar integrantes."
    );
  });

  it("usa el mensaje del backend si el líder intenta expulsarse a sí mismo (400)", async () => {
    const { result } = await renderHookListo();
    expulsarIntegrante.mockRejectedValue({
      response: {
        status: 400,
        data: {
          error: "El líder del equipo no puede autoexpulsarse del equipo.",
        },
      },
    });

    await act(async () => {
      await result.current.expulsarIntegrante(1);
    });

    expect(result.current.errorExpulsion).toBe(
      "El líder del equipo no puede autoexpulsarse del equipo."
    );
    // Ante un 400 se vuelve a pedir el equipo para mostrar su estado real.
    expect(obtenerMiEquipo).toHaveBeenCalledTimes(2);
  });

  it("limpia el error de la expulsión", async () => {
    const { result } = await renderHookListo();
    expulsarIntegrante.mockRejectedValue({ response: { status: 500 } });

    await act(async () => {
      await result.current.expulsarIntegrante(2);
    });
    expect(result.current.errorExpulsion).toBe(
      "Ocurrió un error al expulsar al jugador. Intentá de nuevo."
    );

    act(() => result.current.limpiarErrorExpulsion());
    expect(result.current.errorExpulsion).toBe("");
  });
});
