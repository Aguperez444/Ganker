import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PanelRiotComponent from "./PanelRiotComponent";
import {
  getRiotAccount,
  linkRiotAccount,
  refreshRiotStats,
  unlinkRiotAccount,
} from "../../api/riotApi";

vi.mock("../../api/riotApi", () => ({
  getRiotAccount: vi.fn(),
  linkRiotAccount: vi.fn(),
  refreshRiotStats: vi.fn(),
  unlinkRiotAccount: vi.fn(),
}));

const STATS = {
  summoner_level: 245,
  profile_icon_url: "https://ddragon/profileicon/588.png",
  ranked: [
    {
      queue: "Solo/Dúo",
      tier: "Oro",
      division: "II",
      league_points: 45,
      wins: 60,
      losses: 55,
      winrate: 52.2,
    },
  ],
  top_masteries: [
    { champion_name: "Ahri", icon_url: null, level: 12, points: 150000 },
  ],
  recent: {
    games: 2,
    wins: 1,
    losses: 1,
    winrate: 50,
    avg_kills: 9.5,
    avg_deaths: 5.5,
    avg_assists: 14.5,
    kda: 4.36,
    main_role: "Jungla",
    most_played: [
      {
        champion_name: "Wukong",
        icon_url: null,
        games: 1,
        wins: 1,
        winrate: 100,
        kda: 5.33,
      },
    ],
  },
  matches: [
    {
      match_id: "LA2_1",
      champion_name: "Wukong",
      champion_icon_url: null,
      kills: 7,
      deaths: 3,
      assists: 9,
      win: true,
      role: "Jungla",
      cs: 162,
      duration_seconds: 1805,
      queue: "Solo/Dúo",
      played_at: "2026-10-13T22:00:00",
    },
  ],
};

