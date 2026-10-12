import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import EquipoPage from "./EquipoPage";
import { obtenerEquipo, unirseAEquipo } from "../api/teamApi";

const { usuario, chat } = vi.hoisted(() => ({
  usuario: {
    profiles: [
      {
        videogame: { id: 1, name: "League of Legends" },
        region: { region_id: 2, name: "LAS" },
        role_profiles: [
          {
            role: { role_id: 10, name: "Mid" },
            rank: { rank_id: 3, name: "Oro", value: 3 },
          },
        ],
      },
    ],
  },
  chat: {
    cargarConversaciones: vi.fn(),
    seleccionarConversacion: vi.fn(),
  },
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: usuario }),
}));

vi.mock("../context/ChatContext", () => ({
  useChat: () => chat,
}));

vi.mock("../api/roleApi", () => ({
  getRolesByGame: vi.fn().mockResolvedValue([]),
}));

vi.mock("../api/teamApi", () => ({
  obtenerEquipo: vi.fn(),
  unirseAEquipo: vi.fn(),
}));

const lider = {
  team_member_role_id: 20,
  is_vacant: false,
  is_leader: true,
  user_id: 1,
  username: "lider",
  icon_url: "",
  active_game_profile: {
    active_role_profile: { role_id: 11, role_name: "Jungla", rank_name: "Oro" },
  },
};

const vacante = (id, roleId, roleName) => ({
  team_member_role_id: id,
  is_vacant: true,
  is_leader: false,
  user_id: null,
  username: "Libre",
  icon_url: "",
  active_game_profile: {
    active_role_profile: {
      role_id: roleId,
      role_name: roleName,
      rank_name: "",
    },
  },
});

const equipoBase = {
  team_id: 4,
  team_name: "Los Rivales",
  player_count: 1,
  max_players: 3,
  allow_other_regions: false,
  conversation_id: 99,
  videogame: { videogame_id: 1, name: "League of Legends" },
  region: { region_id: 2, region_name: "LAS" },
  min_rank: { rank_id: 2, name: "Plata", value: 2 },
  max_rank: { rank_id: 4, name: "Platino", value: 4 },
  consultant_player_info: {
    is_member: false,
    is_leader: false,
    join_eligibility: { can_join: true, reason: null },
  },
  members: [lider, vacante(30, 10, "Mid"), vacante(31, 12, "Support")],
};

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={["/app/equipos/4"]}>
      <Routes>
        <Route path="/app/equipos/:equipoId" element={<EquipoPage />} />
        <Route
          path="/app/equipos/mi-equipo"
          element={<p>Pantalla mi equipo</p>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("EquipoPage (US 18 - Unirse a equipo)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerEquipo.mockResolvedValue(equipoBase);
  });

  it("se une a la vacante que cumple los requisitos y abre el chat del equipo", async () => {
    unirseAEquipo.mockResolvedValue({
      status: "success",
      message: "Te uniste al equipo Los Rivales",
      chatroom_id: 99,
      data: { ...equipoBase, player_count: 2 },
    });
    renderPagina();

    await userEvent.click(
      await screen.findByRole("button", { name: "Unirse al equipo" })
    );

    // Solo tiene perfil de Mid: Support aparece deshabilitada y Mid queda
    // elegida sola.
    expect(screen.getByRole("radio", { name: /support/i })).toBeDisabled();
    expect(screen.getByRole("radio", { name: /mid/i })).toBeChecked();

    await userEvent.click(screen.getByRole("button", { name: "Unirme" }));

    expect(unirseAEquipo).toHaveBeenCalledWith(4, 30);
    expect(chat.cargarConversaciones).toHaveBeenCalled();
    expect(chat.seleccionarConversacion).toHaveBeenCalledWith(99);
    expect(await screen.findByText("Pantalla mi equipo")).toBeInTheDocument();
  });

  it("no permite unirse si el backend dice que no cumple los requisitos", async () => {
    obtenerEquipo.mockResolvedValue({
      ...equipoBase,
      consultant_player_info: {
        is_member: false,
        join_eligibility: {
          can_join: false,
          reason: "El usuario con id: 5 ya forma parte de un equipo activo",
        },
      },
    });
    renderPagina();

    expect(
      await screen.findByRole("button", { name: "Unirse al equipo" })
    ).toBeDisabled();
    expect(
      screen.getByText(/Ya formás parte de otro equipo activo/)
    ).toBeInTheDocument();
  });

  it("muestra el rechazo del backend traducido si el equipo se llenó mientras elegía", async () => {
    unirseAEquipo.mockRejectedValue({
      response: {
        status: 400,
        data: {
          error:
            "El equipo con id: 4 está completo, no pueden unirse más usuarios",
        },
      },
    });
    renderPagina();

    await userEvent.click(
      await screen.findByRole("button", { name: "Unirse al equipo" })
    );
    await userEvent.click(screen.getByRole("button", { name: "Unirme" }));

    expect(
      await screen.findByText("El equipo ya no tiene vacantes disponibles.")
    ).toBeInTheDocument();
    expect(chat.seleccionarConversacion).not.toHaveBeenCalled();
    // Se recarga el equipo para mostrar su estado real.
    expect(obtenerEquipo).toHaveBeenCalledTimes(2);
  });
});
