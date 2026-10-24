import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatearConexionReciente,
  formatearTiempoRelativo,
  parsearFechaUTC,
} from "./tiempo";

afterEach(() => vi.restoreAllMocks());

describe("fechas UTC del backend", () => {
  it.each([
    "2026-10-24T15:55:00",
    "2026-10-24T15:55:00Z",
    "2026-10-24T15:55:00+00:00",
    "2026-10-24T12:55:00-03:00",
  ])("calcula la antigüedad del mismo instante: %s", (timestamp) => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-24T16:00:00Z"));
    expect(formatearConexionReciente(timestamp)).toBe("Conectado hace 5 min");
    expect(formatearTiempoRelativo(timestamp)).toBe("hace 5 min");
  });

  it("mantiene los valores vacíos para fechas ausentes o inválidas", () => {
    for (const timestamp of [null, undefined, "", "fecha inválida"]) {
      expect(formatearConexionReciente(timestamp)).toBeNull();
      expect(formatearTiempoRelativo(timestamp)).toBe("");
    }
  });

  it("muestra las 15 UTC como las 12 en Argentina sin restar dos veces", () => {
    for (const timestamp of [
      "2026-10-24T15:00:00",
      "2026-10-24T15:00:00Z",
      "2026-10-24T12:00:00-03:00",
    ]) {
      const fecha = parsearFechaUTC(timestamp);
      expect(fecha.toISOString()).toBe("2026-10-24T15:00:00.000Z");
      expect(
        fecha.toLocaleTimeString("es-AR", {
          timeZone: "America/Argentina/Cordoba",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        })
      ).toBe("12:00");
    }
  });
});
