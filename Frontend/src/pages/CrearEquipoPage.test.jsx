import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import CrearEquipoPage from "./CrearEquipoPage";
import MiEquipoPage from "./MiEquipoPage";
import { crearEquipo, obtenerMiEquipo } from "../api/teamApi";
import { getRanksByGame } from "../api/rankApi";
import { getRolesByGame } from "../api/roleApi";
import { getRegionsByGame } from "../api/regionApi";

const { usuario } = vi.hoisted(() => ({
  usuario: {
    username: "joaco",
    profiles: [
      {
        game_profile_id: 7,
        videogame: { id: 1, name: "League of Legends" },
        region: { region_id: 2, name: "LAS" },
        characters: [],
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

const equipoCreado = {
  team_id: 1,
  team_name: "Los Gankers",
  description: "Buscamos jungla",
  icon_url: "media/teams/icons/default_icon.png",
  is_active: true,
  conversation_id: 99,
  player_count: 1,
  max_players: 3,
  allow_other_regions: false,
  min_rank: { rank_id: 1, name: "Hierro", value: 1 },
  max_rank: { rank_id: 5, name: "Diamante", value: 5 },
  videogame: { videogame_id: 1, name: "League of Legends" },
  region: { region_id: 2, region_name: "LAS" },
  members: [
    {
      team_member_role_id: 1,
      is_vacant: false,
      is_leader: true,
      user_id: 5,
      username: "joaco",
      name: "Joaquín",
      icon_url: "/media/users/icons/joaco.png",
      active_game_profile: {
        region_name: "LAS",
        active_role_profile: {
          role_id: 10,
          role_name: "Mid",
          rank_name: "Oro",
          rank_icon_url: "",
        },
      },
    },
    {
      team_member_role_id: 2,
      is_vacant: true,
      is_leader: false,
      user_id: null,
      username: "Libre",
      name: "Libre",
      icon_url: "",
      active_game_profile: {
        region_name: "LAS",
        active_role_profile: {
          role_id: 12,
          role_name: "Jungla",
          rank_name: "",
          rank_icon_url: "",
        },
      },
    },
  ],
};

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={["/app/equipos/crear"]}>
      <Routes>
        <Route path="/app/equipos/crear" element={<CrearEquipoPage />} />
        <Route path="/app/equipos/mi-equipo" element={<MiEquipoPage />} />
      </Routes>
    </MemoryRouter>
  );
}

async function elegirVideojuego(user) {
  await user.selectOptions(screen.getByLabelText(/videojuego/i), "1");
  // Espera a que lleguen los catalogos del juego.
  await screen.findAllByRole("option", { name: "Diamante" });
}

async function completarFormulario(user, { minimo = "1", maximo = "5" } = {}) {
  // El formulario aparece recien despues de verificar que no tenga equipo.
  await user.type(
    await screen.findByLabelText(/nombre del equipo/i),
    "Los Gankers"
  );
  await user.type(
    screen.getByLabelText(/mensaje de búsqueda/i),
    "Buscamos jungla"
  );
  await elegirVideojuego(user);
  await user.selectOptions(screen.getByLabelText(/rango mínimo/i), minimo);
  await user.selectOptions(screen.getByLabelText(/rango máximo/i), maximo);
  await user.selectOptions(screen.getByLabelText(/tu rol en el equipo/i), "10");
  await user.selectOptions(screen.getByLabelText(/cupos vacantes/i), "2");
  await user.selectOptions(screen.getByLabelText(/rol del cupo 1/i), "12");
  await user.selectOptions(screen.getByLabelText(/rol del cupo 2/i), "11");
}

describe("US 14 - Crear equipo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerMiEquipo.mockResolvedValue(null);
    // Desordenados a proposito: el formulario los ordena por value.
    getRanksByGame.mockResolvedValue([
      { rank_id: 5, name: "Diamante", value: 5, icon_url: "" },
      { rank_id: 1, name: "Hierro", value: 1, icon_url: "" },
      { rank_id: 3, name: "Oro", value: 3, icon_url: "" },
    ]);
    getRolesByGame.mockResolvedValue([
      { role_id: 10, name: "Mid", icon_url: "" },
      { role_id: 11, name: "Top", icon_url: "" },
      { role_id: 12, name: "Jungla", icon_url: "" },
    ]);
    getRegionsByGame.mockResolvedValue([
      { region_id: 2, name: "LAS" },
      { region_id: 3, name: "LAN" },
    ]);
  });

  it("registra un equipo con datos válidos y redirige a la vista del equipo con el creador como líder", async () => {
    const user = userEvent.setup();
    crearEquipo.mockResolvedValue(equipoCreado);
    renderPagina();

    await completarFormulario(user);

    // La region arranca en la del perfil del jugador.
    expect(screen.getByLabelText(/^región/i)).toHaveValue("2");

    obtenerMiEquipo.mockResolvedValue(equipoCreado);
    await user.click(screen.getByRole("button", { name: /crear equipo/i }));

    expect(crearEquipo).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: "Los Gankers",
        descripcion: "Buscamos jungla",
        videojuegoId: "1",
        regionId: "2",
        admiteOtrasRegiones: false,
        rangoMinimoId: "1",
        rangoMaximoId: "5",
        rolCreadorId: "10",
        rolesVacantesIds: ["12", "11"],
      })
    );

    expect(
      await screen.findByText(/creaste el equipo "los gankers"/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Mi equipo" })
    ).toBeInTheDocument();
    expect(await screen.findByText("Líder")).toBeInTheDocument();
    expect(screen.getByText("joaco")).toBeInTheDocument();
    expect(screen.getByText("Cupo vacante")).toBeInTheDocument();
    expect(screen.getByText("Chat del equipo")).toBeInTheDocument();
  });

  it("no deja crear el equipo con los campos obligatorios vacíos", async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.click(
      await screen.findByRole("button", { name: /crear equipo/i })
    );

    expect(
      screen.getByText("Ingresá el nombre del equipo.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Elegí el videojuego del equipo.")
    ).toBeInTheDocument();
    expect(screen.getByText("Elegí el rango mínimo.")).toBeInTheDocument();
    expect(screen.getByText("Elegí el rango máximo.")).toBeInTheDocument();
    expect(crearEquipo).not.toHaveBeenCalled();
  });

  it("no deja crear el equipo con un rango mínimo superior al máximo", async () => {
    const user = userEvent.setup();
    renderPagina();

    await completarFormulario(user, { minimo: "5", maximo: "1" });
    await user.click(screen.getByRole("button", { name: /crear equipo/i }));

    expect(
      screen.getByText("El rango mínimo no puede ser superior al rango máximo.")
    ).toBeInTheDocument();
    expect(crearEquipo).not.toHaveBeenCalled();
  });

  it("no deja crear el equipo si el rango del creador queda afuera del rango permitido", async () => {
    const user = userEvent.setup();
    renderPagina();

    // El jugador es Oro como Mid y el equipo solo admite Diamante.
    await completarFormulario(user, { minimo: "5", maximo: "5" });
    await user.click(screen.getByRole("button", { name: /crear equipo/i }));

    expect(screen.getByText(/tu rango \(oro\)/i)).toBeInTheDocument();
    expect(crearEquipo).not.toHaveBeenCalled();
  });

  it("no muestra el formulario si el jugador ya está en un equipo activo", async () => {
    obtenerMiEquipo.mockResolvedValue(equipoCreado);
    renderPagina();

    expect(
      await screen.findByText("Ya formás parte de un equipo")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ver mi equipo/i })
    ).toHaveAttribute("href", "/app/equipos/mi-equipo");
    expect(
      screen.queryByLabelText(/nombre del equipo/i)
    ).not.toBeInTheDocument();
  });

  it("muestra el error del backend si el jugador ya se unió a otro equipo mientras completaba el formulario", async () => {
    const user = userEvent.setup();
    crearEquipo.mockRejectedValue({
      response: {
        status: 409,
        data: {
          error: "El usuario con id: 5 ya forma parte de un equipo activo",
        },
      },
    });
    renderPagina();

    await completarFormulario(user);
    await user.click(screen.getByRole("button", { name: /crear equipo/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /ya formás parte de un equipo activo/i
    );
    expect(
      screen.getByRole("heading", { name: "Crear equipo" })
    ).toBeInTheDocument();
  });

  it("pide crear un perfil de juego si el jugador no tiene ninguno", async () => {
    const perfilesOriginales = usuario.profiles;
    usuario.profiles = [];
    renderPagina();

    expect(
      await screen.findByText("Necesitás un perfil de juego")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /crear perfil de juego/i })
    ).toHaveAttribute("href", "/app/perfil");

    usuario.profiles = perfilesOriginales;
  });
});
