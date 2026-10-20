import { describe, it, expect } from "vitest";

import { leerReporteDesdeCsv, parsearCsv } from "./csvReporte";

// Mismo formato que ReportExportService._build_csv del backend.
const CSV_PERFILES = [
  "VIDEOJUEGO,PERFILES,PORCENTAJE,VARIACION,VARIACION_PORCENTAJE,TENDENCIA",
  "League of Legends,7,38.89,2,40.0,sube",
  "Overwatch,6,33.33,-1,-14.29,baja",
  '"Juego, con coma",5,27.78,,,',
  "",
  "TOTAL,18,100.0,,,",
  "",
].join("\r\n");

describe("utils/csvReporte", () => {
  it("parsea comillas y comas dentro de un campo", () => {
    expect(parsearCsv('a,"b, c","d ""e"""\n1,2,3')).toEqual([
      ["a", "b, c", 'd "e"'],
      ["1", "2", "3"],
    ]);
  });

  it("lee las filas del reporte y el total", () => {
    const { items, total } = leerReporteDesdeCsv(CSV_PERFILES);

    expect(total).toBe(18);
    expect(items).toEqual([
      {
        name: "League of Legends",
        count: 7,
        percentage: 38.89,
        variation: 2,
        variation_percentage: 40,
        trend: "sube",
      },
      {
        name: "Overwatch",
        count: 6,
        percentage: 33.33,
        variation: -1,
        variation_percentage: -14.29,
        trend: "baja",
      },
      {
        name: "Juego, con coma",
        count: 5,
        percentage: 27.78,
        variation: null,
        variation_percentage: null,
        trend: null,
      },
    ]);
  });

  it("saca el apóstrofo que el backend antepone a textos tipo fórmula", () => {
    const { items } = leerReporteDesdeCsv(
      "RANGO,JUGADORES,PORCENTAJE\n'+Plus,3,100.0\n\nTOTAL,3,\n"
    );

    expect(items[0].name).toBe("+Plus");
  });
});
