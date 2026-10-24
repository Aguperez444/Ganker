import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import JugadorPerfilPage from "./JugadorPerfilPage";
import { eliminarUsuario, obtenerPerfilJugador } from "../api/jugadoresApi";
import { banearJugador } from "../api/moderacionApi";

vi.mock("../api/jugadoresApi", () => ({
  obtenerPerfilJugador: vi.fn(),
  eliminarUsuario: vi.fn(),
}));

// US 36 - El admin puede banear desde el perfil. Se mockea para no pegarle
// a la red en los tests.
vi.mock("../api/moderacionApi", () => ({
  banearJugador: vi.fn(),
}));

// Access token falso con el id del usuario logueado en el claim "sub" (lo
// lee utils/jwt.js para frenar la autoeliminacion de la US 50).
function tokenDe(userId) {
  return `x.${btoa(JSON.stringify({ sub: String(userId) }))}.x`;
}

const auth = vi.hoisted(() => ({ user: null, tokens: null }));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => auth,
}));

// Discord se prueba en components/discord/Discord.test.jsx.
vi.mock("../api/discordApi", () => ({
  getPlayerDiscord: vi.fn().mockResolvedValue({ linked: false }),
}));

// La cuenta de Riot se prueba en PanelRiotComponent.test.jsx.
vi.mock("../api/riotApi", () => ({
  getRiotAccount: vi
    .fn()
    .mockResolvedValue({ supported: false, linked: false }),
}));

const chat = vi.hoisted(() => ({ currentUserId: 1, iniciarChat: null }));

vi.mock("../context/ChatContext", () => ({
  useChat: () => chat,
}));

const LOL = {
  game_profile_id: 10,
  player_id: 7,
  videogame: {
    id: 2,
    name: "League of Legends",
    icon_url: "/media/lol.png",
    rank_per_role: false,
    has_characters: true,
  },
  region: { region_id: 1, name: "LAS" },
  characters: [
    { character_id: 1, name: "Ahri", icon_url: "/media/ahri.png" },
    { character_id: 2, name: "Jinx", icon_url: "/media/jinx.png" },
  ],
  role_profiles: [
    {
      role_profile_id: 1,
      role: { role_id: 1, name: "Mid", icon_url: "" },
      rank: { rank_id: 5, name: "Oro", icon_url: "", value: 5 },
    },
    {
      role_profile_id: 2,
      role: { role_id: 2, name: "ADC", icon_url: "" },
      rank: { rank_id: 5, name: "Oro", icon_url: "", value: 5 },
    },
  ],
};

const OVERWATCH = {
  game_profile_id: 11,
  player_id: 7,
  videogame: {
    id: 3,
    name: "Overwatch",
    icon_url: "/media/ow.png",
    rank_per_role: true,
    has_characters: true,
  },
  region: null,
  characters: [{ character_id: 9, name: "Kiriko", icon_url: "" }],
  role_profiles: [
    {
      role_profile_id: 3,
      role: { role_id: 3, name: "Support", icon_url: "" },
      rank: { rank_id: 8, name: "Platino", icon_url: "", value: 8 },
    },
  ],
};

const ANA = {
  user_id: 7,
  username: "ana",
  name: "Ana",
  icon_url: "",
  last_connection: null,
  profiles: [LOL, OVERWATCH],
};

function renderPagina(ruta = "/app/jugadores/7") {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route
          path="/app/jugadores/:jugadorId"
          element={<JugadorPerfilPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  chat.currentUserId = 1;
  chat.iniciarChat = vi.fn().mockResolvedValue(undefined);
  auth.user = { role: "player" };
  auth.tokens = { access_token: tokenDe(1) };
  obtenerPerfilJugador.mockResolvedValue(ANA);
});

describe("JugadorPerfilPage - perfil de otro jugador", () => {
  it("muestra sus datos y todos sus perfiles de juego, con el primero abierto", async () => {
    renderPagina();

    expect(
      await screen.findByRole("heading", { name: "Ana" })
    ).toBeInTheDocument();
    expect(obtenerPerfilJugador).toHaveBeenCalledWith("7");
    expect(screen.getByText("@ana")).toBeInTheDocument();

    const pestanias = screen.getAllByRole("tab");
    expect(pestanias.map((p) => p.textContent)).toEqual([
      "League of Legends",
      "Overwatch",
    ]);
    expect(pestanias[0]).toHaveAttribute("aria-selected", "true");

    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByText("LAS")).toBeInTheDocument();
    expect(within(panel).getByText("Ahri")).toBeInTheDocument();
    expect(within(panel).getByText("Main")).toBeInTheDocument();
    // Sin rango por rol, el rango compartido se muestra una sola vez.
    expect(within(panel).getAllByText("Oro")).toHaveLength(1);
  });

  it("cambia de perfil de juego al elegir otra pestaña", async () => {
    const usuario = userEvent.setup();
    renderPagina();

    await usuario.click(await screen.findByRole("tab", { name: "Overwatch" }));

    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByText("Kiriko")).toBeInTheDocument();
    expect(within(panel).getByText("Platino")).toBeInTheDocument();
    expect(within(panel).getByText("Sin región")).toBeInTheDocument();
    expect(within(panel).queryByText("Ahri")).toBeNull();
  });

  it("preselecciona el videojuego que llega por la URL", async () => {
    renderPagina("/app/jugadores/7?juego=3");

    expect(
      await screen.findByRole("tab", { name: "Overwatch" })
    ).toHaveAttribute("aria-selected", "true");
  });

  it("permite enviarle un mensaje", async () => {
    const usuario = userEvent.setup();
    renderPagina();

    await usuario.click(
      await screen.findByRole("button", { name: /enviar mensaje/i })
    );

    expect(chat.iniciarChat).toHaveBeenCalledWith(7);
  });

  it("permite reportar al jugador desde su perfil", async () => {
    renderPagina();

    expect(
      await screen.findByRole("button", { name: /reportar a ana/i })
    ).toBeInTheDocument();
  });

  it("en el propio perfil ofrece editarlo en vez de enviar mensaje", async () => {
    chat.currentUserId = 7;
    renderPagina();

    expect(
      await screen.findByRole("link", { name: /editar mis perfiles/i })
    ).toHaveAttribute("href", "/app/perfil");
    expect(
      screen.queryByRole("button", { name: /enviar mensaje/i })
    ).toBeNull();
    expect(screen.queryByRole("button", { name: /reportar/i })).toBeNull();
  });

  it("avisa si el jugador no tiene perfiles de juego", async () => {
    obtenerPerfilJugador.mockResolvedValue({ ...ANA, profiles: [] });
    renderPagina();

    expect(
      await screen.findByText(
        "Este jugador todavía no tiene perfiles de juego."
      )
    ).toBeInTheDocument();
  });

  it("avisa si el jugador no existe", async () => {
    obtenerPerfilJugador.mockRejectedValue({ response: { status: 404 } });
    renderPagina("/app/jugadores/999");

    expect(
      await screen.findByText("Este jugador no existe.")
    ).toBeInTheDocument();
  });
});

