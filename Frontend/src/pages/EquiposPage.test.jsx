import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";

import EquiposPage from "./EquiposPage";
import { getGames } from "../api/gameApi";
import { getRegionsByGame } from "../api/regionApi";
import { getRanksByGame } from "../api/rankApi";
import { getRolesByGame } from "../api/roleApi";
import { buscarEquipos, unirseAEquipo, obtenerMiEquipo } from "../api/teamApi";

vi.mock("../api/gameApi", () => ({
  getGames: vi.fn(),
  createGame: vi.fn(),
  updateGame: vi.fn(),
}));

vi.mock("../api/regionApi", () => ({
  getRegionsByGame: vi.fn(),
  createRegion: vi.fn(),
  updateRegion: vi.fn(),
  deleteRegion: vi.fn(),
}));

vi.mock("../api/rankApi", () => ({
  getRanksByGame: vi.fn(),
  createRank: vi.fn(),
}));

vi.mock("../api/roleApi", () => ({
  getRolesByGame: vi.fn(),
  createRole: vi.fn(),
}));

vi.mock("../api/teamApi", () => ({
  buscarEquipos: vi.fn(),
  obtenerMiEquipo: vi.fn(),
  obtenerEquipo: vi.fn(),
  unirseAEquipo: vi.fn(),
  actualizarEquipo: vi.fn(),
}));

// El feed en vivo abre un WebSocket real: lo mockeamos y nos guardamos el
// callback para poder simular eventos desde el test.
const feedMock = vi.hoisted(() => ({ onEvento: null }));

vi.mock("../hooks/useEquiposFeedSocket", () => ({
  useEquiposFeedSocket: vi.fn((onEvento) => {
    feedMock.onEvento = onEvento;
    return true;
  }),
}));

const JUEGOS = [
  { id: 1, name: "League of Legends", icon_url: null, rank_per_role: true },
];
const REGIONES = [{ region_id: 1, name: "LAN" }];
const RANGOS = [
  { rank_id: 1, name: "Bronce", icon_url: null, value: 1 },
  { rank_id: 4, name: "Diamante", icon_url: null, value: 4 },
];
const ROLES = [
  { role_id: 1, name: "Mid", icon_url: null },
  { role_id: 2, name: "Support", icon_url: null },
];

function miembroOcupado({ slot, userId, username, nombre, rol, lider = false }) {
  return {
    team_member_role_id: slot,
    is_vacant: false,
    is_leader: lider,
    user_id: userId,
    username,
    name: nombre,
    icon_url: null,
    active_game_profile: {
      region_name: "LAN",
      active_role_profile: {
        role_id: 1,
        role_name: rol,
        rank_name: "Diamante",
        rank_icon_url: null,
      },
    },
  };
}

function vacante({ slot, rol }) {
  return {
    team_member_role_id: slot,
    is_vacant: true,
    is_leader: false,
    user_id: null,
    username: "Libre",
    name: "Libre",
    icon_url: null,
    active_game_profile: {
      region_name: "LAN",
      active_role_profile: {
        role_id: 2,
        role_name: rol,
        rank_name: "",
        rank_icon_url: null,
      },
    },
  };
}

function equipoBase(overrides) {
  return {
    team_id: 1,
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
      average_value: 3.2,
    },
    min_rank: { rank_id: 1, name: "Bronce", icon_url: null, value: 1 },
    max_rank: { rank_id: 4, name: "Diamante", icon_url: null, value: 4 },
    videogame: {
      videogame_id: 1,
      name: "League of Legends",
      has_characters: true,
    },
    region: { region_id: 1, region_name: "LAN" },
    consultant_player_info: {
      is_member: false,
      is_leader: false,
      join_eligibility: { can_join: true, reason: null },
    },
    members: [miembroOcupado({ slot: 11, userId: 2, username: "testuser", nombre: "Test User", rol: "Mid", lider: true })],
    ...overrides,
  };
}

