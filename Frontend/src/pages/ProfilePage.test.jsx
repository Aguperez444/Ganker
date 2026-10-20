import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import ProfilePage from "./ProfilePage";
import useGameProfile from "../hooks/useGameProfile";

const PERFIL_LOL = {
  game_profile_id: 10,
  videogame: { id: 2, name: "League of Legends", icon_url: null },
  characters: [],
  role_profiles: [],
  region: null,
  in_game_name: null,
};

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { profiles: [PERFIL_LOL] },
    refrescarUsuario: vi.fn().mockResolvedValue(),
  }),
}));
vi.mock("../context/ChatContext", () => ({
  useChat: () => ({ currentUserId: 1 }),
}));
vi.mock("../hooks/useGameProfile", () => ({ default: vi.fn() }));

const removeGameProfile = vi.fn();
const clearDeleteError = vi.fn();

function renderizar({ deleteError = "" } = {}) {
  useGameProfile.mockReturnValue({
    games: [],
    editingProfileId: null,
    isDeleting: false,
    deleteError,
    removeGameProfile,
    clearDeleteError,
    resetGameProfileForm: vi.fn(),
    startEditProfile: vi.fn(),
  });

  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );
}

async function abrirModalEliminar(usuario) {
  await usuario.click(screen.getByRole("button", { name: "Eliminar" }));
  return screen.getByRole("dialog");
}

describe("ProfilePage - US 09 Eliminar perfil por juego", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pide confirmación, elimina y muestra el mensaje del backend", async () => {
    const usuario = userEvent.setup();
    removeGameProfile.mockResolvedValue(
      "El perfil de juego ha sido eliminado exitosamente."
    );
    renderizar();

    const modal = await abrirModalEliminar(usuario);
    expect(modal).toHaveTextContent(/League of Legends/);
    expect(modal).toHaveTextContent(/búsquedas de jugadores/);

    await usuario.click(
      within(modal).getByRole("button", { name: "Eliminar" })
    );

    expect(removeGameProfile).toHaveBeenCalledWith(10);
    expect(
      await screen.findByText(/El perfil de juego ha sido eliminado/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("cancelar no elimina el perfil", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await abrirModalEliminar(usuario);
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(removeGameProfile).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("si falla, el modal sigue abierto mostrando el error", async () => {
    const usuario = userEvent.setup();
    removeGameProfile.mockResolvedValue(null);
    renderizar({
      deleteError: "El perfil de juego no existe o ya fue eliminado.",
    });

    const modal = await abrirModalEliminar(usuario);
    await usuario.click(
      within(modal).getByRole("button", { name: "Eliminar" })
    );

    expect(screen.getByRole("dialog")).toHaveTextContent(
      "El perfil de juego no existe o ya fue eliminado."
    );
  });
});
