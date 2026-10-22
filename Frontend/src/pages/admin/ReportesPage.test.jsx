import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import ReportesPage from "./ReportesPage";
import {
  exportarReportePerfiles,
  generarReportePerfiles,
  obtenerReportesPerfiles,
  obtenerUltimoReportePerfiles,
} from "../../api/reportesApi";
import { descargarArchivo } from "../../utils/descargas";

vi.mock("../../api/reportesApi", () => ({
  generarReportePerfiles: vi.fn(),
  obtenerReportesPerfiles: vi.fn(),
  obtenerUltimoReportePerfiles: vi.fn(),
  exportarReportePerfiles: vi.fn(),
  obtenerDatosReportePerfiles: vi
    .fn()
    .mockResolvedValue({ items: [], total: 0 }),
}));
vi.mock("../../utils/descargas", () => ({ descargarArchivo: vi.fn() }));

function renderPagina() {
  render(
    <MemoryRouter>
      <ReportesPage />
    </MemoryRouter>
  );
}

const SIN_PREVIO = { has_report: false, suggested_start_date: null };

const REPORTE = {
  report_id: 5,
  generated_by: 1,
  generated_at: "2026-10-20T15:00:00",
  start_date: null,
  end_date: null,
  total_profiles: 10,
  has_previous_report: false,
  previous_report_id: null,
  items: [
    {
      videogame_id: 1,
      videogame_name: "League of Legends",
      icon_url: null,
      profile_count: 6,
      percentage: 60,
      variation: null,
      variation_percentage: null,
      trend: null,
    },
    {
      videogame_id: 2,
      videogame_name: "Valorant",
      icon_url: null,
      profile_count: 3,
      percentage: 30,
      variation: null,
      variation_percentage: null,
      trend: null,
    },
    {
      videogame_id: 3,
      videogame_name: "CS2",
      icon_url: null,
      profile_count: 1,
      percentage: 10,
      variation: null,
      variation_percentage: null,
      trend: null,
    },
  ],
};

async function generar(usuario) {
  await usuario.click(
    await screen.findByRole("button", { name: "Generar reporte" })
  );
}

