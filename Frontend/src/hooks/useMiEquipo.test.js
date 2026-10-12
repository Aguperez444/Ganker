import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

import useMiEquipo from "./useMiEquipo";
import {
  eliminarEquipo,
  expulsarIntegrante,
  marcarEquipoInactivo,
  obtenerMiEquipo,
  salirDeEquipo,
  transferirLiderazgo,
} from "../api/teamApi";

vi.mock("../api/teamApi", () => ({
  obtenerMiEquipo: vi.fn(),
  expulsarIntegrante: vi.fn(),
  transferirLiderazgo: vi.fn(),
  eliminarEquipo: vi.fn(),
  salirDeEquipo: vi.fn(),
  marcarEquipoInactivo: vi.fn(),
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

describe("useMiEquipo - US 43 transferir liderazgo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerMiEquipo.mockResolvedValue(equipoCompleto);
  });

  it("transfiere el liderazgo, refresca el equipo y devuelve el mensaje", async () => {
    const { result } = await renderHookListo();
    transferirLiderazgo.mockResolvedValue({
      status: "success",
      message: "El liderazgo del equipo fue transferido exitosamente a pepe",
    });

    let mensaje;
    await act(async () => {
      mensaje = await result.current.transferirLiderazgo(2);
    });

    expect(transferirLiderazgo).toHaveBeenCalledWith(3, 2);
    expect(mensaje).toBe(
      "El liderazgo del equipo fue transferido exitosamente a pepe"
    );
    expect(obtenerMiEquipo).toHaveBeenCalledTimes(2);
    expect(result.current.errorTransferencia).toBe("");
  });

  it("rechaza con un mensaje propio si quien transfiere no es el líder (403)", async () => {
    const { result } = await renderHookListo();
    transferirLiderazgo.mockRejectedValue({
      response: {
        status: 403,
        data: {
          error: "El usuario con ID 2 no es el líder del equipo con ID 3.",
        },
      },
    });

    let mensaje;
    await act(async () => {
      mensaje = await result.current.transferirLiderazgo(1);
    });

    expect(mensaje).toBeNull();
    expect(result.current.errorTransferencia).toBe(
      "Solo el líder del equipo puede transferir el liderazgo."
    );
  });

  it("rechaza si el jugador no pertenece al equipo (400 con IDs)", async () => {
    const { result } = await renderHookListo();
    transferirLiderazgo.mockRejectedValue({
      response: {
        status: 400,
        data: { error: "El usuario con ID 9 no pertenece al equipo con ID 3." },
      },
    });

    await act(async () => {
      await result.current.transferirLiderazgo(9);
    });

    expect(result.current.errorTransferencia).toBe(
      "Ese jugador ya no forma parte del equipo."
    );
  });
});

describe("useMiEquipo - US 16 eliminar equipo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerMiEquipo.mockResolvedValue(equipoCompleto);
  });

  it("elimina el equipo y devuelve la confirmación del backend", async () => {
    const { result } = await renderHookListo();
    eliminarEquipo.mockResolvedValue({
      status: "success",
      message: "El equipo fue disuelto exitosamente.",
    });

    let mensaje;
    await act(async () => {
      mensaje = await result.current.eliminarEquipo();
    });

    expect(eliminarEquipo).toHaveBeenCalledWith(3);
    expect(mensaje).toBe("El equipo fue disuelto exitosamente.");
  });

  it("deniega la eliminación a quien no es el líder (403)", async () => {
    const { result } = await renderHookListo();
    eliminarEquipo.mockRejectedValue({
      response: {
        status: 403,
        data: {
          error: "El usuario con ID 2 no es el líder del equipo con ID 3.",
        },
      },
    });

    let mensaje;
    await act(async () => {
      mensaje = await result.current.eliminarEquipo();
    });

    expect(mensaje).toBeNull();
    expect(result.current.errorEliminacion).toBe(
      "Solo el líder del equipo puede eliminarlo."
    );
  });
});

describe("useMiEquipo - US 19 salirse de un equipo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerMiEquipo.mockResolvedValue(equipoCompleto);
  });

  it("sale del equipo y devuelve la confirmación del backend", async () => {
    const { result } = await renderHookListo();
    salirDeEquipo.mockResolvedValue({
      status: "success",
      message: "Has salido del equipo Los Gankers con éxito",
    });

    let mensaje;
    await act(async () => {
      mensaje = await result.current.salirDelEquipo();
    });

    expect(salirDeEquipo).toHaveBeenCalledWith(3);
    expect(mensaje).toBe("Has salido del equipo Los Gankers con éxito");
  });

  it("al líder le muestra el aviso del backend de transferir o eliminar", async () => {
    const { result } = await renderHookListo();
    salirDeEquipo.mockRejectedValue({
      response: {
        status: 400,
        data: {
          error:
            "El líder del equipo no puede salir directamente. Debe transferir el liderazgo o eliminar el equipo.",
        },
      },
    });

    let mensaje;
    await act(async () => {
      mensaje = await result.current.salirDelEquipo();
    });

    expect(mensaje).toBeNull();
    expect(result.current.errorSalida).toMatch(
      /transferir el liderazgo o eliminar el equipo/
    );
  });
});

describe("useMiEquipo - marcar equipo como inactivo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerMiEquipo.mockResolvedValue(equipoCompleto);
  });

  it("marca el equipo como inactivo y devuelve la confirmación", async () => {
    const { result } = await renderHookListo();
    marcarEquipoInactivo.mockResolvedValue({
      status: "success",
      message: "El equipo fue marcado inactivo exitosamente.",
    });

    let mensaje;
    await act(async () => {
      mensaje = await result.current.marcarEquipoInactivo();
    });

    expect(marcarEquipoInactivo).toHaveBeenCalledWith(3);
    expect(mensaje).toBe("El equipo fue marcado inactivo exitosamente.");
  });

  it("deniega la acción a quien no es el líder (403)", async () => {
    const { result } = await renderHookListo();
    marcarEquipoInactivo.mockRejectedValue({
      response: {
        status: 403,
        data: {
          error: "El usuario con ID 2 no es el líder del equipo con ID 3.",
        },
      },
    });

    let mensaje;
    await act(async () => {
      mensaje = await result.current.marcarEquipoInactivo();
    });

    expect(mensaje).toBeNull();
    expect(result.current.errorInactivo).toBe(
      "Solo el líder del equipo puede marcarlo como inactivo."
    );
  });
});
