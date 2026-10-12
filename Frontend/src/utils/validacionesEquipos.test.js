import { describe, it, expect } from "vitest";

import {
  CUPOS_VACANTES_MAXIMO,
  mensajeDeRechazoAlUnirse,
  motivoVacanteNoDisponible,
  perfilDelJuego,
  validarEdicionEquipo,
  validarFormularioEquipo,
} from "./validacionesEquipos";

const HIERRO = { rank_id: 1, name: "Hierro", value: 1 };
const ORO = { rank_id: 3, name: "Oro", value: 3 };
const DIAMANTE = { rank_id: 5, name: "Diamante", value: 5 };

const formularioValido = {
  nombre: "Los Gankers",
  descripcion: "Buscamos jungla y support para rankeds",
  videojuegoId: "1",
  regionId: "2",
  regionJugador: { region_id: 2, name: "LAS" },
  admiteOtrasRegiones: false,
  rangoMinimo: HIERRO,
  rangoMaximo: DIAMANTE,
  rangoJugador: ORO,
  rolCreadorId: "10",
  rolesVacantesIds: ["11", "12"],
};

describe("US 14 - validarFormularioEquipo", () => {
  it("no devuelve errores con todos los campos obligatorios válidos y rangos coherentes", () => {
    expect(validarFormularioEquipo(formularioValido)).toEqual({});
  });

  it("exige nombre, videojuego y ambos rangos", () => {
    const errores = validarFormularioEquipo({
      ...formularioValido,
      nombre: "   ",
      videojuegoId: "",
      rangoMinimo: null,
      rangoMaximo: null,
    });

    expect(errores.nombre).toBe("Ingresá el nombre del equipo.");
    expect(errores.videojuego).toBe("Elegí el videojuego del equipo.");
    expect(errores.rangoMinimo).toBe("Elegí el rango mínimo.");
    expect(errores.rangoMaximo).toBe("Elegí el rango máximo.");
  });

  it("rechaza un rango mínimo superior al rango máximo", () => {
    const errores = validarFormularioEquipo({
      ...formularioValido,
      rangoMinimo: DIAMANTE,
      rangoMaximo: HIERRO,
    });

    expect(errores.rangoMaximo).toBe(
      "El rango mínimo no puede ser superior al rango máximo."
    );
  });

  it("acepta el mismo rango como mínimo y máximo", () => {
    const errores = validarFormularioEquipo({
      ...formularioValido,
      rangoMinimo: ORO,
      rangoMaximo: ORO,
    });

    expect(errores).toEqual({});
  });

  it("rechaza un rango permitido que deja afuera al rango del creador", () => {
    const errores = validarFormularioEquipo({
      ...formularioValido,
      rangoMinimo: DIAMANTE,
      rangoMaximo: DIAMANTE,
      rangoJugador: ORO,
    });

    expect(errores.rolCreador).toMatch(/tu rango \(oro\)/i);
  });

  it("exige el rol con el que juega el creador", () => {
    const errores = validarFormularioEquipo({
      ...formularioValido,
      rolCreadorId: "",
      rangoJugador: null,
    });

    expect(errores.rolCreador).toBe("Elegí el rol con el que vas a jugar.");
  });

  it("exige una región salvo que se admitan jugadores de otras regiones", () => {
    expect(
      validarFormularioEquipo({ ...formularioValido, regionId: "" }).region
    ).toBe("Elegí una región o permití jugadores de otras regiones.");

    expect(
      validarFormularioEquipo({
        ...formularioValido,
        regionId: "",
        admiteOtrasRegiones: true,
      })
    ).toEqual({});
  });

  it("rechaza una región distinta a la del creador si no se admiten otras regiones", () => {
    expect(
      validarFormularioEquipo({ ...formularioValido, regionId: "3" }).region
    ).toBe("Tu región es LAS: elegila o permití jugadores de otras regiones.");

    expect(
      validarFormularioEquipo({
        ...formularioValido,
        regionId: "3",
        admiteOtrasRegiones: true,
      })
    ).toEqual({});
  });

  it("exige un rol para cada cupo vacante", () => {
    const errores = validarFormularioEquipo({
      ...formularioValido,
      rolesVacantesIds: ["11", ""],
    });

    expect(errores.rolesVacantes).toBe("Elegí un rol para cada cupo vacante.");
  });

  it("limita la cantidad de cupos vacantes", () => {
    expect(
      validarFormularioEquipo({ ...formularioValido, rolesVacantesIds: [] })
        .rolesVacantes
    ).toMatch(/entre 1 y/);

    expect(
      validarFormularioEquipo({
        ...formularioValido,
        rolesVacantesIds: Array(CUPOS_VACANTES_MAXIMO + 1).fill("11"),
      }).rolesVacantes
    ).toMatch(/entre 1 y/);
  });
});

