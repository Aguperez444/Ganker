import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import GamesPage from "./GamesPage";
import { getGames } from "../../api/gameApi";
import { getRolesByGame, updateRole } from "../../api/roleApi";

// Se mockean las APIs y no los hooks: asi el test ejercita el flujo real de
// GamesPage -> useRoles -> roleApi, que es justamente lo que hay que cubrir.
vi.mock("../../api/gameApi", () => ({
  getGames: vi.fn(),
  createGame: vi.fn(),
  updateGame: vi.fn(),
}));

vi.mock("../../api/roleApi", () => ({
  getRolesByGame: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
}));

const GAMES = [
  {
    videogame_id: 1,
    name: "League of Legends",
    icon_url: "/media/games/lol.png",
    rank_per_role: true,
  },
  {
    videogame_id: 2,
    name: "Valorant",
    icon_url: "/media/games/valorant.png",
    rank_per_role: false,
  },
];

const ROLES = [
  { role_id: 10, name: "Mid", icon_url: "/media/games/lol/roles/mid.png" },
  { role_id: 11, name: "Support", icon_url: "/media/games/lol/roles/support.png" },
];

const ROLES_ACTUALIZADOS = [
  { role_id: 10, name: "Middle Lane", icon_url: "/media/games/lol/roles/mid.png" },
  ROLES[1],
];

async function renderPagina() {
  render(
    <MemoryRouter>
      <GamesPage />
    </MemoryRouter>
  );

  return screen.findByText("League of Legends");
}

async function abrirPanelDeRoles(usuario) {
  await renderPagina();

  await usuario.click(
    screen.getAllByRole("button", { name: /modificar roles/i })[0]
  );

  return screen.findByText("Support");
}

