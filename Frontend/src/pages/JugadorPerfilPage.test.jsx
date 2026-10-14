import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import JugadorPerfilPage from "./JugadorPerfilPage";
import { obtenerPerfilJugador } from "../api/jugadoresApi";

vi.mock("../api/jugadoresApi", () => ({
  obtenerPerfilJugador: vi.fn(),
}));

// Discord se prueba en components/discord/Discord.test.jsx.
vi.mock("../api/discordApi", () => ({
  getPlayerDiscord: vi.fn().mockResolvedValue({ linked: false }),
}));

// La cuenta de Riot se prueba en PanelRiotComponent.test.jsx.
vi.mock("../api/riotApi", () => ({
  getRiotAccount: vi.fn().mockResolvedValue({ supported: false, linked: false }),
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

  it("en el propio perfil ofrece editarlo en vez de enviar mensaje", async () => {
    chat.currentUserId = 7;
    renderPagina();

    expect(
      await screen.findByRole("link", { name: /editar mis perfiles/i })
    ).toHaveAttribute("href", "/app/perfil");
    expect(
      screen.queryByRole("button", { name: /enviar mensaje/i })
    ).toBeNull();
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