describe("JugadorPerfilPage - US 50 Eliminar cuenta de usuario", () => {
  it("un jugador común no ve la opción de dar de baja", async () => {
    renderPagina();

    await screen.findByRole("heading", { name: "Ana" });
    expect(
      screen.queryByRole("button", { name: "Dar de baja cuenta" })
    ).toBeNull();
  });

  it("el admin confirma, da de baja la cuenta y ve el aviso", async () => {
    const usuario = userEvent.setup();
    auth.user = { role: "admin" };
    eliminarUsuario.mockResolvedValue({
      message: "El usuario ha sido eliminado exitosamente.",
    });
    renderPagina();

    await usuario.click(
      await screen.findByRole("button", { name: "Dar de baja cuenta" })
    );
    const modal = screen.getByRole("dialog");
    expect(modal).toHaveTextContent(/@ana/);
    expect(modal).toHaveTextContent(/no va a poder volver a iniciar sesión/);

    await usuario.click(
      within(modal).getByRole("button", { name: "Dar de baja" })
    );

    expect(eliminarUsuario).toHaveBeenCalledWith(7);
    expect(
      await screen.findByText(/La cuenta de @ana fue dada de baja/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("cancelar no da de baja la cuenta", async () => {
    const usuario = userEvent.setup();
    auth.user = { role: "admin" };
    renderPagina();

    await usuario.click(
      await screen.findByRole("button", { name: "Dar de baja cuenta" })
    );
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(eliminarUsuario).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Ana" })).toBeInTheDocument();
  });

  it("muestra el motivo si el backend lo rechaza (ej. admin contra owner)", async () => {
    const usuario = userEvent.setup();
    auth.user = { role: "admin" };
    eliminarUsuario.mockRejectedValue({
      response: {
        status: 403,
        data: {
          error:
            "Un administrador no tiene permisos para eliminar a un propietario.",
        },
      },
    });
    renderPagina();

    await usuario.click(
      await screen.findByRole("button", { name: "Dar de baja cuenta" })
    );
    await usuario.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Dar de baja",
      })
    );

    expect(
      await screen.findByText(
        "Un administrador no tiene permisos para eliminar a un propietario."
      )
    ).toBeInTheDocument();
  });

  it("el admin no ve la opción en su propio perfil", async () => {
    auth.user = { role: "admin" };
    auth.tokens = { access_token: tokenDe(7) };
    chat.currentUserId = 7;
    renderPagina();

    await screen.findByRole("heading", { name: "Ana" });
    expect(
      screen.queryByRole("button", { name: "Dar de baja cuenta" })
    ).toBeNull();
  });
});

describe("JugadorPerfilPage - US 36 Banear jugador", () => {
  it("un jugador común no ve la opción de banear", async () => {
    renderPagina();

    await screen.findByRole("heading", { name: "Ana" });
    expect(screen.queryByRole("button", { name: "Banear jugador" })).toBeNull();
  });

  it("el admin ve el botón de banear en el panel de administración", async () => {
    auth.user = { role: "admin" };
    renderPagina();

    expect(
      await screen.findByRole("button", { name: "Banear jugador" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Dar de baja cuenta" })
    ).toBeInTheDocument();
  });

  it("al banear desde el perfil, la página muestra el aviso", async () => {
    banearJugador.mockResolvedValue({});
    auth.user = { role: "admin" };
    const user = userEvent.setup();
    renderPagina();

    await user.click(
      await screen.findByRole("button", { name: "Banear jugador" })
    );
    await user.type(
      screen.getByLabelText(/Motivo o justificación/),
      "Insultos reiterados"
    );
    await user.click(screen.getByRole("button", { name: "Revisar sanción" }));
    await user.click(screen.getByRole("button", { name: "Confirmar baneo" }));
    await user.click(await screen.findByRole("button", { name: "Cerrar" }));

    expect(banearJugador).toHaveBeenCalledWith({
      jugadorId: 7,
      motivo: "Insultos reiterados",
      duracionDias: 1,
    });
    expect(
      await screen.findByRole("heading", { name: "Jugador baneado" })
    ).toBeInTheDocument();
  });
});
