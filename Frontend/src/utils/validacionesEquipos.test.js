import { describe, it, expect } from "vitest";

import {
  CUPOS_VACANTES_MAXIMO,
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