// Un equipo con una sola vacante (une directo) y otro con dos (abre el modal),
// más uno cuyos requisitos el jugador no cumple.
const EQUIPOS = [
  equipoBase({
    team_id: 1,
    members: [
      miembroOcupado({ slot: 11, userId: 2, username: "testuser", nombre: "Test User", rol: "Mid", lider: true }),
      vacante({ slot: 12, rol: "Support" }),
    ],
  }),
  equipoBase({
    team_id: 2,
    team_name: "Los Rookies",
    player_count: 1,
    max_players: 3,
    members: [
      miembroOcupado({ slot: 21, userId: 3, username: "owner_user", nombre: "Owner User", rol: "Mid", lider: true }),
      vacante({ slot: 22, rol: "Jungla" }),
      vacante({ slot: 23, rol: "Top" }),
    ],
  }),
  equipoBase({
    team_id: 3,
    team_name: "Elite Squad",
    consultant_player_info: {
      is_member: false,
      is_leader: false,
      join_eligibility: {
        can_join: false,
        reason: "Tu rango no está dentro del rango permitido por el equipo.",
      },
    },
    members: [
      miembroOcupado({ slot: 31, userId: 4, username: "admin_user", nombre: "Admin User", rol: "Mid", lider: true }),
      vacante({ slot: 32, rol: "Support" }),
    ],
  }),
];

async function renderPagina() {
  render(<EquiposPage />);
  return screen.findByRole("button", {
    name: /seleccioná un videojuego/i,
  });
}

async function seleccionarVideojuego(usuario) {
  await usuario.click(
    screen.getByRole("button", { name: /seleccioná un videojuego/i })
  );
  await usuario.click(
    await screen.findByRole("button", { name: /League of Legends/ })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  feedMock.onEvento = null;
  getGames.mockResolvedValue(JUEGOS);
  getRegionsByGame.mockResolvedValue(REGIONES);
  getRanksByGame.mockResolvedValue(RANGOS);
  getRolesByGame.mockResolvedValue(ROLES);
  buscarEquipos.mockImplementation((filtros = {}) =>
    Promise.resolve(filtros.search ? [] : EQUIPOS)
  );
  obtenerMiEquipo.mockResolvedValue(null);
  unirseAEquipo.mockResolvedValue({
    status: "success",
    message: "¡Te uniste al equipo!",
    chatroom_id: 9,
    data: {},
  });
});