const VINCULADA = {
  supported: true,
  linked: true,
  requires_server: true,
  provides_stats: true,
  riot_id: "Ana#LAS",
  server: "la2",
  last_synced_at: "2026-10-14T12:00:00",
  next_refresh_at: "2000-01-01T00:00:00",
  rank_sync: null,
  stats: STATS,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PanelRiotComponent", () => {
  it("no muestra nada en juegos que no admiten cuenta de Riot", async () => {
    getRiotAccount.mockResolvedValue({ supported: false, linked: false });
    const { container } = render(
      <PanelRiotComponent gameProfileId={3} esPropio />
    );

    await waitFor(() => expect(getRiotAccount).toHaveBeenCalledWith(3));
    expect(container).toBeEmptyDOMElement();
  });

  it("a otro jugador sin cuenta vinculada no le muestra el formulario", async () => {
    getRiotAccount.mockResolvedValue({
      supported: true,
      linked: false,
      requires_server: true,
      provides_stats: true,
    });
    const { container } = render(<PanelRiotComponent gameProfileId={3} />);

    await waitFor(() => expect(getRiotAccount).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("vincula la cuenta, avisa el cambio de rango y muestra las estadísticas", async () => {
    const usuario = userEvent.setup();
    const onRangoActualizado = vi.fn();
    getRiotAccount.mockResolvedValue({
      supported: true,
      linked: false,
      requires_server: true,
      provides_stats: true,
    });
    linkRiotAccount.mockResolvedValue({
      ...VINCULADA,
      rank_sync: {
        status: "updated",
        rank_name: "Oro",
        message:
          "El rango de tu perfil se actualizó a Oro, según tu cuenta de Riot.",
      },
    });
    render(
      <PanelRiotComponent
        gameProfileId={10}
        esPropio
        onRangoActualizado={onRangoActualizado}
      />
    );

    const boton = await screen.findByRole("button", {
      name: "Vincular cuenta",
    });
    await usuario.type(screen.getByLabelText("Riot ID"), "Ana");
    expect(boton).toBeDisabled();
    expect(screen.getByText(/tiene la forma Nombre#TAG/)).toBeInTheDocument();

    await usuario.type(screen.getByLabelText("Riot ID"), "#LAS");
    await usuario.selectOptions(screen.getByLabelText("Servidor"), "la1");
    await usuario.click(boton);

    expect(linkRiotAccount).toHaveBeenCalledWith(10, {
      riotId: "Ana#LAS",
      server: "la1",
    });
    expect(
      await screen.findByText(/El rango de tu perfil se actualizó a Oro/)
    ).toBeInTheDocument();
    expect(onRangoActualizado).toHaveBeenCalled();

    // Estadisticas
    expect(screen.getByText("245")).toBeInTheDocument();
    expect(screen.getByText(/Oro II/)).toBeInTheDocument();
    expect(screen.getByText("4.36")).toBeInTheDocument();
    expect(screen.getAllByText("Jungla").length).toBeGreaterThan(0);
    expect(screen.getByText("7/3/9")).toBeInTheDocument();
    expect(screen.getByText(/30:05/)).toBeInTheDocument();
  });

  it("muestra el error que manda el backend al vincular", async () => {
    const usuario = userEvent.setup();
    getRiotAccount.mockResolvedValue({
      supported: true,
      linked: false,
      requires_server: true,
      provides_stats: true,
    });
    linkRiotAccount.mockRejectedValue({
      response: {
        data: {
          error:
            "No se encontró la cuenta de Riot 'Ana#LAS' en el servidor LAS.",
        },
      },
    });
    render(<PanelRiotComponent gameProfileId={10} esPropio />);

    await usuario.type(await screen.findByLabelText("Riot ID"), "Ana#LAS");
    await usuario.click(
      screen.getByRole("button", { name: "Vincular cuenta" })
    );

    expect(
      await screen.findByText(/No se encontró la cuenta de Riot/)
    ).toBeInTheDocument();
  });

  it("los demás jugadores ven las estadísticas sin botones de acción", async () => {
    getRiotAccount.mockResolvedValue(VINCULADA);
    render(<PanelRiotComponent gameProfileId={10} />);

    expect(await screen.findByText("Ana#LAS")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Actualizar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Desvincular" })).toBeNull();
  });

  it("el dueño puede actualizar y desvincular", async () => {
    const usuario = userEvent.setup();
    getRiotAccount.mockResolvedValue(VINCULADA);
    refreshRiotStats.mockResolvedValue({
      ...VINCULADA,
      rank_sync: {
        status: "unchanged",
        rank_name: "Oro",
        message: "Tu rango ya coincidía con el de tu cuenta de Riot (Oro).",
      },
    });
    unlinkRiotAccount.mockResolvedValue({
      message: "La cuenta de Riot se desvinculó del perfil.",
    });
    render(<PanelRiotComponent gameProfileId={10} esPropio />);

    await usuario.click(
      await screen.findByRole("button", { name: "Actualizar" })
    );
    expect(refreshRiotStats).toHaveBeenCalledWith(10);
    expect(
      await screen.findByText(/Tu rango ya coincidía/)
    ).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Desvincular" }));
    expect(unlinkRiotAccount).toHaveBeenCalledWith(10);
    expect(
      await screen.findByRole("button", { name: "Vincular cuenta" })
    ).toBeInTheDocument();
  });

  it.each([-1, 1])(
    "respeta el cooldown UTC sin zona (%i minutos)",
    async (minutos) => {
      getRiotAccount.mockResolvedValue({
        ...VINCULADA,
        next_refresh_at: new Date(Date.now() + minutos * 60_000)
          .toISOString()
          .replace("Z", ""),
      });
      render(<PanelRiotComponent gameProfileId={10} esPropio />);

      const boton = await screen.findByRole("button", { name: "Actualizar" });
      if (minutos < 0) expect(boton).toBeEnabled();
      else expect(boton).toBeDisabled();
    }
  );

  it("no deja actualizar antes de que termine la espera", async () => {
    getRiotAccount.mockResolvedValue({
      ...VINCULADA,
      next_refresh_at: "2999-01-01T00:00:00",
    });
    render(<PanelRiotComponent gameProfileId={10} esPropio />);

    expect(
      await screen.findByRole("button", { name: "Actualizar" })
    ).toBeDisabled();
  });

  it("en Valorant vincula sin pedir servidor y explica que no hay estadísticas", async () => {
    const usuario = userEvent.setup();
    getRiotAccount.mockResolvedValue({
      supported: true,
      linked: false,
      requires_server: false,
      provides_stats: false,
    });
    linkRiotAccount.mockResolvedValue({
      supported: true,
      linked: true,
      requires_server: false,
      provides_stats: false,
      riot_id: "Ana#LAS",
      server: "latam",
      last_synced_at: null,
      next_refresh_at: null,
      rank_sync: null,
      stats: null,
    });
    render(<PanelRiotComponent gameProfileId={20} esPropio />);

    await usuario.type(await screen.findByLabelText("Riot ID"), "Ana#LAS");
    expect(screen.queryByLabelText("Servidor")).toBeNull();
    await usuario.click(
      screen.getByRole("button", { name: "Vincular cuenta" })
    );

    expect(linkRiotAccount).toHaveBeenCalledWith(20, {
      riotId: "Ana#LAS",
      server: undefined,
    });
    expect(
      await screen.findByText("✓ Cuenta de Riot vinculada.")
    ).toBeInTheDocument();
    expect(screen.getByText(/LATAM/)).toBeInTheDocument();
    expect(
      screen.getByText(/no permite consultar el historial/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Actualizar" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Desvincular" })
    ).toBeInTheDocument();
  });

  it("al desvincular LoL vuelve a pedir el servidor", async () => {
    const usuario = userEvent.setup();
    getRiotAccount.mockResolvedValue(VINCULADA);
    unlinkRiotAccount.mockResolvedValue({
      message: "La cuenta de Riot se desvinculó del perfil.",
    });
    render(<PanelRiotComponent gameProfileId={10} esPropio />);

    await usuario.click(
      await screen.findByRole("button", { name: "Desvincular" })
    );

    expect(await screen.findByLabelText("Servidor")).toBeInTheDocument();
  });
});
