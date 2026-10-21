import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";

import PanelUltimoReporteComponent from "./PanelUltimoReporteComponent";

const RESUMEN = (id) => ({
  report_id: id,
  generated_at: "2026-10-20T15:00:00",
  start_date: null,
  end_date: null,
});

const ULTIMO = {
  total: 12,
  items: [
    {
      name: "LoL",
      count: 7,
      variation: 2,
      variation_percentage: 40,
      trend: "sube",
    },
    {
      name: "Valorant",
      count: 5,
      variation: -1,
      variation_percentage: -16.67,
      trend: "baja",
    },
  ],
};
const ANTERIOR = {
  total: 11,
  items: [
    {
      name: "LoL",
      count: 5,
      variation: null,
      variation_percentage: null,
      trend: null,
    },
    {
      name: "Valorant",
      count: 6,
      variation: null,
      variation_percentage: null,
      trend: null,
    },
  ],
};

function renderPanel(props = {}) {
  render(
    <PanelUltimoReporteComponent
      titulo="Último reporte"
      unidad="perfiles"
      hayReporte
      cargando={false}
      error=""
      ultimoResumen={RESUMEN(5)}
      anteriorResumen={RESUMEN(4)}
      ultimo={ULTIMO}
      anterior={ANTERIOR}
      {...props}
    />
  );
}

describe("PanelUltimoReporteComponent", () => {
  it("muestra las tortas del último y del anterior con el cambio total", () => {
    renderPanel();

    expect(screen.getByText("Último · Reporte #5")).toBeInTheDocument();
    expect(screen.getByText("Anterior · Reporte #4")).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getByText("+1 perfiles")).toBeInTheDocument();
    expect(screen.getByText(/\(11 → 12\)/)).toBeInTheDocument();
  });

  it("detalla cada categoría con su variación y tendencia", () => {
    renderPanel();

    const tabla = screen.getByRole("table");
    const filaLol = within(tabla).getByText("LoL").closest("tr");
    expect(within(filaLol).getByText("+2 (+40%)")).toBeInTheDocument();
    expect(within(filaLol).getByText("Sube")).toBeInTheDocument();
  });

  it("al pasar por una porción muestra su detalle en el centro", async () => {
    const usuario = userEvent.setup();
    renderPanel({ anterior: null, anteriorResumen: null });

    const [porcionLol] = screen.getAllByLabelText(/^LoL: 7 perfiles/);
    await usuario.hover(porcionLol);

    expect(screen.getByText("58.3%")).toBeInTheDocument();
  });

  it("sin reportes avisa que no hay datos", () => {
    renderPanel({ hayReporte: false, ultimo: null });

    expect(
      screen.getByText("Todavía no se generó ningún reporte de este tipo.")
    ).toBeInTheDocument();
  });
});
