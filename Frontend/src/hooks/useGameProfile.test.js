import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useGameProfile from "./useGameProfile";
import { getGames } from "../api/gameApi";
import {
  getCharactersByGame,
  getRanksByGame,
  getRolesByGame,
} from "../api/gameProfileApi";

vi.mock("../api/gameApi", () => ({ getGames: vi.fn() }));
vi.mock("../api/gameProfileApi", () => ({
  createGameProfile: vi.fn(),
  getCharactersByGame: vi.fn(),
  getRanksByGame: vi.fn(),
  getRolesByGame: vi.fn(),
  updateGameProfile: vi.fn(),
}));
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ refrescarUsuario: vi.fn() }),
}));

describe("useGameProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGames.mockResolvedValue([
      { id: 2, name: "League of Legends", rank_per_role: false },
    ]);
    getCharactersByGame.mockResolvedValue([{ character_id: 1, name: "Swain" }]);
    getRolesByGame.mockResolvedValue([{ role_id: 1, name: "Mid" }]);
    getRanksByGame.mockResolvedValue([{ rank_id: 2, name: "Bronce" }]);
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
});
