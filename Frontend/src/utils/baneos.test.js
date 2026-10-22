import { describe, expect, it } from "vitest";

import {
  DIAS_BANEO_PERMANENTE,
  DURACIONES_BANEO,
  esVencimientoPermanente,
  formatearDuracionBaneo,
  validarFormularioBaneo,
} from "./baneos";

describe("baneos - US 36 baneo permanente", () => {
  it("ofrece la opción Permanente con el tope de días", () => {
    expect(DURACIONES_BANEO).toContainEqual({
      value: DIAS_BANEO_PERMANENTE,
      label: "Permanente",
    });
  });

  it("el baneo permanente pasa la validación", () => {
    expect(
      validarFormularioBaneo({
        jugador: { user_id: 7 },
        motivo: "Cheats",
        duracionDias: DIAS_BANEO_PERMANENTE,
        miId: 1,
      })
    ).toEqual({});
  });

  it("muestra la duración como Permanente", () => {
    expect(formatearDuracionBaneo(DIAS_BANEO_PERMANENTE)).toBe("Permanente");
    expect(formatearDuracionBaneo(7)).toBe("7 días");
  });

  it("un vencimiento muy lejano se considera permanente", () => {
    const lejano = new Date();
    lejano.setFullYear(lejano.getFullYear() + 100);
    const cercano = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    expect(esVencimientoPermanente(lejano.toISOString())).toBe(true);
    expect(esVencimientoPermanente(cercano.toISOString())).toBe(false);
    expect(esVencimientoPermanente(null)).toBe(false);
  });
});
