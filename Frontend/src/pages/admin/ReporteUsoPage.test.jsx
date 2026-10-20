import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import ReporteUsoPage from "./ReporteUsoPage";
import { getGames } from "../../api/gameApi";
import { getRanksByGame } from "../../api/rankApi";
import {
  exportarReporteUso,
  generarReporteUso,
  obtenerReportesUso,
  obtenerTiposAnalisis,
  obtenerUltimoReporteUso,
} from "../../api/reportesApi";
import { descargarArchivo } from "../../utils/descargas";

vi.mock("../../api/gameApi", () => ({ getGames: vi.fn() }));
vi.mock("../../api/rankApi", () => ({ getRanksByGame: vi.fn() }));
vi.mock("../../api/reportesApi", () => ({
  exportarReporteUso: vi.fn(),
  generarReporteUso: vi.fn(),
  obtenerReportesUso: vi.fn(),
  obtenerTiposAnalisis: vi.fn(),
  obtenerUltimoReporteUso: vi.fn(),
}));
vi.mock("../../utils/descargas", () => ({ descargarArchivo: vi.fn() }));

const TIPOS = [
  {
    value: "ranks",
    label: "Distribución por rangos",
    description: "Jugadores por rango",
    requires_rank_bands: false,
  },
  {
    value: "characters",
    label: "Personajes más utilizados",
    description: "Frecuencia de personajes",
    requires_rank_bands: false,
  },
  {
    value: "teams",
    label: "Equipos por franja de rangos",
    description: "Equipos por franja",
    requires_rank_bands: true,
  },
];

const RANGOS = [
  { rank_id: 12, name: "Oro", value: 3 },
  { rank_id: 10, name: "Hierro", value: 1 },
  { rank_id: 11, name: "Plata", value: 2 },
];

function reporte(overrides = {}) {
  return {
    report_id: 8,
    generated_by: 1,
    analysis_type: "ranks",
    videogame_id: 2,
    videogame_name: "League of Legends",
    icon_url: null,
    start_date: null,
    end_date: null,
    generated_at: "2026-10-20T15:00:00",
    total: 10,
    has_previous_report: false,
    previous_report_id: null,
    items: [
      {
        category_id: 12,
        name: "Oro",
        icon_url: null,
        count: 6,
        percentage: 60,
      },
      {
        category_id: 11,
        name: "Plata",
        icon_url: null,
        count: 4,
        percentage: 40,
      },
    ],
    ...overrides,
  };
}

function renderPagina() {
  render(
    <MemoryRouter initialEntries={["/app/admin/reportes/uso"]}>
      <ReporteUsoPage />
    </MemoryRouter>
  );
}

async function elegirJuego(usuario, nombre) {
  const select = await screen.findByLabelText("Videojuego");
  await waitFor(() =>
    expect(within(select).getByText(nombre)).toBeInTheDocument()
  );
  await usuario.selectOptions(select, nombre);
}

async function generar(usuario) {
  await usuario.click(screen.getByRole("button", { name: "Generar reporte" }));
}

