import { describe, it, expect } from "vitest";

import {
  describirPeriodo,
  formatearFechaReporte,
  formatearVariacion,
  validarFranjasRangos,
  validarPeriodoReporte,
} from "./reportes";

describe("US 38 - validarFranjasRangos", () => {
  const RANGOS = [
    { rank_id: 10, name: "Hierro", value: 1 },
    { rank_id: 11, name: "Plata", value: 2 },
    { rank_id: 12, name: "Oro", value: 3 },
    { rank_id: 13, name: "Platino", value: 4 },
  ];
  const franja = (min, max) => ({ min_rank_id: min, max_rank_id: max });

  it("acepta franjas completas que no se solapan", () => {
    expect(
      validarFranjasRangos([franja("10", "11"), franja("12", "13")], RANGOS)
    ).toBe("");
  });

  it("exige al menos una franja completa", () => {
    expect(validarFranjasRangos([], RANGOS)).toMatch(/al menos una franja/);
    expect(validarFranjasRangos([franja("10", "")], RANGOS)).toBe(
      "Elegí el rango mínimo y máximo de la franja 1."
    );
  });

  it("rechaza un mínimo mayor al máximo y franjas solapadas", () => {
    expect(validarFranjasRangos([franja("12", "10")], RANGOS)).toMatch(
      /mínimo no puede ser mayor/
    );
    expect(
      validarFranjasRangos([franja("10", "12"), franja("11", "13")], RANGOS)
    ).toBe("Las franjas de rangos no pueden solaparse.");
  });
});

describe("utils/reportes", () => {
  it("formatea la fecha del período sin correrla por la zona horaria", () => {
    expect(formatearFechaReporte("2026-10-01T00:00:00")).toBe("01/10/2026");
    expect(formatearFechaReporte(null)).toBeNull();
  });

  it("describe el período o el histórico total", () => {
    expect(describirPeriodo({ start_date: null, end_date: null })).toBe(
      "Histórico total"
    );
    expect(
      describirPeriodo({
        start_date: "2026-10-01T00:00:00",
        end_date: "2026-10-15T23:59:59",
      })
    ).toBe("Del 01/10/2026 al 15/10/2026");
  });

  it("formatea la variación con signo y porcentaje", () => {
    expect(formatearVariacion(3, 25)).toBe("+3 (+25%)");
    expect(formatearVariacion(-2, -10)).toBe("-2 (-10%)");
    expect(formatearVariacion(4, null)).toBe("+4");
    expect(formatearVariacion(null, null)).toBe("—");
  });

  describe("validarPeriodoReporte", () => {
    it("acepta el histórico total y un período válido", () => {
      expect(validarPeriodoReporte({ fechaInicio: "", fechaFin: "" })).toBe("");
      expect(
        validarPeriodoReporte({
          fechaInicio: "2026-10-16",
          fechaFin: "2026-10-20",
          inicioMinimo: "2026-10-16",
        })
      ).toBe("");
    });

    it("rechaza un inicio posterior al fin", () => {
      expect(
        validarPeriodoReporte({
          fechaInicio: "2026-10-20",
          fechaFin: "2026-10-10",
        })
      ).toMatch(/no puede ser posterior/);
    });

    it("rechaza un inicio anterior al fin del último reporte", () => {
      expect(
        validarPeriodoReporte({
          fechaInicio: "2026-10-10",
          fechaFin: "",
          inicioMinimo: "2026-10-16",
        })
      ).toBe(
        "Ya existe un reporte hasta el 15/10/2026: la fecha inicial tiene que ser a partir del 16/10/2026."
      );
    });
  });
});
