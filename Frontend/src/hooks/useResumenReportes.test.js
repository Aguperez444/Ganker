import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { useResumenReportes } from "./useResumenReportes";
import {
  obtenerDatosReportePerfiles,
  obtenerDatosReporteUso,
  obtenerReportesPerfiles,
  obtenerReportesUso,
} from "../api/reportesApi";

vi.mock("../api/reportesApi", () => ({
  obtenerDatosReportePerfiles: vi.fn(),
  obtenerDatosReporteUso: vi.fn(),
  obtenerReportesPerfiles: vi.fn(),
  obtenerReportesUso: vi.fn(),
}));
vi.mock("../utils/logs", () => ({ logError: vi.fn() }));

describe("useResumenReportes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trae el último reporte de cada tipo y omite los que no tienen", async () => {
    obtenerReportesPerfiles.mockResolvedValue([
      { report_id: 9 },
      { report_id: 8 },
    ]);
    obtenerDatosReportePerfiles.mockResolvedValue({
      items: [{ name: "Valorant", count: 3 }],
      total: 3,
    });
    obtenerReportesUso.mockImplementation(({ analysis_type }) =>
      Promise.resolve(analysis_type === "ranks" ? [{ report_id: 4 }] : [])
    );
    obtenerDatosReporteUso.mockResolvedValue({
      items: [{ name: "Oro", count: 2 }],
      total: 2,
    });

    const { result } = renderHook(() => useResumenReportes());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(obtenerDatosReportePerfiles).toHaveBeenCalledWith(9);
    expect(obtenerDatosReporteUso).toHaveBeenCalledWith(4);
    expect(result.current.reportes.map((r) => r.clave)).toEqual([
      "perfiles",
      "ranks",
    ]);
    expect(result.current.error).toBe("");
  });

  it("si falla uno sigue mostrando los demás", async () => {
    obtenerReportesPerfiles.mockRejectedValue(new Error("caido"));
    obtenerReportesUso.mockImplementation(({ analysis_type }) =>
      Promise.resolve(analysis_type === "teams" ? [{ report_id: 2 }] : [])
    );
    obtenerDatosReporteUso.mockResolvedValue({
      items: [{ name: "Oro - Platino", count: 1 }],
      total: 1,
    });

    const { result } = renderHook(() => useResumenReportes());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.reportes.map((r) => r.clave)).toEqual(["teams"]);
    expect(result.current.error).toBe("");
  });

  it("si fallan todos informa el error", async () => {
    obtenerReportesPerfiles.mockRejectedValue(new Error("caido"));
    obtenerReportesUso.mockRejectedValue(new Error("caido"));

    const { result } = renderHook(() => useResumenReportes());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.reportes).toEqual([]);
    expect(result.current.error).toBe(
      "No se pudieron cargar los últimos reportes."
    );
  });
});
