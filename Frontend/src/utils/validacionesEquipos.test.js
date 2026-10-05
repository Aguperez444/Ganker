import { describe, it, expect } from "vitest";
import {
  validarFormularioCrearEquipo,
  validarUnirseEquipo,
} from "./validacionesEquipos";

describe("Validaciones de Equipos - US 01 (Crear equipo) y US 02 (Unirse a equipo)", () => {
  const ranksMock = [
    { rank_id: 1, name: "Hierro", value: 100 },
    { rank_id: 2, name: "Bronce", value: 200 },
    { rank_id: 3, name: "Plata", value: 300 },
    { rank_id: 4, name: "Oro", value: 400 },
    { rank_id: 5, name: "Platino", value: 500 },
    { rank_id: 6, name: "Diamante", value: 600 },
  ];

  const userMock = {
    user_id: 10,
    username: "pro_player",
    name: "Pro Player",
    profiles: [
      {
        game_profile_id: 101,
        videogame: { id: 1, name: "League of Legends" },
        region: { region_id: 1, name: "LAS" },
        role_profiles: [
          {
            role_profile_id: 1,
            role: { role_id: 1, name: "Mid" },
            rank: { rank_id: 4, name: "Oro", value: 400 },
          },
          {
            role_profile_id: 2,
            role: { role_id: 2, name: "Top" },
            rank: { rank_id: 1, name: "Hierro", value: 100 },
          },
          {
            role_profile_id: 3,
            role: { role_id: 3, name: "ADC" },
            rank: { rank_id: 6, name: "Diamante", value: 600 },
          },
        ],
      },
    ],
  };

  describe("US 01 - Registrar equipo", () => {
    it("Prueba: Registrar un equipo con todos los campos obligatorios válidos y rangos coherentes (pasa)", () => {
      const res = validarFormularioCrearEquipo({
        name: "Team Tryhard",
        videogame_id: 1,
        region_id: 1,
        allow_other_regions: false,
        min_rank_id: 3, // Plata (300)
        max_rank_id: 5, // Platino (500)
        creator_game_role_id: 1, // Mid (Oro 400) -> dentro del rango 300-500
        vacant_game_role_ids: [2, 3],
        ranks: ranksMock,
        user: userMock,
        estaEnEquipoActivo: false,
      });

      expect(res.esValido).toBe(true);
      expect(Object.keys(res.errores)).toHaveLength(0);
    });

    it("Prueba: Registrar un equipo dejando campos obligatorios vacíos (falla)", () => {
      const res = validarFormularioCrearEquipo({
        name: "",
        videogame_id: "",
        region_id: "",
        allow_other_regions: false,
        min_rank_id: "",
        max_rank_id: "",
        creator_game_role_id: "",
        vacant_game_role_ids: [],
        ranks: ranksMock,
        user: userMock,
      });

      expect(res.esValido).toBe(false);
      expect(res.errores.name).toBeDefined();
      expect(res.errores.videogame_id).toBeDefined();
      expect(res.errores.region_id).toBeDefined();
      expect(res.errores.min_rank_id).toBeDefined();
      expect(res.errores.max_rank_id).toBeDefined();
      expect(res.errores.creator_game_role_id).toBeDefined();
      expect(res.errores.vacant_slots).toBeDefined();
    });

    it("Prueba: Registrar un equipo definiendo un rango mínimo superior al rango máximo (falla)", () => {
      const res = validarFormularioCrearEquipo({
        name: "Team Incoherente",
        videogame_id: 1,
        region_id: 1,
        allow_other_regions: false,
        min_rank_id: 5, // Platino (500)
        max_rank_id: 3, // Plata (300)
        creator_game_role_id: 1,
        vacant_game_role_ids: [2],
        ranks: ranksMock,
        user: userMock,
      });

      expect(res.esValido).toBe(false);
      expect(res.errores.min_rank_id).toContain(
        "El rango mínimo no puede ser superior al rango máximo"
      );
    });

    it("Prueba: Registrar un equipo con requisitos de rango donde el propio rango del jugador queda excluido (falla)", () => {
      // El jugador en Top tiene Hierro (100)
      const res = validarFormularioCrearEquipo({
        name: "Team Rango Excluido",
        videogame_id: 1,
        region_id: 1,
        allow_other_regions: false,
        min_rank_id: 4, // Oro (400)
        max_rank_id: 6, // Diamante (600)
        creator_game_role_id: 2, // Top (Hierro 100) -> excluido porque 100 < 400
        vacant_game_role_ids: [1],
        ranks: ranksMock,
        user: userMock,
      });

      expect(res.esValido).toBe(false);
      expect(res.errores.creator_game_role_id).toContain("queda excluido");
    });

    it("Prueba: Registrar un equipo estando ya unido a otro equipo activo (falla)", () => {
      const res = validarFormularioCrearEquipo({
        name: "Team Otro",
        videogame_id: 1,
        region_id: 1,
        allow_other_regions: false,
        min_rank_id: 3,
        max_rank_id: 5,
        creator_game_role_id: 1,
        vacant_game_role_ids: [2],
        ranks: ranksMock,
        user: userMock,
        estaEnEquipoActivo: true,
      });

      expect(res.esValido).toBe(false);
      expect(res.errores.general).toContain(
        "ya eres miembro o líder de otro equipo activo"
      );
    });
  });

  describe("US 02 - Incorporarse a un equipo", () => {
    const baseTeam = {
      team_id: 1,
      team_name: "Los Invencibles",
      videogame_id: 1,
      videogame_name: "League of Legends",
      region_id: 1,
      region_name: "LAS",
      min_rank_value: 300, // Plata
      min_rank_name: "Plata",
      max_rank_value: 500, // Platino
      max_rank_name: "Platino",
      allow_other_regions: false,
      player_count: 2,
      max_players: 3,
      members: [
        { user_id: 99, username: "Leader", active_game_profile: {} },
        { user_id: 98, username: "Player2", active_game_profile: {} },
        {
          user_id: null,
          username: "Libre",
          active_game_profile: {
            active_role_profile: { role_id: 1, role_name: "Mid" },
          },
        },
      ],
    };

    it("Prueba: Unirse a un equipo con cupos disponibles cumpliendo con los requisitos de rango y región (pasa)", () => {
      // userMock tiene Mid en Oro (400), región LAS (1), equipo pide 300-500 en LAS
      const res = validarUnirseEquipo({
        team: baseTeam,
        user: userMock,
        targetRoleId: 1, // Mid
        ranks: ranksMock,
        estaEnEquipoActivo: false,
      });

      expect(res.esValido).toBe(true);
      expect(res.error).toBeNull();
    });

    it("Prueba: Unirse a un equipo que ya alcanzó el límite máximo de jugadores y no posee vacantes (falla)", () => {
      const fullTeam = {
        ...baseTeam,
        player_count: 3,
        max_players: 3,
        members: [
          { user_id: 1, username: "A" },
          { user_id: 2, username: "B" },
          { user_id: 3, username: "C" },
        ],
      };

      const res = validarUnirseEquipo({
        team: fullTeam,
        user: userMock,
        targetRoleId: 1,
        ranks: ranksMock,
      });

      expect(res.esValido).toBe(false);
      expect(res.error).toContain("límite máximo de jugadores");
    });

    it("Prueba: Unirse a un equipo con un rango inferior al rango mínimo configurado (falla)", () => {
      // En Top, el usuario es Hierro (100) y el equipo exige 300-500
      const res = validarUnirseEquipo({
        team: baseTeam,
        user: userMock,
        targetRoleId: 2, // Top
        ranks: ranksMock,
      });

      expect(res.esValido).toBe(false);
      expect(res.error).toContain("es inferior al rango mínimo requerido");
    });

    it("Prueba: Unirse a un equipo con un rango superior al rango máximo configurado (falla)", () => {
      // En ADC, el usuario es Diamante (600) y el equipo exige 300-500
      const res = validarUnirseEquipo({
        team: baseTeam,
        user: userMock,
        targetRoleId: 3, // ADC
        ranks: ranksMock,
      });

      expect(res.esValido).toBe(false);
      expect(res.error).toContain("es superior al rango máximo permitido");
    });

    it("Prueba: Unirse a un equipo con restricción de región perteneciendo a una región distinta (falla)", () => {
      const teamBR = {
        ...baseTeam,
        region_id: 2,
        region_name: "BR",
        allow_other_regions: false,
      };

      const res = validarUnirseEquipo({
        team: teamBR,
        user: userMock, // tiene región LAS (1)
        targetRoleId: 1,
        ranks: ranksMock,
      });

      expect(res.esValido).toBe(false);
      expect(res.error).toContain("restricción de región");
    });

    it("Prueba: Unirse a un equipo que permite jugadores de otras regiones perteneciendo a una región distinta (pasa)", () => {
      const teamGlobal = {
        ...baseTeam,
        region_id: 2,
        region_name: "BR",
        allow_other_regions: true,
      };

      const res = validarUnirseEquipo({
        team: teamGlobal,
        user: userMock, // tiene región LAS (1) pero el equipo permite otras
        targetRoleId: 1,
        ranks: ranksMock,
      });

      expect(res.esValido).toBe(true);
      expect(res.error).toBeNull();
    });

    it("Prueba: Unirse a un equipo estando ya integrado en otro equipo activo (falla)", () => {
      const res = validarUnirseEquipo({
        team: baseTeam,
        user: userMock,
        targetRoleId: 1,
        ranks: ranksMock,
        estaEnEquipoActivo: true,
      });

      expect(res.esValido).toBe(false);
      expect(res.error).toContain("ya integrado en otro equipo activo");
    });
  });
});
