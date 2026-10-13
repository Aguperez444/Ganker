import { render, screen, within } from "@testing-library/react";
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
        videogame: {
          id: 1,
          name: "League of Legends",
          icon_url: "/media/games/league_of_legends/lol.png",
        },
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

// MiEquipoPage (a donde redirige) usa el chat para cerrar la sala al
// eliminar el equipo.
vi.mock("../context/ChatContext", () => ({
  useEventosEquipo: () => {},
  useChat: () => ({
    conversacionActivaId: null,
    cargarConversaciones: vi.fn(),
    cerrarConversacionActiva: vi.fn(),
  }),
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

// Los desplegables con imagen (IconSelectComponent) no son <select> nativos:
// se abre la lista con un click y se elige la opcion por su texto. (No por
// el nombre del boton: si la opcion no tiene imagen, el componente muestra su
// inicial y queda dentro del nombre accesible, ej. "H Hierro").
async function elegirOpcion(user, label, opcion) {
  const disparador = screen.getByLabelText(label);
  await user.click(disparador);
  const lista = within(disparador.parentElement).getByRole("list");
  await user.click(within(lista).getByText(opcion));
}

// El videojuego se elige por su tarjeta con imagen (mismo estilo que
// GameProfileForm), no por un desplegable. El resto del formulario se revela
// por pasos a medida que se completa.
async function elegirVideojuego(user) {
  await user.click(
    await screen.findByRole("button", { name: /league of legends/i })
  );
}

async function completarFormulario(
  user,
  { minimo = "Hierro", maximo = "Diamante" } = {}
) {
  // El formulario aparece recien despues de verificar que no tenga equipo.
  await elegirVideojuego(user);
  await user.type(screen.getByLabelText(/nombre del equipo/i), "Los Gankers");
  await user.type(
    screen.getByLabelText(/mensaje de búsqueda/i),
    "Buscamos jungla"
  );

  // Al completar los datos de la sala se revela Región + Rango permitido (y
  // junto con ellos ya llegaron los catálogos del juego).
  await screen.findByRole("option", { name: "LAN" });

  await elegirOpcion(user, /rango mínimo/i, minimo);
  await elegirOpcion(user, /rango máximo/i, maximo);

  // Con región y rangos completos aparece Integrantes.
  await elegirOpcion(user, /tu rol en el equipo/i, "Mid (Oro)");
  await user.selectOptions(screen.getByLabelText(/cupos vacantes/i), "2");
  await elegirOpcion(user, /rol del cupo 1/i, "Jungla");
  await elegirOpcion(user, /rol del cupo 2/i, "Top");
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
    // La tarjeta del videojuego elegido muestra la imagen del juego.
    expect(
      screen
        .getByRole("button", { name: /league of legends/i })
        .querySelector("img")
    ).toHaveAttribute("src", expect.stringContaining("lol.png"));

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
    expect(screen.getByText("Disponible")).toBeInTheDocument();
    expect(screen.getByText("Chat del equipo")).toBeInTheDocument();
  });

  it("no deja crear el equipo con los campos obligatorios vacíos", async () => {
    const user = userEvent.setup();
    renderPagina();

    // Sin videojuego elegido no se puede enviar ni aparece el resto.
    const boton = await screen.findByRole("button", {
      name: /crear equipo/i,
    });
    expect(boton).toBeDisabled();

    await elegirVideojuego(user);
    await user.click(boton);

    expect(
      screen.getByText("Ingresá el nombre del equipo.")
    ).toBeInTheDocument();
    // Los pasos que todavía no se completaron se muestran igual para que se
    // vean sus errores.
    expect(
      await screen.findByText("Elegí el rango mínimo.")
    ).toBeInTheDocument();
    expect(screen.getByText("Elegí el rango máximo.")).toBeInTheDocument();
    expect(
      await screen.findByText("Elegí el rol con el que vas a jugar.")
    ).toBeInTheDocument();
    expect(crearEquipo).not.toHaveBeenCalled();
  });

  it("revela los pasos a medida que se completa el formulario", async () => {
    const user = userEvent.setup();
    renderPagina();

    // Antes de elegir el videojuego no hay ningún paso del formulario.
    expect(
      screen.queryByLabelText(/nombre del equipo/i)
    ).not.toBeInTheDocument();

    await elegirVideojuego(user);

    // Paso "Datos de la sala": aparece con el videojuego elegido.
    expect(screen.getByLabelText(/nombre del equipo/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^región/i)).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/tu rol en el equipo/i)
    ).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/nombre del equipo/i), "Los Gankers");

    // Al completar los datos de la sala aparece Región + Rango permitido.
    expect(await screen.findByLabelText(/^región/i)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/tu rol en el equipo/i)
    ).not.toBeInTheDocument();

    await elegirOpcion(user, /rango mínimo/i, "Hierro");
    await elegirOpcion(user, /rango máximo/i, "Diamante");

    // Con región y rangos completos aparecen los Integrantes.
    expect(screen.getByLabelText(/tu rol en el equipo/i)).toBeInTheDocument();
  });

  it("no deja crear el equipo con un rango mínimo superior al máximo", async () => {
    const user = userEvent.setup();
    renderPagina();

    await completarFormulario(user, { minimo: "Diamante", maximo: "Hierro" });
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
    await completarFormulario(user, {
      minimo: "Diamante",
      maximo: "Diamante",
    });
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

  it("no muestra el formulario si no puede comprobar si el jugador ya tiene equipo, y lo habilita al reintentar", async () => {
    const user = userEvent.setup();
    obtenerMiEquipo.mockRejectedValueOnce(new Error("Network Error"));
    renderPagina();

    expect(
      await screen.findByText(/no pudimos comprobar si ya formás parte/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/nombre del equipo/i)
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reintentar/i }));

    expect(
      await screen.findByRole("button", { name: /league of legends/i })
    ).toBeInTheDocument();
    expect(obtenerMiEquipo).toHaveBeenCalledTimes(2);
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
