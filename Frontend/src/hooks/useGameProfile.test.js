import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useGameProfile from "./useGameProfile";
import { getGames } from "../api/gameApi";
import { createGameProfile, updateGameProfile } from "../api/gameProfileApi";
import { getCharactersByGame } from "../api/characterApi";
import { getRanksByGame } from "../api/rankApi";
import { getRolesByGame } from "../api/roleApi";
import { getRegionsByGame } from "../api/regionApi";

vi.mock("../api/gameApi", () => ({ getGames: vi.fn() }));
vi.mock("../api/gameProfileApi", () => ({
  createGameProfile: vi.fn(),
  updateGameProfile: vi.fn(),
}));
vi.mock("../api/characterApi", () => ({ getCharactersByGame: vi.fn() }));
vi.mock("../api/rankApi", () => ({ getRanksByGame: vi.fn() }));
vi.mock("../api/roleApi", () => ({ getRolesByGame: vi.fn() }));
vi.mock("../api/regionApi", () => ({ getRegionsByGame: vi.fn() }));
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ refrescarUsuario: vi.fn() }),
}));

// Perfil con un personaje y un rol con rango: lo minimo para que pase la
// validacion del formulario y llegue a la API.
async function prepararPerfil(result) {
  act(() => result.current.selectGame("2"));
  await waitFor(() => expect(result.current.characters).toHaveLength(1));

  act(() => result.current.addCharacter("1"));
  act(() => result.current.toggleRole(1));
  act(() => result.current.setProfileRank(2));
}

describe("useGameProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGames.mockResolvedValue([
      { id: 2, name: "League of Legends", rank_per_role: false },
    ]);
    getCharactersByGame.mockResolvedValue([{ character_id: 1, name: "Swain" }]);
    getRolesByGame.mockResolvedValue([{ role_id: 1, name: "Mid" }]);
    getRanksByGame.mockResolvedValue([{ rank_id: 2, name: "Bronce" }]);
    getRegionsByGame.mockResolvedValue([{ region_id: 5, name: "LAS" }]);
    createGameProfile.mockResolvedValue({ profile_id: 9 });
    updateGameProfile.mockResolvedValue({});
  });

  it("volver a seleccionar el mismo juego no borra personajes, roles ni rangos", async () => {
    const { result } = renderHook(() => useGameProfile());

    act(() => result.current.selectGame("2"));
    await waitFor(() => expect(result.current.characters).toHaveLength(1));

    act(() => result.current.addCharacter("1"));
    act(() => result.current.selectGame("2"));

    expect(result.current.characters).toHaveLength(1);
    expect(result.current.roles).toHaveLength(1);
    expect(result.current.ranks).toHaveLength(1);
    expect(result.current.selectedCharacters).toHaveLength(1);
    expect(getCharactersByGame).toHaveBeenCalledTimes(1);
  });

  it("carga las regiones del videojuego elegido", async () => {
    const { result } = renderHook(() => useGameProfile());

    act(() => result.current.selectGame("2"));

    await waitFor(() =>
      expect(result.current.regions).toEqual([{ region_id: 5, name: "LAS" }])
    );
    expect(getRegionsByGame).toHaveBeenCalledWith("2");
  });

  it("al crear manda la región elegida", async () => {
    const { result } = renderHook(() => useGameProfile());
    await prepararPerfil(result);

    act(() => result.current.selectRegion("5"));
    await act(() => result.current.submitGameProfile());

    expect(createGameProfile).toHaveBeenCalledWith(
      expect.objectContaining({ videogame_id: 2, region_id: 5 })
    );
  });

  it("al crear con 'Ninguna' manda region_id null", async () => {
    const { result } = renderHook(() => useGameProfile());
    await prepararPerfil(result);

    await act(() => result.current.submitGameProfile());

    expect(createGameProfile).toHaveBeenCalledWith(
      expect.objectContaining({ region_id: null })
    );
  });

  it("al editar precarga la región del perfil y permite quitarla", async () => {
    const { result } = renderHook(() => useGameProfile());

    act(() =>
      result.current.startEditProfile({
        game_profile_id: 7,
        videogame: { id: 2 },
        region: { region_id: 5, name: "LAS" },
        characters: [{ character_id: 1, name: "Swain" }],
        role_profiles: [{ role: { role_id: 1 }, rank: { rank_id: 2 } }],
      })
    );
    expect(result.current.selectedRegionId).toBe("5");

    act(() => result.current.selectRegion(""));
    await act(() => result.current.submitEditGameProfile());

    expect(updateGameProfile).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ region_id: null })
    );
  });

  describe("videojuegos sin personajes (has_characters = false)", () => {
    beforeEach(() => {
      getGames.mockResolvedValue([
        { id: 2, name: "CS2", rank_per_role: false, has_characters: false },
      ]);
    });

    it("no exige personajes y los manda vacíos", async () => {
      const { result } = renderHook(() => useGameProfile());
      await waitFor(() => expect(result.current.isLoadingGames).toBe(false));

      act(() => result.current.selectGame("2"));
      await waitFor(() => expect(result.current.roles).toHaveLength(1));
      expect(result.current.usesCharacters).toBe(false);

      act(() => result.current.toggleRole(1));
      act(() => result.current.setProfileRank(2));
      await act(() => result.current.submitGameProfile());

      expect(result.current.formError).toBe("");
      expect(createGameProfile).toHaveBeenCalledWith(
        expect.objectContaining({ character_ids: [] })
      );
    });
  });
});
