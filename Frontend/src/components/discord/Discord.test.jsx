import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CuentaDiscordComponent from "./CuentaDiscordComponent";
import DiscordJugadorComponent from "./DiscordJugadorComponent";
import DiscordCallbackPage from "../../pages/DiscordCallbackPage";
import {
  getDiscordAuthorizeUrl,
  getMyDiscord,
  getPlayerDiscord,
  linkDiscord,
  unlinkDiscord,
  updateDiscordVisibility,
} from "../../api/discordApi";

vi.mock("../../api/discordApi", () => ({
  getMyDiscord: vi.fn(),
  getPlayerDiscord: vi.fn(),
  getDiscordAuthorizeUrl: vi.fn(),
  linkDiscord: vi.fn(),
  updateDiscordVisibility: vi.fn(),
  unlinkDiscord: vi.fn(),
}));

const CUENTA = {
  linked: true,
  discord_user_id: "555",
  username: "ana_gamer",
  display_name: "Ana",
  avatar_url: null,
  profile_url: "https://discord.com/users/555",
  visibility: "teammates",
};

const ubicacionOriginal = window.location;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: ubicacionOriginal,
  });
});

describe("CuentaDiscordComponent (Mi cuenta)", () => {
  it("conecta con Discord recordando la visibilidad elegida", async () => {
    const usuario = userEvent.setup();
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...ubicacionOriginal, assign },
    });
    getMyDiscord.mockResolvedValue({ linked: false });
    getDiscordAuthorizeUrl.mockResolvedValue(
      "https://discord.com/oauth2/authorize?state=abc"
    );
    render(<CuentaDiscordComponent />);

    await usuario.selectOptions(
      await screen.findByLabelText("Quién va a poder verlo"),
      "everyone"
    );
    await usuario.click(
      screen.getByRole("button", { name: "Conectar con Discord" })
    );

    expect(assign).toHaveBeenCalledWith(
      "https://discord.com/oauth2/authorize?state=abc"
    );
    expect(sessionStorage.getItem("ganker_discord_visibilidad")).toBe(
      "everyone"
    );
  });

  it("muestra la cuenta conectada, cambia la visibilidad y desconecta", async () => {
    const usuario = userEvent.setup();
    getMyDiscord.mockResolvedValue(CUENTA);
    updateDiscordVisibility.mockResolvedValue({
      ...CUENTA,
      visibility: "everyone",
    });
    unlinkDiscord.mockResolvedValue({
      message: "Tu cuenta de Discord se desvinculó de Ganker.",
    });
    render(<CuentaDiscordComponent />);

    expect(await screen.findByText("@ana_gamer")).toBeInTheDocument();

    await usuario.selectOptions(
      screen.getByLabelText("Quién puede ver tu Discord"),
      "everyone"
    );
    expect(updateDiscordVisibility).toHaveBeenCalledWith("everyone");
    expect(
      await screen.findByText(/Se actualizó quién puede ver tu Discord/)
    ).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Desconectar" }));
    expect(
      await screen.findByRole("button", { name: "Conectar con Discord" })
    ).toBeInTheDocument();
  });

  it("muestra el resultado que dejó el callback", async () => {
    sessionStorage.setItem(
      "ganker_discord_mensaje",
      JSON.stringify({ tipo: "error", texto: "La autorización se canceló." })
    );
    getMyDiscord.mockResolvedValue({ linked: false });
    render(<CuentaDiscordComponent />);

    expect(
      await screen.findByText("La autorización se canceló.")
    ).toBeInTheDocument();
    // Se muestra una sola vez
    expect(sessionStorage.getItem("ganker_discord_mensaje")).toBeNull();
  });
});

function renderCallback(query) {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[`/app/discord/callback${query}`]}>
        <Routes>
          <Route
            path="/app/discord/callback"
            element={<DiscordCallbackPage />}
          />
          <Route path="/app/cuenta" element={<p>Mi cuenta</p>} />
        </Routes>
      </MemoryRouter>
    </StrictMode>
  );
}

describe("DiscordCallbackPage", () => {
  it("canjea el código una sola vez y vuelve a Mi cuenta", async () => {
    sessionStorage.setItem("ganker_discord_visibilidad", "everyone");
    linkDiscord.mockResolvedValue(CUENTA);

    renderCallback("?code=abc&state=xyz");

    expect(await screen.findByText("Mi cuenta")).toBeInTheDocument();
    expect(linkDiscord).toHaveBeenCalledTimes(1);
    expect(linkDiscord).toHaveBeenCalledWith({
      code: "abc",
      state: "xyz",
      visibility: "everyone",
    });
    expect(
      JSON.parse(sessionStorage.getItem("ganker_discord_mensaje")).texto
    ).toMatch(/@ana_gamer quedó conectada/);
  });

  it("si el jugador cancela en Discord no intenta vincular", async () => {
    renderCallback("?error=access_denied");

    expect(await screen.findByText("Mi cuenta")).toBeInTheDocument();
    expect(linkDiscord).not.toHaveBeenCalled();
    expect(
      JSON.parse(sessionStorage.getItem("ganker_discord_mensaje")).tipo
    ).toBe("error");
  });

  it("guarda el error del backend", async () => {
    linkDiscord.mockRejectedValue({
      response: {
        data: {
          error:
            "La cuenta de Discord 'ana_gamer' ya está vinculada a otro jugador de Ganker.",
        },
      },
    });

    renderCallback("?code=abc&state=xyz");

    await screen.findByText("Mi cuenta");
    expect(
      JSON.parse(sessionStorage.getItem("ganker_discord_mensaje")).texto
    ).toMatch(/ya está vinculada/);
  });
});

describe("DiscordJugadorComponent (perfil de otro jugador)", () => {
  it("muestra el Discord con el link para abrirlo", async () => {
    getPlayerDiscord.mockResolvedValue({ ...CUENTA, visibility: null });
    render(<DiscordJugadorComponent userId={7} />);

    expect(await screen.findByText("@ana_gamer")).toBeInTheDocument();
    expect(getPlayerDiscord).toHaveBeenCalledWith(7);
    expect(
      screen.getByRole("link", { name: "Abrir en Discord" })
    ).toHaveAttribute("href", "https://discord.com/users/555");
  });

  it("no muestra nada si no lo comparte", async () => {
    getPlayerDiscord.mockResolvedValue({ linked: false });
    const { container } = render(<DiscordJugadorComponent userId={7} />);

    await waitFor(() => expect(getPlayerDiscord).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