describe("ReporteUsoPage - US 38 Reporte de uso por videojuego", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGames.mockResolvedValue([
      { id: 2, name: "League of Legends" },
      { id: 4, name: "Juego sin datos" },
    ]);
    obtenerTiposAnalisis.mockResolvedValue(TIPOS);
    obtenerUltimoReporteUso.mockResolvedValue({ has_report: false });
    obtenerReportesUso.mockResolvedValue([]);
    getRanksByGame.mockResolvedValue(RANGOS);
    generarReporteUso.mockResolvedValue(reporte());
  });

  it("genera la distribución por rangos de un videojuego con cantidad y porcentaje", async () => {
    const usuario = userEvent.setup();
    renderPagina();

    await elegirJuego(usuario, "League of Legends");
    await generar(usuario);

    expect(generarReporteUso).toHaveBeenCalledWith({
      videogame_id: "2",
      analysis_type: "ranks",
      start_date: "",
      end_date: "",
      rank_bands: null,
    });
    expect(
      await screen.findByRole("heading", {
        name: "Distribución por rangos · League of Legends",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Rango" })
    ).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("genera el top de personajes más utilizados", async () => {
    const usuario = userEvent.setup();
    generarReporteUso.mockResolvedValue(
      reporte({
        analysis_type: "characters",
        items: [
          { category_id: 1, name: "Ahri", count: 5, percentage: 50 },
          { category_id: 2, name: "Jinx", count: 2, percentage: 20 },
        ],
      })
    );
    renderPagina();

    await elegirJuego(usuario, "League of Legends");
    await usuario.click(screen.getByLabelText("Personajes más utilizados"));
    await generar(usuario);

    expect(generarReporteUso).toHaveBeenCalledWith(
      expect.objectContaining({ analysis_type: "characters" })
    );
    const filas = within(await screen.findByRole("table")).getAllByRole("row");
    expect(within(filas[1]).getByText("Ahri")).toBeInTheDocument();
    expect(within(filas[2]).getByText("Jinx")).toBeInTheDocument();
  });

  it("en equipos de un juego pide franjas, las valida y las manda", async () => {
    const usuario = userEvent.setup();
    generarReporteUso.mockResolvedValue(
      reporte({
        analysis_type: "teams",
        items: [
          {
            category_id: null,
            name: "Rango Hierro - Plata",
            rank_range: "Rango Hierro - Plata",
            count: 3,
            percentage: 75,
          },
        ],
      })
    );
    renderPagina();

    await elegirJuego(usuario, "League of Legends");
    await usuario.click(screen.getByLabelText("Equipos por franja de rangos"));

    const desde = await screen.findByLabelText("Franja 1: desde");
    // Los rangos se ofrecen ordenados por su valor.
    await waitFor(() =>
      expect(
        within(desde)
          .getAllByRole("option")
          .map((o) => o.textContent)
      ).toEqual(["Rango mínimo", "Hierro", "Plata", "Oro"])
    );

    // Mínimo mayor que el máximo: no se manda.
    await usuario.selectOptions(desde, "Oro");
    await usuario.selectOptions(
      screen.getByLabelText("Franja 1: hasta"),
      "Hierro"
    );
    await generar(usuario);
    expect(
      screen.getByText(
        "En la franja 1 el rango mínimo no puede ser mayor al máximo."
      )
    ).toBeInTheDocument();
    expect(generarReporteUso).not.toHaveBeenCalled();

    await usuario.selectOptions(desde, "Hierro");
    await usuario.selectOptions(
      screen.getByLabelText("Franja 1: hasta"),
      "Plata"
    );
    await generar(usuario);

    expect(generarReporteUso).toHaveBeenCalledWith(
      expect.objectContaining({
        analysis_type: "teams",
        rank_bands: [{ min_rank_id: 10, max_rank_id: 11 }],
      })
    );
    expect(
      await screen.findByRole("columnheader", { name: "Franja de rangos" })
    ).toBeInTheDocument();
  });

  it("manda el período elegido", async () => {
    const usuario = userEvent.setup();
    renderPagina();

    await elegirJuego(usuario, "League of Legends");
    await usuario.type(screen.getByLabelText("Fecha inicial"), "2026-10-01");
    await usuario.type(screen.getByLabelText("Fecha final"), "2026-10-15");
    await generar(usuario);

    expect(generarReporteUso).toHaveBeenCalledWith(
      expect.objectContaining({
        start_date: "2026-10-01",
        end_date: "2026-10-15",
      })
    );
  });

  it("con un reporte previo del mismo tipo y juego preselecciona el inicio y muestra la variación", async () => {
    const usuario = userEvent.setup();
    obtenerUltimoReporteUso.mockImplementation(async ({ videogame_id }) =>
      videogame_id === "2"
        ? {
            has_report: true,
            start_date: "2026-10-01T00:00:00",
            end_date: "2026-10-15T23:59:59",
            suggested_start_date: "2026-10-16",
          }
        : { has_report: false }
    );
    generarReporteUso.mockResolvedValue(
      reporte({
        has_previous_report: true,
        previous_report_id: 7,
        items: [
          {
            category_id: 12,
            name: "Oro",
            count: 6,
            percentage: 60,
            variation: 2,
            variation_percentage: 50,
            trend: "sube",
          },
        ],
      })
    );
    renderPagina();

    await elegirJuego(usuario, "League of Legends");
    expect(await screen.findByDisplayValue("2026-10-16")).toBe(
      screen.getByLabelText("Fecha inicial")
    );
    await generar(usuario);

    expect(await screen.findByText("+2 (+50%)")).toBeInTheDocument();
    expect(screen.getByText("Sube")).toBeInTheDocument();
  });

  it("avisa si el videojuego no tiene datos", async () => {
    const usuario = userEvent.setup();
    generarReporteUso.mockRejectedValue({
      response: {
        status: 404,
        data: {
          error:
            "No hay datos suficientes para generar el reporte: el videojuego Juego sin datos no tiene perfiles con rangos.",
        },
      },
    });
    renderPagina();

    await elegirJuego(usuario, "Juego sin datos");
    await generar(usuario);

    expect(
      await screen.findByText(/No hay datos suficientes/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("exporta el reporte generado", async () => {
    const usuario = userEvent.setup();
    const blob = new Blob(["xlsx"]);
    exportarReporteUso.mockResolvedValue({ blob, nombreArchivo: "uso_8.xlsx" });
    renderPagina();

    await elegirJuego(usuario, "League of Legends");
    await generar(usuario);
    await usuario.click(
      await screen.findByRole("button", { name: "Exportar reporte 8 en Excel" })
    );

    expect(exportarReporteUso).toHaveBeenCalledWith(8, "excel");
    expect(descargarArchivo).toHaveBeenCalledWith(blob, "uso_8.xlsx");
  });

  it("sin permisos de admin muestra el error", async () => {
    obtenerTiposAnalisis.mockRejectedValue({
      response: { status: 403, data: {} },
    });
    renderPagina();

    expect(
      await screen.findByText("No tenés permisos para acceder a los reportes.")
    ).toBeInTheDocument();
  });
});
