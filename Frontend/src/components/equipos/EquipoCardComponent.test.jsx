import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import EquipoCardComponent from "./EquipoCardComponent";

describe("EquipoCardComponent - US 01, US 02, US 03", () => {
  const teamMock = {
    team_id: 1,
    team_name: "Los Tryhards",
    description: "Buscamos mid con ganas de subir a Diamante",
    videogame_name: "League of Legends",
    region_name: "LAS",
    allow_other_regions: false,
    min_rank_name: "Plata",
    max_rank_name: "Oro",
    min_rank_value: 300,
    max_rank_value: 400,
    player_count: 2,
    max_players: 4,
    members: [
      {
        user_id: 101,
        username: "FakerFan",
        name: "Lee",
        icon_url: "/media/icons/1.png",
        active_game_profile: {
          region_name: "LAS",
          active_role_profile: {
            role_id: 1,
            role_name: "Top",
            rank_name: "Oro",
            rank_icon_url: "/media/ranks/oro.png",
          },
        },
      },
      {
        user_id: 102,
        username: "DopaFan",
        name: "Kim",
        icon_url: "/media/icons/2.png",
        active_game_profile: {
          region_name: "LAS",
          active_role_profile: {
            role_id: 2,
            role_name: "Jungla",
            rank_name: "Plata",
            rank_icon_url: "/media/ranks/plata.png",
          },
        },
      },
      {
        user_id: null,
        username: "Libre",
        name: "Libre",
        icon_url: "/media/roles/mid.png",
        active_game_profile: {
          region_name: "LAS",
          active_role_profile: {
            role_id: 3,
            role_name: "Mid",
            rank_name: "",
            rank_icon_url: "",
          },
        },
      },
      {
        user_id: null,
        username: "Libre",
        name: "Libre",
        icon_url: "/media/roles/adc.png",
        active_game_profile: {
          region_name: "LAS",
          active_role_profile: {
            role_id: 4,
            role_name: "ADC",
            rank_name: "",
            rank_icon_url: "",
          },
        },
      },
    ],
  };

  const userMock = {
    user_id: 200,
    username: "challenger_mid",
    name: "Challenger",
    profiles: [
      {
        game_profile_id: 1,
        videogame: { id: 1, name: "League of Legends" },
        region: { region_id: 1, name: "LAS" },
        role_profiles: [
          {
            role: { role_id: 3, name: "Mid" },
            rank: { rank_id: 1, name: "Oro", value: 350 },
          },
        ],
      },
    ],
  };

  it("exhibe nombre, descripción, rango representativo, integrantes actuales, vacantes y contador 2/4", () => {
    render(
      <EquipoCardComponent team={teamMock} user={userMock} onUnirse={vi.fn()} />
    );

    // Nombre y descripción
    expect(screen.getByText("Los Tryhards")).toBeInTheDocument();
    expect(
      screen.getByText(/Buscamos mid con ganas de subir a Diamante/i)
    ).toBeInTheDocument();

    // Contador 2/4
    expect(screen.getByText("2/4")).toBeInTheDocument();

    // Rango representativo (Plata - Oro)
    expect(screen.getByText("Plata - Oro")).toBeInTheDocument();

    // Integrantes actuales
    expect(screen.getByText("Lee")).toBeInTheDocument();
    expect(screen.getByText("Rol: Top")).toBeInTheDocument();
    expect(screen.getByText("Kim")).toBeInTheDocument();
    expect(screen.getByText("Rol: Jungla")).toBeInTheDocument();

    // Vacantes
    expect(screen.getAllByText(/Cupo vacante/i)).toHaveLength(2);
    expect(screen.getByText("Mid")).toBeInTheDocument();
    expect(screen.getByText("ADC")).toBeInTheDocument();
  });

  it("permite hacer click en 'Unirse al equipo' cuando hay vacantes", async () => {
    const handleUnirse = vi.fn();
    const userEventSetup = userEvent.setup();

    render(
      <EquipoCardComponent
        team={teamMock}
        user={userMock}
        onUnirse={handleUnirse}
      />
    );

    const botonUnirse = screen.getByRole("button", {
      name: /unirse al equipo/i,
    });
    expect(botonUnirse).toBeEnabled();

    await userEventSetup.click(botonUnirse);
    expect(handleUnirse).toHaveBeenCalledWith(teamMock);
  });

  it("muestra botón deshabilitado 'Equipo completo' si el equipo ya no tiene vacantes", () => {
    const fullTeam = {
      ...teamMock,
      player_count: 4,
      max_players: 4,
      members: teamMock.members.map((m, i) => ({
        ...m,
        user_id: 100 + i,
        name: `Jugador ${i}`,
      })),
    };

    render(
      <EquipoCardComponent team={fullTeam} user={userMock} onUnirse={vi.fn()} />
    );

    const boton = screen.getByRole("button", { name: /equipo completo/i });
    expect(boton).toBeDisabled();
  });

  it("muestra estado de integrante y botón para abrir el chat si el usuario actual ya pertenece a la sala", async () => {
    const userMiembro = {
      user_id: 101,
      username: "FakerFan",
      name: "Lee",
    };
    const handleChat = vi.fn();
    const userEventSetup = userEvent.setup();

    render(
      <EquipoCardComponent
        team={teamMock}
        user={userMiembro}
        onAbrirChat={handleChat}
      />
    );

    expect(
      screen.getByText(/Eres integrante de este equipo/i)
    ).toBeInTheDocument();

    const botonChat = screen.getByRole("button", { name: /chat/i });
    await userEventSetup.click(botonChat);
    expect(handleChat).toHaveBeenCalledWith(teamMock);
  });
});
