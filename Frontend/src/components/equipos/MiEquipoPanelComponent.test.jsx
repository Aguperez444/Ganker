import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";

import MiEquipoPanelComponent from "./MiEquipoPanelComponent";
import { obtenerMiEquipo, actualizarEquipo } from "../../api/teamApi";
import { getRegionsByGame } from "../../api/regionApi";
import { getRanksByGame } from "../../api/rankApi";

vi.mock("../../api/teamApi", () => ({
  buscarEquipos: vi.fn(),
  obtenerMiEquipo: vi.fn(),
  obtenerEquipo: vi.fn(),
  unirseAEquipo: vi.fn(),
  actualizarEquipo: vi.fn(),
}));

vi.mock("../../api/regionApi", () => ({
  getRegionsByGame: vi.fn(),
  createRegion: vi.fn(),
  updateRegion: vi.fn(),
  deleteRegion: vi.fn(),
}));

vi.mock("../../api/rankApi", () => ({
  getRanksByGame: vi.fn(),
  createRank: vi.fn(),
}));

const REGIONES = [
  { region_id: 2, name: "LAS" },
  { region_id: 1, name: "LAN" },
];

const RANGOS = [
  { rank_id: 1, name: "Bronce", icon_url: null, value: 1 },
  { rank_id: 4, name: "Diamante", icon_url: null, value: 4 },
];

function equipoBase(overrides = {}) {
  return {
    team_id: 5,
    team_name: "Los Pibes",
    description: "Equipo competitivo",
    icon_url: null,
    is_active: true,
    conversation_id: 5,
    player_count: 4,
    max_players: 5,
    allow_other_regions: true,
    representative_rank: {
      rank_id: 4,
      name: "Diamante",
      icon_url: null,
      average_value: 3.5,
    },
    min_rank: { rank_id: 1, name: "Bronce", icon_url: null, value: 1 },
    max_rank: { rank_id: 4, name: "Diamante", icon_url: null, value: 4 },
    videogame: {
      videogame_id: 1,
      name: "League of Legends",
      has_characters: true,
    },
    region: { region_id: 2, region_name: "LAS" },
    consultant_player_info: {
      is_member: true,
      is_leader: true,
      join_eligibility: null,
    },
    members: [
      {
        team_member_role_id: 51,
        is_vacant: false,
        is_leader: true,
        user_id: 5,
        username: "lider",
        name: "Líder",
        icon_url: null,
        active_game_profile: {
          region_name: "LAS",
          active_role_profile: {
            role_id: 1,
            role_name: "Mid",
            rank_name: "Diamante",
            rank_icon_url: null,
          },
        },
      },
      {
        team_member_role_id: 52,
        is_vacant: true,
        is_leader: false,
        user_id: null,
        username: "Libre",
        name: "Libre",
        icon_url: null,
        active_game_profile: {
          region_name: "LAS",
          active_role_profile: {
            role_id: 2,
            role_name: "Support",
            rank_name: "",
            rank_icon_url: null,
          },
        },
      },
    ],
    ...overrides,
  };
}

async function abrirEditor(usuario) {
  await usuario.click(
    await screen.findByRole("button", { name: /editar equipo/i })
  );
  return screen.findByRole("dialog");
}

beforeEach(() => {
  vi.clearAllMocks();
  getRegionsByGame.mockResolvedValue(REGIONES);
  getRanksByGame.mockResolvedValue(RANGOS);
  actualizarEquipo.mockResolvedValue({
    status: "success",
    message: "El equipo Los Pibes ha sido modificado exitosamente",
    data: equipoBase({ team_name: "Los Pibes" }),
  });
});

describe("US 04 - Mi equipo (modificar equipo)", () => {
  it("muestra el equipo del jugador aunque no sea líder, sin botón de edición", async () => {
    obtenerMiEquipo.mockResolvedValue(
      equipoBase({
        consultant_player_info: {
          is_member: true,
          is_leader: false,
          join_eligibility: null,
        },
      })
    );

    render(<MiEquipoPanelComponent />);

    expect(await screen.findByText("Los Pibes")).toBeInTheDocument();
    expect(
      screen.getByText(/solo el líder puede editar/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /editar equipo/i })
    ).toBeNull();
  });

  it("muestra el mensaje cuando el jugador no tiene equipo", async () => {
    obtenerMiEquipo.mockResolvedValue(null);

    render(<MiEquipoPanelComponent />);

    expect(
      await screen.findByText(/no pertenecés a ningún equipo activo/i)
    ).toBeInTheDocument();
  });

  it("permite al líder editar el equipo y muestra la confirmación", async () => {
    const usuario = userEvent.setup();
    const onEquipoActualizado = vi.fn();
    obtenerMiEquipo.mockResolvedValue(equipoBase());

    render(
      <MiEquipoPanelComponent onEquipoActualizado={onEquipoActualizado} />
    );
    const dialogo = await abrirEditor(usuario);

    const inputNombre = within(dialogo).getByLabelText(/nombre/i);
    expect(inputNombre).toHaveValue("Los Pibes");

    await usuario.clear(inputNombre);
    await usuario.type(inputNombre, "Los Pibes Reborn");

    const guardar = within(dialogo).getByRole("button", {
      name: /guardar cambios/i,
    });
    await waitFor(() => expect(guardar).toBeEnabled());
    await usuario.click(guardar);

    expect(actualizarEquipo).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        name: "Los Pibes Reborn",
        allow_other_regions: true,
        region_id: 2,
        min_rank_id: 1,
        max_rank_id: 4,
      })
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      /modificado exitosamente/i
    );
    expect(onEquipoActualizado).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("valida el nombre vacío sin llamar al backend", async () => {
    const usuario = userEvent.setup();
    obtenerMiEquipo.mockResolvedValue(equipoBase());

    render(<MiEquipoPanelComponent />);
    const dialogo = await abrirEditor(usuario);

    await usuario.clear(within(dialogo).getByLabelText(/nombre/i));

    const guardar = within(dialogo).getByRole("button", {
      name: /guardar cambios/i,
    });
    await waitFor(() => expect(guardar).toBeEnabled());
    await usuario.click(guardar);

    expect(
      within(dialogo).getByText(/ingresá un nombre para el equipo/i)
    ).toBeInTheDocument();
    expect(actualizarEquipo).not.toHaveBeenCalled();
  });

  it("muestra el error del backend dentro del modal", async () => {
    const usuario = userEvent.setup();
    obtenerMiEquipo.mockResolvedValue(equipoBase());
    actualizarEquipo.mockRejectedValue({
      response: {
        data: {
          error: "El usuario con ID 5 no es el líder del equipo con ID 5.",
        },
      },
    });

    render(<MiEquipoPanelComponent />);
    const dialogo = await abrirEditor(usuario);

    const guardar = within(dialogo).getByRole("button", {
      name: /guardar cambios/i,
    });
    await waitFor(() => expect(guardar).toBeEnabled());
    await usuario.click(guardar);

    expect(
      await within(dialogo).findByRole("alert")
    ).toHaveTextContent(/no es el líder del equipo/i);
  });
});