describe("ReportesPage - US 37 Reporte de jugadores por videojuego", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerUltimoReportePerfiles.mockResolvedValue(SIN_PREVIO);
    obtenerReportesPerfiles.mockResolvedValue([]);
    generarReportePerfiles.mockResolvedValue(REPORTE);
  });

  it("genera el histórico total y lista los juegos por popularidad con su porcentaje", async () => {
    const usuario = userEvent.setup();
    renderPagina();

    await generar(usuario);

    expect(generarReportePerfiles).toHaveBeenCalledWith({
      start_date: "",
      end_date: "",
    });
    const filas = within(await screen.findByRole("table")).getAllByRole("row");
    // Encabezado + 3 juegos, en el orden de popularidad.
    expect(
      filas.slice(1).map((f) => within(f).getAllByRole("cell")[1].textContent)
    ).toEqual(["League of Legends", "Valorant", "CS2"]);
    expect(within(filas[1]).getByText("60%")).toBeInTheDocument();
    expect(
      screen.getByText(/Histórico total · 10 perfiles en total/)
    ).toBeInTheDocument();
    // Sin reporte previo no hay columnas de variación.
    expect(
      screen.queryByRole("columnheader", { name: "Variación" })
    ).toBeNull();
  });

  it("con un reporte previo muestra la variación y la tendencia", async () => {
    const usuario = userEvent.setup();
    generarReportePerfiles.mockResolvedValue({
      ...REPORTE,
      has_previous_report: true,
      previous_report_id: 4,
      items: [
        {
          ...REPORTE.items[0],
          variation: 2,
          variation_percentage: 50,
          trend: "sube",
        },
        {
          ...REPORTE.items[1],
          variation: -1,
          variation_percentage: -25,
          trend: "baja",
        },
        {
          ...REPORTE.items[2],
          variation: 0,
          variation_percentage: 0,
          trend: "estable",
        },
      ],
    });
    renderPagina();

    await generar(usuario);

    expect(
      await screen.findByRole("columnheader", { name: "Variación" })
    ).toBeInTheDocument();
    expect(screen.getByText("+2 (+50%)")).toBeInTheDocument();
    expect(screen.getByText("-1 (-25%)")).toBeInTheDocument();
    expect(screen.getByText("Sube")).toBeInTheDocument();
    expect(screen.getByText("Baja")).toBeInTheDocument();
    expect(screen.getByText(/contra el reporte #4/)).toBeInTheDocument();
  });

  it("manda el período elegido", async () => {
    const usuario = userEvent.setup();
    renderPagina();

    await usuario.type(
      await screen.findByLabelText("Fecha inicial"),
      "2026-10-01"
    );
    await usuario.type(screen.getByLabelText("Fecha final"), "2026-10-15");
    await generar(usuario);

    expect(generarReportePerfiles).toHaveBeenCalledWith({
      start_date: "2026-10-01",
      end_date: "2026-10-15",
    });
  });

  it("con un reporte previo preselecciona el inicio y no deja arrancar antes", async () => {
    const usuario = userEvent.setup();
    obtenerUltimoReportePerfiles.mockResolvedValue({
      has_report: true,
      start_date: "2026-10-01T00:00:00",
      end_date: "2026-10-15T23:59:59",
      suggested_start_date: "2026-10-16",
    });
    renderPagina();

    const inicio = await screen.findByLabelText("Fecha inicial");
    expect(await screen.findByDisplayValue("2026-10-16")).toBe(inicio);

    await usuario.clear(inicio);
    await usuario.type(inicio, "2026-10-10");
    await generar(usuario);

    expect(
      screen.getByText(
        /la fecha inicial tiene que ser a partir del 16\/10\/2026/
      )
    ).toBeInTheDocument();
    expect(generarReportePerfiles).not.toHaveBeenCalled();
  });

  it("muestra el error del backend si el período choca con el reporte previo", async () => {
    const usuario = userEvent.setup();
    generarReportePerfiles.mockRejectedValue({
      response: {
        status: 400,
        data: {
          error:
            "La fecha inicial del nuevo reporte no puede ser menor a la fecha final del último reporte previo.",
        },
      },
    });
    renderPagina();

    await generar(usuario);

    expect(
      await screen.findByText(
        /no puede ser menor a la fecha final del último reporte/
      )
    ).toBeInTheDocument();
  });

  it("avisa si no hay perfiles para generar el reporte", async () => {
    const usuario = userEvent.setup();
    generarReportePerfiles.mockRejectedValue({
      response: {
        status: 404,
        data: {
          error:
            "No hay datos suficientes para generar el reporte: no existen perfiles de jugador registrados en la plataforma.",
        },
      },
    });
    renderPagina();

    await generar(usuario);

    expect(
      await screen.findByText(/No hay datos suficientes/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("exporta el reporte generado y descarga el archivo", async () => {
    const usuario = userEvent.setup();
    const blob = new Blob(["csv"]);
    exportarReportePerfiles.mockResolvedValue({
      blob,
      nombreArchivo: "reporte_perfiles_5.csv",
    });
    renderPagina();

    await generar(usuario);
    await usuario.click(
      await screen.findByRole("button", { name: "Exportar reporte 5 en CSV" })
    );

    expect(exportarReportePerfiles).toHaveBeenCalledWith(5, "csv");
    expect(descargarArchivo).toHaveBeenCalledWith(
      blob,
      "reporte_perfiles_5.csv"
    );
  });

  it("lista los reportes anteriores con sus exportaciones", async () => {
    const usuario = userEvent.setup();
    obtenerReportesPerfiles.mockResolvedValue([
      {
        report_id: 3,
        generated_at: "2026-10-10T12:00:00",
        start_date: null,
        end_date: null,
      },
    ]);
    exportarReportePerfiles.mockResolvedValue({
      blob: new Blob(["pdf"]),
      nombreArchivo: "reporte_3.pdf",
    });
    renderPagina();

    expect(
      await screen.findByText("Reporte #3 · Histórico total")
    ).toBeInTheDocument();
    await usuario.click(
      screen.getByRole("button", { name: "Exportar reporte 3 en PDF" })
    );

    expect(exportarReportePerfiles).toHaveBeenCalledWith(3, "pdf");
  });

  it("sin permisos de admin muestra el error", async () => {
    obtenerUltimoReportePerfiles.mockRejectedValue({
      response: { status: 403, data: {} },
    });
    renderPagina();

    expect(
      await screen.findByText("No tenés permisos para acceder a los reportes.")
    ).toBeInTheDocument();
  });
});