// El boton "Modificar" del panel de roles vive en el <li> del rol, distinto
// de los botones "Modificar roles"/"Modificar juego" de la lista de juegos.
function botonModificarDe(roleName) {
  return within(screen.getByText(roleName).closest("li")).getByRole("button", {
    name: /modificar/i,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getGames.mockResolvedValue(GAMES);
  getRolesByGame.mockResolvedValue(ROLES);
  updateRole.mockResolvedValue({
    role_id: 10,
    name: "Middle Lane",
    icon_url: "/media/games/lol/roles/mid.png",
  });
});

describe("US 29 - Modificar rol desde la lista de videojuegos", () => {
  it("abre los roles del juego a la derecha y deja la lista de juegos visible", async () => {
    const usuario = userEvent.setup();

    await abrirPanelDeRoles(usuario);

    // La lista de juegos sigue en pantalla.
    expect(screen.getByText("Videojuegos soportados")).toBeInTheDocument();
    expect(screen.getByText("Valorant")).toBeInTheDocument();

    // Y a su lado aparece el panel con los roles de ese juego.
    expect(screen.getByText("Roles de League of Legends")).toBeInTheDocument();
    expect(screen.getByText("Mid")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();

    expect(getRolesByGame).toHaveBeenCalledWith(1);
  });

  it("reemplaza el panel por el formulario al elegir un rol", async () => {
    const usuario = userEvent.setup();
    await abrirPanelDeRoles(usuario);

    await usuario.click(botonModificarDe("Mid"));

    expect(await screen.findByText("Modificar rol")).toBeInTheDocument();
    expect(screen.queryByText("Roles de League of Legends")).toBeNull();

    // El formulario viene precargado con los datos del rol elegido.
    expect(screen.getByDisplayValue("Mid")).toBeInTheDocument();
  });

  it("no deja cambiar el videojuego desde el formulario de modificación", async () => {
    const usuario = userEvent.setup();
    await abrirPanelDeRoles(usuario);

    await usuario.click(botonModificarDe("Mid"));

    expect(await screen.findByText("Modificar rol")).toBeInTheDocument();
    expect(
      screen.getByText(/no se puede cambiar el videojuego desde acá/i)
    ).toBeInTheDocument();
    // El juego viene fijo en el selector y deshabilitado.
    expect(screen.getByRole("button", { name: /league of legends/i })).toBeDisabled();
  });

  it("vuelve a la lista de roles del mismo juego al apretar Atrás", async () => {
    const usuario = userEvent.setup();
    await abrirPanelDeRoles(usuario);

    await usuario.click(botonModificarDe("Mid"));
    await screen.findByText("Modificar rol");

    await usuario.click(screen.getByRole("button", { name: /atrás/i }));

    expect(await screen.findByText("Roles de League of Legends")).toBeInTheDocument();
    expect(screen.getByText("Mid")).toBeInTheDocument();
    expect(screen.queryByText("Modificar rol")).toBeNull();
    // No vuelve a pedir los roles: sigue siendo la misma lista.
    expect(getRolesByGame).toHaveBeenCalledTimes(1);
  });

  it("guarda los cambios y actualiza la lista de roles del juego", async () => {
    const usuario = userEvent.setup();
    // Primera carga con los roles viejos, recarga posterior con el rol ya
    // modificado en el backend.
    getRolesByGame
      .mockResolvedValueOnce(ROLES)
      .mockResolvedValue(ROLES_ACTUALIZADOS);

    await abrirPanelDeRoles(usuario);

    await usuario.click(botonModificarDe("Mid"));

    const campoNombre = await screen.findByDisplayValue("Mid");
    await usuario.clear(campoNombre);
    await usuario.type(campoNombre, "Middle Lane");

    await usuario.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() =>
      expect(updateRole).toHaveBeenCalledWith({
        roleId: 10,
        name: "Middle Lane",
        // El backend todavia no persiste la descripcion del rol, asi que
        // roleApi la ignora: se envia igual porque viene del formulario.
        description: "",
        icon: null,
      })
    );

    expect(await screen.findByText(/modificado correctamente/i)).toBeInTheDocument();

    // El panel vuelve a la lista, ya con el rol actualizado.
    expect(screen.getByText("Roles de League of Legends")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Middle Lane")).toBeInTheDocument());
    expect(screen.queryByDisplayValue("Mid")).toBeNull();
  });

  it("no guarda si el nombre del rol queda vacío", async () => {
    const usuario = userEvent.setup();
    await abrirPanelDeRoles(usuario);

    await usuario.click(botonModificarDe("Mid"));

    const campoNombre = await screen.findByDisplayValue("Mid");
    await usuario.clear(campoNombre);

    // Con el nombre vacío el botón de guardar queda deshabilitado.
    expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeDisabled();
    expect(updateRole).not.toHaveBeenCalled();
  });

  it("no guarda si el nombre ya existe en el mismo videojuego", async () => {
    const usuario = userEvent.setup();
    await abrirPanelDeRoles(usuario);

    await usuario.click(botonModificarDe("Mid"));

    const campoNombre = await screen.findByDisplayValue("Mid");
    await usuario.clear(campoNombre);
    await usuario.type(campoNombre, "Support");

    await usuario.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(
      await screen.findByText(/ya existe un rol con ese nombre en este videojuego/i)
    ).toBeInTheDocument();
    expect(updateRole).not.toHaveBeenCalled();
  });

  it("muestra el error del backend y no cierra el formulario si el guardado falla", async () => {
    const usuario = userEvent.setup();
    updateRole.mockRejectedValue({
      response: { status: 409, data: { detail: "El rol ya existe." } },
    });

    await abrirPanelDeRoles(usuario);

    await usuario.click(botonModificarDe("Mid"));

    const campoNombre = await screen.findByDisplayValue("Mid");
    await usuario.clear(campoNombre);
    await usuario.type(campoNombre, "Middle");

    await usuario.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(await screen.findByText("El rol ya existe.")).toBeInTheDocument();
    expect(screen.getByText("Modificar rol")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Middle")).toBeInTheDocument();
  });

  it("cierra el panel al apretar Cerrar y vuelve a mostrar solo la lista de juegos", async () => {
    const usuario = userEvent.setup();
    await abrirPanelDeRoles(usuario);

    await usuario.click(screen.getByRole("button", { name: /cerrar/i }));

    await waitFor(() =>
      expect(screen.queryByText("Roles de League of Legends")).toBeNull()
    );
    expect(screen.getByText("Videojuegos soportados")).toBeInTheDocument();
  });
});
