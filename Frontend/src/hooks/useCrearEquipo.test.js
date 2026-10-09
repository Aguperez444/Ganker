import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

import useCrearEquipo from "./useCrearEquipo";
import { obtenerMiEquipo } from "../api/teamApi";
import { getRanksByGame } from "../api/rankApi";
import { getRolesByGame } from "../api/roleApi";
import { getRegionsByGame } from "../api/regionApi";

const { usuario } = vi.hoisted(() => ({
  usuario: {
    profiles: [
      {
        game_profile_id: 7,
        videogame: { id: 1, name: "League of Legends" },
        region: { region_id: 2, name: "LAS" },
        role_profiles: [
          {
            role_profile_id: 70,
            role: { role_id: 10, name: "Mid" },
            rank: { rank_id: 3, name: "Oro", value: 3 },
          },
        ],
      },
    ],
  },
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: usuario }),
}));

vi.mock("../api/teamApi", () => ({
  crearEquipo: vi.fn(),
  obtenerMiEquipo: vi.fn(),
}));

vi.mock("../api/rankApi", () => ({ getRanksByGame: vi.fn() }));
vi.mock("../api/roleApi", () => ({ getRolesByGame: vi.fn() }));
vi.mock("../api/regionApi", () => ({ getRegionsByGame: vi.fn() }));

async function renderHookListo() {
  const hook = renderHook(() => useCrearEquipo());
  await waitFor(() =>
    expect(hook.result.current.verificandoEquipo).toBe(false)
  );
  return hook;
}

describe("useCrearEquipo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerMiEquipo.mockResolvedValue(null);
    getRanksByGame.mockResolvedValue([
      { rank_id: 5, name: "Diamante", value: 5 },
      { rank_id: 1, name: "Hierro", value: 1 },
    ]);
    getRolesByGame.mockResolvedValue([{ role_id: 10, name: "Mid" }]);
    getRegionsByGame.mockResolvedValue([{ region_id: 2, name: "LAS" }]);
  });

  it("al elegir un videojuego carga sus catálogos, ordena los rangos y preselecciona la región del perfil", async () => {
    const { result } = await renderHookListo();

    await act(() => result.current.seleccionarVideojuego("1"));

    expect(getRanksByGame).toHaveBeenCalledWith("1");
    expect(result.current.rangos.map((r) => r.name)).toEqual([
      "Hierro",
      "Diamante",
    ]);
    expect(result.current.formulario.regionId).toBe("2");
    expect(result.current.rolesDelJugador).toHaveLength(1);
  });

  it("cambiar de videojuego descarta lo elegido para el anterior pero conserva nombre y descripción", async () => {
    const { result } = await renderHookListo();

    await act(() => result.current.seleccionarVideojuego("1"));
    act(() => {
      result.current.actualizarCampo("nombre", "Los Gankers");
      result.current.actualizarCampo("rangoMinimoId", "1", "rangoMinimo");
      result.current.cambiarCantidadVacantes(2);
      result.current.cambiarRolVacante(0, "10");
    });

    await act(() => result.current.seleccionarVideojuego("1"));

    expect(result.current.formulario.nombre).toBe("Los Gankers");
    expect(result.current.formulario.rangoMinimoId).toBe("");
    expect(result.current.formulario.rolesVacantesIds).toEqual(["", ""]);
  });

  it("corregir el rango mínimo limpia el error de rango que se mostraba en el máximo", async () => {
    const { result } = await renderHookListo();

    await act(() => result.current.seleccionarVideojuego("1"));
    act(() => {
      result.current.actualizarCampo("rangoMinimoId", "5", "rangoMinimo");
      result.current.actualizarCampo("rangoMaximoId", "1", "rangoMaximo");
    });
    await act(() => result.current.enviar());

    expect(result.current.errores.rangoMaximo).toBe(
      "El rango mínimo no puede ser superior al rango máximo."
    );

    act(() => {
      result.current.actualizarCampo("rangoMinimoId", "1", "rangoMinimo");
    });

    expect(result.current.errores.rangoMaximo).toBeUndefined();
  });
});
