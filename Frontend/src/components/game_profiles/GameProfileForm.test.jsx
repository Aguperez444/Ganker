import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GameProfileForm from "./GameProfileForm";

describe("GameProfileForm - resolución de imágenes", () => {
  const defaultProps = {
    games: [{ id: 1, name: "League of Legends" }],
    characters: [
      {
        character_id: 10,
        name: "Ahri",
        icon_url: "/media/games/league_of_legends/characters/ahri.png",
      },
    ],
    roles: [
      {
        role_id: 20,
        name: "Mid",
        icon_url: "/media/games/league_of_legends/roles/mid.png",
      },
      {
        role_id: 21,
        name: "Support",
        icon_url: "Sin icono",
      },
    ],
    ranks: [{ rank_id: 1, name: "Oro", value: 4 }],
    selectedGameId: "1",
    selectedCharacters: [
      {
        character_id: 10,
        name: "Ahri",
        icon_url: "/media/games/league_of_legends/characters/ahri.png",
      },
    ],
    selectedRoles: [{ role_id: 20, rank_id: 1 }],
    isLoadingGames: false,
    isLoadingGameData: false,
    gamesError: "",
    gameDataError: "",
    onGameChange: vi.fn(),
    onAddCharacter: vi.fn(),
    onRemoveCharacter: vi.fn(),
    onMoveCharacter: vi.fn(),
    onToggleRole: vi.fn(),
    onRoleRankChange: vi.fn(),
    onCancel: vi.fn(),
    isSaving: false,
    formError: "",
    successMessage: "",
    onSubmit: vi.fn(),
  };

  it("resuelve la imagen del personaje hacia el backend y no hacia la ruta relativa del frontend", () => {
    render(<GameProfileForm {...defaultProps} />);

    const images = screen.getAllByRole("img");
    const characterImg = images.find((img) =>
      img.getAttribute("src")?.includes("ahri.png")
    );

    expect(characterImg).toBeDefined();
    expect(characterImg.getAttribute("src")).not.toBe(
      "/media/games/league_of_legends/characters/ahri.png"
    );
    expect(characterImg.getAttribute("src")).toContain("/media/games/league_of_legends/characters/ahri.png");
    if (import.meta.env.VITE_API_URL) {
      expect(characterImg.getAttribute("src")).toContain(import.meta.env.VITE_API_URL);
    }
  });

  it("resuelve la imagen del rol hacia el backend", () => {
    render(<GameProfileForm {...defaultProps} />);

    const images = screen.getAllByRole("img");
    const roleImg = images.find((img) =>
      img.getAttribute("src")?.includes("mid.png")
    );

    expect(roleImg).toBeDefined();
    expect(roleImg.getAttribute("src")).not.toBe(
      "/media/games/league_of_legends/roles/mid.png"
    );
    expect(roleImg.getAttribute("src")).toContain("/media/games/league_of_legends/roles/mid.png");
  });

  it("no renderiza etiqueta img si el rol tiene 'Sin icono'", () => {
    render(<GameProfileForm {...defaultProps} />);

    const images = screen.getAllByRole("img");
    const sinIconoImg = images.find((img) =>
      img.getAttribute("src")?.includes("Sin icono")
    );

    expect(sinIconoImg).toBeUndefined();
  });
});
