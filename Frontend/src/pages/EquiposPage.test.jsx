import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import EquiposPage from "./EquiposPage";
import { getGames } from "../api/gameApi";
import { getRegionsByGame } from "../api/regionApi";
import { getRanksByGame } from "../api/rankApi";
import { getRolesByGame } from "../api/roleApi";
import {
  searchTeams,
  createTeam,
  joinTeam,
  getMyActiveTeam,
} from "../api/teamsApi";

// Mocks de APIs
vi.mock("../api/gameApi", () => ({ getGames: vi.fn() }));
vi.mock("../api/regionApi", () => ({ getRegionsByGame: vi.fn() }));
vi.mock("../api/rankApi", () => ({ getRanksByGame: vi.fn() }));
vi.mock("../api/roleApi", () => ({ getRolesByGame: vi.fn() }));
vi.mock("../api/teamsApi", () => ({
  searchTeams: vi.fn(),
  createTeam: vi.fn(),
  joinTeam: vi.fn(),
  getMyActiveTeam: vi.fn(),
}));

// Mock de WebSocket de teams
vi.mock("../api/teamsSocketApi", () => ({
  crearTeamsSocket: () => ({
    readyState: 1, // OPEN
    send: vi.fn(),
    close: vi.fn(),
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null,
  }),
}));

const mockCargarConversaciones = vi.fn();
const mockSeleccionarConversacion = vi.fn();
const mockAbrirChat = vi.fn();

vi.mock("../context/ChatContext", () => ({
  useChat: () => ({
    cargarConversaciones: mockCargarConversaciones,
    seleccionarConversacion: mockSeleccionarConversacion,
    abrirChat: mockAbrirChat,
  }),
}));

const mockUser = {
  user_id: 50,
  username: "faker",
  name: "Lee Sang-hyeok",
  profiles: [
    {
      game_profile_id: 1,
      videogame: { id: 1, name: "League of Legends" },
      region: { region_id: 1, name: "LAS" },
      role_profiles: [
        {
          role: { role_id: 1, name: "Mid" },
          rank: { rank_id: 2, name: "Oro", value: 400 },
        },
      ],
    },
  ],
};

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

