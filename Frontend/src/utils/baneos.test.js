import { describe, expect, it } from "vitest";

import {
  DIAS_BANEO_PERMANENTE,
  DURACIONES_BANEO,
  esVencimientoPermanente,
  formatearDuracionBaneo,
  mensajeDeCuentaBaneada,
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

describe("mensajeDeCuentaBaneada - US 36 login", () => {
  it("muestra el motivo y el vencimiento en hora local", () => {
    const mensaje = mensajeDeCuentaBaneada(
      "El baneo del jugador aún no ha finalizado. Motivo: Insultos. Vencimiento: 2026-10-29T18:00:00+00:00"
    );

    expect(mensaje).toMatch(/^Tu cuenta está suspendida\. Motivo: Insultos\./);
    expect(mensaje).toMatch(/La suspensión vence el /);
    expect(mensaje).not.toMatch(/2026-10-29T/);
  });

  it("un baneo sin vencimiento o muy lejano se muestra como permanente", () => {
    expect(
      mensajeDeCuentaBaneada(
        "El baneo del jugador aún no ha finalizado. Motivo: Cheats. Sin fecha de vencimiento"
      )
    ).toBe(
      "Tu cuenta está suspendida. Motivo: Cheats. La suspensión es permanente."
    );

    const lejano = new Date();
    lejano.setFullYear(lejano.getFullYear() + 100);
    expect(
      mensajeDeCuentaBaneada(
        `El baneo del jugador aún no ha finalizado. Motivo: Cheats. Vencimiento: ${lejano.toISOString()}`
      )
    ).toMatch(/La suspensión es permanente\.$/);
  });

  it("si el backend no manda el motivo, muestra su mensaje tal cual", () => {
    expect(
      mensajeDeCuentaBaneada("El baneo del jugador aún no ha finalizado")
    ).toBe("El baneo del jugador aún no ha finalizado");
  });
});
