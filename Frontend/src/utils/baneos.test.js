import { describe, expect, it } from "vitest";

import {
  armarFiltrosBusquedaBaneos,
  DIAS_BANEO_PERMANENTE,
  DURACIONES_BANEO,
  esBaneoVigente,
  esVencimientoPermanente,
  FILTROS_BANEOS_VACIOS,
  hayFiltrosDeBaneos,
  mensajeDeErrorBusquedaBaneos,
  validarFiltrosBaneos,
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

describe("baneos - Buscar jugadores baneados", () => {
  const ahora = new Date("2026-10-24T12:00:00Z");

  it("un baneo sin vencimiento o que vence más adelante está vigente", () => {
    expect(esBaneoVigente(null, ahora)).toBe(true);
    expect(esBaneoVigente("2026-10-25T12:00:00+00:00", ahora)).toBe(true);
  });

  it("un baneo vencido o levantado no está vigente", () => {
    expect(esBaneoVigente("2026-10-24T11:59:59+00:00", ahora)).toBe(false);
    // Sin zona: el backend lo manda en UTC.
    expect(esBaneoVigente("2026-10-20T10:00:00", ahora)).toBe(false);
  });

  it("arma el rango de fechas de día completo en la hora local", () => {
    const filtros = armarFiltrosBusquedaBaneos({
      ...FILTROS_BANEOS_VACIOS,
      creadoDesde: "2026-10-01",
      creadoHasta: "2026-10-10",
    });

    expect(filtros.creadoDesde).toBe(
      new Date(2026, 9, 1, 0, 0, 0, 0).toISOString()
    );
    expect(filtros.creadoHasta).toBe(
      new Date(2026, 9, 10, 23, 59, 59, 999).toISOString()
    );
    expect(filtros.vencimientoDesde).toBeUndefined();
    expect(filtros.vencimientoHasta).toBeUndefined();
  });

  it("limpia espacios y la @ de los nombres, pero no del motivo", () => {
    expect(
      armarFiltrosBusquedaBaneos({
        ...FILTROS_BANEOS_VACIOS,
        usuario: "  @pedro ",
        admin: "@mod",
        motivo: " @Cheats ",
      })
    ).toMatchObject({ usuario: "pedro", admin: "mod", motivo: "@Cheats" });
  });

  it("rechaza rangos con la fecha inicial posterior a la final", () => {
    expect(
      validarFiltrosBaneos({
        ...FILTROS_BANEOS_VACIOS,
        creadoDesde: "2026-10-10",
        creadoHasta: "2026-10-01",
        vencimientoDesde: "2026-11-10",
        vencimientoHasta: "2026-11-01",
      })
    ).toEqual({
      creado: "La fecha inicial no puede ser posterior a la final.",
      vencimiento: "La fecha inicial no puede ser posterior a la final.",
    });
  });

  it("acepta rangos abiertos o del mismo día", () => {
    expect(
      validarFiltrosBaneos({
        ...FILTROS_BANEOS_VACIOS,
        creadoDesde: "2026-10-10",
        vencimientoDesde: "2026-11-01",
        vencimientoHasta: "2026-11-01",
      })
    ).toEqual({});
  });

  it("detecta si hay algún filtro cargado", () => {
    expect(hayFiltrosDeBaneos(FILTROS_BANEOS_VACIOS)).toBe(false);
    expect(hayFiltrosDeBaneos({ ...FILTROS_BANEOS_VACIOS, motivo: " " })).toBe(
      false
    );
    expect(hayFiltrosDeBaneos({ ...FILTROS_BANEOS_VACIOS, admin: "mod" })).toBe(
      true
    );
  });

  it("traduce los errores de la búsqueda", () => {
    expect(mensajeDeErrorBusquedaBaneos({ response: { status: 403 } })).toBe(
      "No tenés permisos para ver los baneos."
    );
    expect(mensajeDeErrorBusquedaBaneos({ response: { status: 422 } })).toBe(
      "Revisá los filtros: alguna fecha no es válida."
    );
    expect(mensajeDeErrorBusquedaBaneos({})).toBe(
      "No pudimos conectar con el servidor. Intentá de nuevo."
    );
  });
});