describe("EquiposPage - US 01, US 02, US 03", () => {
  const gamesMock = [{ id: 1, name: "League of Legends" }];
  const regionsMock = [{ region_id: 1, name: "LAS" }];
  const ranksMock = [
    { rank_id: 1, name: "Plata", value: 300 },
    { rank_id: 2, name: "Oro", value: 400 },
  ];
  const rolesMock = [
    { role_id: 1, name: "Mid" },
    { role_id: 2, name: "Top" },
  ];

  const team1Mock = {
    team_id: 1,
    team_name: "Los Halcones",
    description: "Sala competitiva para torneos",
    videogame_id: 1,
    videogame_name: "League of Legends",
    region_id: 1,
    region_name: "LAS",
    allow_other_regions: false,
    min_rank_id: 1,
    min_rank_name: "Plata",
    min_rank_value: 300,
    max_rank_id: 2,
    max_rank_name: "Oro",
    max_rank_value: 400,
    player_count: 1,
    max_players: 2,
    members: [
      {
        user_id: 99,
        username: "Captain",
        name: "Capitán",
        icon_url: "",
        active_game_profile: {
          region_name: "LAS",
          active_role_profile: {
            role_id: 2,
            role_name: "Top",
            rank_name: "Oro",
            rank_icon_url: "",
          },
        },
      },
      {
        team_member_role_id: 1,
        user_id: null,
        username: "Libre",
        name: "Libre",
        icon_url: "",
        active_game_profile: {
          region_name: "LAS",
          active_role_profile: {
            role_id: 1,
            role_name: "Mid",
            rank_name: "",
            rank_icon_url: "",
          },
        },
      },
    ],
  };

  const renderEquiposPage = () =>
    render(
      <MemoryRouter>
        <EquiposPage />
      </MemoryRouter>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    getGames.mockResolvedValue(gamesMock);
    getRegionsByGame.mockResolvedValue(regionsMock);
    getRanksByGame.mockResolvedValue(ranksMock);
    getRolesByGame.mockResolvedValue(rolesMock);
    getMyActiveTeam.mockResolvedValue(null);
    searchTeams.mockResolvedValue([team1Mock]);
    mockCargarConversaciones.mockResolvedValue([]);
  });

  it("US 03: Probar ingresar a la sección de búsqueda y visualizar el listado de equipos con sus datos, integrantes, vacantes y contador de jugadores", async () => {
    renderEquiposPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Equipos" })
    ).toBeInTheDocument();

    // Esperar a que cargue el equipo
    expect(await screen.findByText("Los Halcones")).toBeInTheDocument();
    expect(
      screen.getByText(/Sala competitiva para torneos/i)
    ).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("Capitán")).toBeInTheDocument();
    expect(screen.getByText("Rol: Top")).toBeInTheDocument();
    expect(screen.getByText("Mid")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /unirse al equipo/i })
    ).toBeInTheDocument();
  });

  it("US 03: Probar realizar una búsqueda o filtros con criterios que no coincidan con ningún equipo disponible (muestra mensaje de sin resultados)", async () => {
    searchTeams.mockResolvedValue([]);

    renderEquiposPage();

    expect(
      await screen.findByText(
        /No se encontraron equipos disponibles con esos criterios/i
      )
    ).toBeInTheDocument();
  });

  it("US 03: Probar limpiar los filtros aplicados y verificar que se recargue el listado general", async () => {
    const usuario = userEvent.setup();
    renderEquiposPage();

    await screen.findByText("Los Halcones");

    // Escribir en búsqueda por texto
    const inputBusqueda = screen.getByPlaceholderText(
      /buscar por nombre o descripción/i
    );
    await usuario.type(inputBusqueda, "algo");

    const botonLimpiar = screen.getByRole("button", {
      name: /limpiar filtros/i,
    });
    expect(botonLimpiar).toBeEnabled();

    await usuario.click(botonLimpiar);

    expect(inputBusqueda).toHaveValue("");
    expect(searchTeams).toHaveBeenCalled();
  });

  it("US 01: Probar registrar un equipo exitosamente y verificar la confirmación y acceso al chat", async () => {
    const usuario = userEvent.setup();

    const nuevoEquipoCreado = {
      team_id: 10,
      team_name: "Equipo Campeon",
      description: "Vamos a ganar",
      videogame_id: 1,
      videogame_name: "League of Legends",
      region_id: 1,
      region_name: "LAS",
      allow_other_regions: false,
      min_rank_id: 1,
      min_rank_name: "Plata",
      max_rank_id: 2,
      max_rank_name: "Oro",
      player_count: 1,
      max_players: 2,
      members: [
        {
          user_id: 50,
          username: "faker",
          name: "Lee Sang-hyeok",
          active_game_profile: {
            active_role_profile: {
              role_id: 1,
              role_name: "Mid",
              rank_name: "Oro",
            },
          },
        },
        {
          user_id: null,
          username: "Libre",
          name: "Libre",
          active_game_profile: {
            active_role_profile: {
              role_id: 2,
              role_name: "Top",
              rank_name: "",
            },
          },
        },
      ],
    };

    createTeam.mockResolvedValue(nuevoEquipoCreado);

    renderEquiposPage();
    await screen.findByText("Los Halcones");

    // Abrir modal de registrar equipo
    await usuario.click(
      screen.getByRole("button", { name: /\+ registrar equipo/i })
    );

    expect(
      screen.getByRole("heading", { level: 2, name: /registrar un equipo/i })
    ).toBeInTheDocument();

    // Completar nombre
    await usuario.type(
      screen.getByPlaceholderText(/ej: los tryhards nocturnos/i),
      "Equipo Campeon"
    );

    // Seleccionar videojuego
    await usuario.click(
      screen.getByRole("button", { name: /seleccioná un videojuego/i })
    );
    await usuario.click(
      screen.getByRole("button", { name: /league of legends/i })
    );

    // Esperar a que carguen regiones, rangos y roles
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /seleccioná la región/i })
      ).toBeInTheDocument()
    );

    // Seleccionar región
    await usuario.click(
      screen.getByRole("button", { name: /seleccioná la región/i })
    );
    await usuario.click(screen.getByRole("button", { name: /las/i }));

    // Seleccionar rango mínimo
    await usuario.click(screen.getByRole("button", { name: /rango mínimo/i }));
    await usuario.click(screen.getByRole("button", { name: /plata/i }));

    // Seleccionar rango máximo
    await usuario.click(screen.getByRole("button", { name: /rango máximo/i }));
    await usuario.click(screen.getByRole("button", { name: /oro/i }));

    // Seleccionar rol del creador
    await usuario.click(
      screen.getByRole("button", { name: /seleccioná tu rol/i })
    );
    await usuario.click(screen.getByRole("button", { name: /mid/i }));

    // Seleccionar rol de vacante 1
    await usuario.click(
      screen.getByRole("button", { name: /elegí el rol buscado/i })
    );
    await usuario.click(screen.getByRole("button", { name: /top/i }));

    // Enviar formulario
    await usuario.click(
      screen.getByRole("button", { name: /^registrar equipo$/i })
    );

    // Verificar que se haya llamado a createTeam
    await waitFor(() => expect(createTeam).toHaveBeenCalled());
    expect(mockCargarConversaciones).toHaveBeenCalled();

    // Confirmación de éxito visible
    expect(await screen.findByText(/creado con éxito/i)).toBeInTheDocument();
  });

  it("US 02: Probar unirse exitosamente a un equipo y comprobar confirmación y actualización", async () => {
    const usuario = userEvent.setup();

    const equipoActualizado = {
      ...team1Mock,
      player_count: 2,
      members: [
        team1Mock.members[0],
        {
          user_id: 50,
          username: "faker",
          name: "Lee Sang-hyeok",
          active_game_profile: {
            active_role_profile: {
              role_id: 1,
              role_name: "Mid",
              rank_name: "Oro",
            },
          },
        },
      ],
    };

    joinTeam.mockResolvedValue({ status: "success", data: equipoActualizado });

    renderEquiposPage();
    await screen.findByText("Los Halcones");

    // Click en "Unirse al equipo" en la tarjeta
    await usuario.click(
      screen.getByRole("button", { name: /unirse al equipo/i })
    );

    // Modal de unirse abierto
    expect(
      screen.getByRole("heading", { level: 3, name: /unirse a los halcones/i })
    ).toBeInTheDocument();

    // Confirmar unión
    const botonConfirmar = screen.getByRole("button", {
      name: /unirme al equipo/i,
    });
    expect(botonConfirmar).toBeEnabled();
    await usuario.click(botonConfirmar);

    // Debe llamar a joinTeam con team_id 1 y role_id 1 (Mid)
    await waitFor(() => expect(joinTeam).toHaveBeenCalledWith(1, 1));
    expect(mockCargarConversaciones).toHaveBeenCalled();

    // Notificación de éxito
    expect(
      await screen.findByText(
        /te has incorporado exitosamente al equipo "los halcones"/i
      )
    ).toBeInTheDocument();
  });
});