describe("US 18 - Unirse a equipo", () => {
  const equipo = {
    videogame: { videogame_id: 1, name: "League of Legends" },
    region: { region_id: 2, region_name: "LAS" },
    allow_other_regions: false,
    min_rank: { rank_id: 2, name: "Plata", value: 2 },
    max_rank: { rank_id: 4, name: "Platino", value: 4 },
  };

  const vacanteMid = {
    is_vacant: true,
    team_member_role_id: 30,
    active_game_profile: {
      active_role_profile: { role_id: 10, role_name: "Mid" },
    },
  };

  const perfilConRango = (valor, regionId = 2) => ({
    videogame: { id: 1 },
    region: { region_id: regionId, name: "Región" },
    role_profiles: [
      {
        role: { role_id: 10, name: "Mid" },
        rank: { rank_id: valor, name: `Rango ${valor}`, value: valor },
      },
    ],
  });

  it("encuentra el perfil del jugador para el juego del equipo", () => {
    const perfil = perfilConRango(3);
    expect(perfilDelJuego([perfil], 1)).toBe(perfil);
    expect(perfilDelJuego([perfil], 9)).toBeNull();
  });

  it("permite la vacante si cumple rol, región y rango", () => {
    expect(
      motivoVacanteNoDisponible({
        equipo,
        vacante: vacanteMid,
        perfil: perfilConRango(3),
      })
    ).toBeNull();
  });

  it("rechaza sin perfil de juego", () => {
    expect(
      motivoVacanteNoDisponible({ equipo, vacante: vacanteMid, perfil: null })
    ).toMatch(/perfil de League of Legends/);
  });

  it("rechaza sin perfil para el rol de la vacante", () => {
    const perfil = { ...perfilConRango(3), role_profiles: [] };
    expect(
      motivoVacanteNoDisponible({ equipo, vacante: vacanteMid, perfil })
    ).toMatch(/rol Mid/);
  });

  it("rechaza un rango inferior al mínimo o superior al máximo", () => {
    for (const valor of [1, 5]) {
      expect(
        motivoVacanteNoDisponible({
          equipo,
          vacante: vacanteMid,
          perfil: perfilConRango(valor),
        })
      ).toMatch(/fuera del rango del equipo \(Plata a Platino\)/);
    }
  });

  it("rechaza otra región si el equipo no la admite", () => {
    expect(
      motivoVacanteNoDisponible({
        equipo,
        vacante: vacanteMid,
        perfil: perfilConRango(3, 7),
      })
    ).toMatch(/solo admite jugadores de LAS/);
  });

  it("permite otra región si el equipo la admite", () => {
    expect(
      motivoVacanteNoDisponible({
        equipo: { ...equipo, allow_other_regions: true },
        vacante: vacanteMid,
        perfil: perfilConRango(3, 7),
      })
    ).toBeNull();
  });

  it("traduce los rechazos del backend que traen IDs internos", () => {
    expect(
      mensajeDeRechazoAlUnirse(
        "El equipo con id: 3 está completo, no pueden unirse más usuarios",
        equipo
      )
    ).toBe("El equipo ya no tiene vacantes disponibles.");
    expect(
      mensajeDeRechazoAlUnirse(
        "El rango con ID 1 no es válido para el equipo con ID 3. Valor: 1, Mínimo admitido: 2, Máximo admitido: 4",
        equipo
      )
    ).toMatch(/Plata a Platino/);
    expect(
      mensajeDeRechazoAlUnirse(
        "El equipo 3 solo admite jugadores de la región 2 y el jugador tiene la región 7",
        equipo
      )
    ).toMatch(/solo admite jugadores de LAS/);
    expect(
      mensajeDeRechazoAlUnirse(
        "El usuario con id: 5 ya forma parte de un equipo activo",
        equipo
      )
    ).toMatch(/Ya formás parte de otro equipo activo/);
  });

  it("deja pasar los mensajes sin IDs y no devuelve nada sin mensaje", () => {
    expect(
      mensajeDeRechazoAlUnirse("Ya formás parte de otro equipo activo", equipo)
    ).toBe("Ya formás parte de otro equipo activo");
    expect(mensajeDeRechazoAlUnirse(undefined, equipo)).toBeNull();
  });
});

describe("US 15 - validarEdicionEquipo", () => {
  const PLATA = { rank_id: 2, name: "Plata", value: 2 };
  const ORO_ = { rank_id: 3, name: "Oro", value: 3 };
  const PLATINO = { rank_id: 4, name: "Platino", value: 4 };
  const rangos = [PLATA, ORO_, PLATINO];

  const integrante = (username, rankName) => ({
    is_vacant: false,
    username,
    active_game_profile: { active_role_profile: { rank_name: rankName } },
  });

  const base = {
    nombre: "Los Gankers",
    descripcion: "",
    regionId: "2",
    admiteOtrasRegiones: false,
    rangoMinimo: PLATA,
    rangoMaximo: PLATINO,
    integrantes: [integrante("lider", "Oro")],
    rangos,
  };

  it("acepta datos válidos", () => {
    expect(validarEdicionEquipo(base)).toEqual({});
  });

  it("rechaza el nombre vacío", () => {
    expect(validarEdicionEquipo({ ...base, nombre: "  " }).nombre).toBe(
      "Ingresá el nombre del equipo."
    );
  });

  it("rechaza un rango mínimo superior al máximo", () => {
    expect(
      validarEdicionEquipo({
        ...base,
        rangoMinimo: PLATINO,
        rangoMaximo: PLATA,
      }).rangoMaximo
    ).toMatch(/mínimo no puede ser superior/);
  });

  it("rechaza un intervalo que deja afuera el rango de un integrante", () => {
    const errores = validarEdicionEquipo({
      ...base,
      rangoMinimo: PLATINO,
      rangoMaximo: PLATINO,
      integrantes: [integrante("lider", "Oro"), { is_vacant: true }],
    });
    expect(errores.rangos).toContain("Quedan afuera: lider (Oro)");
  });

  it("un equipo sin región tiene que admitir otras regiones", () => {
    expect(
      validarEdicionEquipo({
        ...base,
        regionId: "",
        admiteOtrasRegiones: false,
      }).region
    ).toBeTruthy();
  });
});