describe("US 03 - Buscar equipos", () => {
  it("no muestra resultados hasta elegir un videojuego", async () => {
    await renderPagina();

    expect(
      screen.getByText(/seleccioná un videojuego para buscar equipos/i)
    ).toBeInTheDocument();
    expect(screen.queryAllByTestId(/^equipo-/)).toHaveLength(0);
    expect(buscarEquipos).not.toHaveBeenCalled();
  });

  it("al elegir un videojuego muestra el listado de equipos con sus datos y vacantes", async () => {
    const usuario = userEvent.setup();
    await renderPagina();
    await seleccionarVideojuego(usuario);

    const equipo1 = await screen.findByTestId("equipo-1");
    expect(within(equipo1).getByText("Los Pibes")).toBeInTheDocument();
    expect(within(equipo1).getByText(/4\/5 jugadores/)).toBeInTheDocument();
    expect(
      within(equipo1).getByText(/vacante de support/i)
    ).toBeInTheDocument();

    const equipo2 = await screen.findByTestId("equipo-2");
    expect(within(equipo2).getByText("Los Rookies")).toBeInTheDocument();
    expect(within(equipo2).getByText(/1\/3 jugadores/)).toBeInTheDocument();
    expect(
      within(equipo2).getByText(/vacante de jungla/i)
    ).toBeInTheDocument();

    expect(buscarEquipos).toHaveBeenCalledWith(
      expect.objectContaining({ videogame_id: 1, page: 1 })
    );
  });

  it("al unirse a un equipo con una sola vacante lo hace directo y muestra la confirmación", async () => {
    const usuario = userEvent.setup();
    await renderPagina();
    await seleccionarVideojuego(usuario);

    const equipo1 = await screen.findByTestId("equipo-1");
    await usuario.click(
      within(equipo1).getByRole("button", { name: /unirse al equipo/i })
    );

    expect(unirseAEquipo).toHaveBeenCalledWith(1, 12);
    expect(await screen.findByRole("status")).toHaveTextContent(
      /te uniste al equipo/i
    );
  });

  it("con varias vacantes abre el modal y une al rol elegido", async () => {
    const usuario = userEvent.setup();
    await renderPagina();
    await seleccionarVideojuego(usuario);

    const equipo2 = await screen.findByTestId("equipo-2");
    await usuario.click(
      within(equipo2).getByRole("button", { name: /unirse al equipo/i })
    );

    const dialogo = await screen.findByRole("dialog");
    expect(
      within(dialogo).getByText(/elegí tu rol en los rookies/i)
    ).toBeInTheDocument();

    await usuario.click(
      within(dialogo).getByRole("button", { name: /jungla/i })
    );

    expect(unirseAEquipo).toHaveBeenCalledWith(2, 22);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).toBeNull()
    );
  });

  it("no ofrece unirse a equipos cuyos requisitos el jugador no cumple y muestra el motivo", async () => {
    const usuario = userEvent.setup();
    await renderPagina();
    await seleccionarVideojuego(usuario);

    const equipo3 = await screen.findByTestId("equipo-3");
    expect(
      within(equipo3).getByText(/tu rango no está dentro del rango/i)
    ).toBeInTheDocument();
    expect(
      within(equipo3).queryByRole("button", { name: /unirse al equipo/i })
    ).toBeNull();
    expect(
      within(equipo3).queryAllByRole("button", { name: /^unirse$/i })
    ).toHaveLength(0);
  });

  it("sin coincidencias muestra el mensaje y limpiar filtros vuelve al listado", async () => {
    const usuario = userEvent.setup();
    await renderPagina();
    await seleccionarVideojuego(usuario);

    await userEvent.type(
      screen.getByPlaceholderText(/nombre o descripción/i),
      "no-existe-nadie-asi"
    );

    expect(
      await screen.findByText(/no se encontraron equipos con esos filtros/i)
    ).toBeInTheDocument();

    await usuario.click(
      screen.getByRole("button", { name: /limpiar filtros/i })
    );

    // Hay un debounce de 350ms en el texto de búsqueda, así que el listado
    // vuelve a cargarse de forma asincrónica tras limpiar los filtros.
    expect((await screen.findAllByTestId(/^equipo-/)).length).toBe(3);
  });

  it("envía los filtros elegidos (región) al backend", async () => {
    const usuario = userEvent.setup();
    await renderPagina();
    await seleccionarVideojuego(usuario);
    await screen.findByTestId("equipo-1");

    // Los 3 selects opcionales (región/rango/rol) arrancan con el placeholder
    // "Cualquiera"; el de región es el primero en el orden del DOM.
    await usuario.click(
      screen.getAllByRole("button", { name: /cualquiera/i })[0]
    );
    await usuario.click(
      await screen.findByRole("button", { name: /LAN/ })
    );

    await waitFor(() =>
      expect(buscarEquipos).toHaveBeenLastCalledWith(
        expect.objectContaining({ region_id: 1, page: 1 })
      )
    );
  });

  it("refresca el listado general cuando llega un evento del feed en vivo", async () => {
    const usuario = userEvent.setup();
    await renderPagina();
    await seleccionarVideojuego(usuario);
    await screen.findByTestId("equipo-1");

    const llamadasPrevias = buscarEquipos.mock.calls.length;

    // El feed avisa que un equipo cambió: la página vuelve a buscar.
    act(() => feedMock.onEvento({ type: "TEAM_UPDATED", data: {} }));

    await waitFor(() =>
      expect(buscarEquipos.mock.calls.length).toBeGreaterThan(llamadasPrevias)
    );
  });
});