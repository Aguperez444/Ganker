import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { obtenerDenunciasCruzadas } from "../../api/moderacionApi";
import ListaDenunciasComponent from "./ListaDenunciasComponent";
import DenunciasCruzadasComponent from "./DenunciasCruzadasComponent";

vi.mock("../../api/moderacionApi", () => ({
  obtenerDenunciasCruzadas: vi.fn(),
}));

const REPORTE = {
  id: 1,
  reporter_user_id: 2,
  reporter_user_name: "pepe",
  reported_user_id: 7,
  reported_user_name: "juan",
  created_at: "2026-11-16T12:00:00Z",
  status: "pending",
  reason: "abusive_behavior",
  description: "Denuncia original",
};
const CRUZADA = {
  id: 3,
  reporter_user_id: 7,
  reporter_user_name: "juan",
  reported_user_id: 2,
  reported_user_name: "pepe",
  created_at: "2026-11-16T13:00:00Z",
  status: "resolved",
  reason: "other",
  description: "Respuesta de Juan",
  evidence_image_url: "https://cdn.test/cross-report.png",
};
const respuesta = (reports = []) => ({
  reference_created_at: REPORTE.created_at,
  window_hours: 48,
  reports,
});

beforeEach(() => {
  vi.clearAllMocks();
  obtenerDenunciasCruzadas.mockResolvedValue(respuesta());
});

describe("Denuncias cruzadas", () => {
  it("distingue la comprobación en curso de la ausencia de denuncias", async () => {
    let completar;
    obtenerDenunciasCruzadas.mockReturnValue(
      new Promise((resolve) => {
        completar = resolve;
      })
    );
    render(
      <DenunciasCruzadasComponent denuncia={REPORTE} onVerDetalle={vi.fn()} />
    );
    expect(screen.getByText("Comprobando denuncias cruzadas...")).toBeVisible();
    expect(
      screen.queryByText(/no se encontraron denuncias cruzadas/i)
    ).toBeNull();
    completar(respuesta());
    expect(
      await screen.findByText(
        "No se encontraron denuncias cruzadas en este período."
      )
    ).toBeVisible();
    expect(obtenerDenunciasCruzadas).toHaveBeenCalledWith(1, {
      skip: 0,
      limit: 11,
    });
  });

  it("muestra si las denuncias inversas se hicieron antes o después", async () => {
    obtenerDenunciasCruzadas.mockResolvedValue(
      respuesta([
        { ...CRUZADA, id: 2, created_at: "2026-11-16T10:00:00Z" },
        CRUZADA,
      ])
    );
    render(
      <DenunciasCruzadasComponent denuncia={REPORTE} onVerDetalle={vi.fn()} />
    );
    expect(
      await screen.findByText(/2 h antes de esta denuncia/i)
    ).toBeVisible();
    expect(screen.getByText(/1 h después de esta denuncia/i)).toBeVisible();
    expect(screen.getAllByText("@juan → @pepe")).toHaveLength(2);
    expect(
      screen.getByText(/48 horas anteriores o posteriores/i)
    ).toBeVisible();
  });

  it("abre la denuncia cruzada con su evidencia y permite volver al reporte original", async () => {
    const user = userEvent.setup();
    obtenerDenunciasCruzadas.mockImplementation(async (id) =>
      id === 1 ? respuesta([CRUZADA]) : respuesta()
    );
    render(<ListaDenunciasComponent denuncias={[REPORTE]} />);
    await user.click(
      screen.getByRole("button", { name: /ver detalle del reporte/i })
    );
    await user.click(
      await screen.findByRole("button", {
        name: "Ver detalle de la denuncia cruzada 3",
      })
    );
    const detalle = screen.getByRole("dialog", { name: "Detalle del reporte" });
    expect(within(detalle).getByText("Respuesta de Juan")).toBeVisible();
    expect(
      within(detalle).getByRole("img", { name: "Evidencia de la denuncia 3" })
    ).toHaveAttribute("src", CRUZADA.evidence_image_url);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Banear jugador" })).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Volver al reporte anterior" })
    );
    expect(screen.getByText("Denuncia original")).toBeVisible();
  });

  it("permite reintentar si falla la búsqueda", async () => {
    const user = userEvent.setup();
    obtenerDenunciasCruzadas.mockRejectedValueOnce(new Error("Sin conexión"));
    render(
      <DenunciasCruzadasComponent denuncia={REPORTE} onVerDetalle={vi.fn()} />
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudieron comprobar"
    );
    expect(
      screen.queryByText(/no se encontraron denuncias cruzadas/i)
    ).toBeNull();
    await user.click(screen.getByRole("button", { name: "Volver a intentar" }));
    expect(
      await screen.findByText(/no se encontraron denuncias cruzadas/i)
    ).toBeVisible();
  });

  it("pagina las coincidencias", async () => {
    const user = userEvent.setup();
    obtenerDenunciasCruzadas
      .mockResolvedValueOnce(
        respuesta(
          Array.from({ length: 11 }, (_, i) => ({ ...CRUZADA, id: i + 10 }))
        )
      )
      .mockResolvedValue(respuesta([CRUZADA]));
    render(
      <DenunciasCruzadasComponent denuncia={REPORTE} onVerDetalle={vi.fn()} />
    );
    await user.click(await screen.findByRole("button", { name: "Siguiente" }));
    expect(
      await screen.findByRole("button", {
        name: "Ver detalle de la denuncia cruzada 3",
      })
    ).toBeVisible();
    expect(obtenerDenunciasCruzadas).toHaveBeenLastCalledWith(1, {
      skip: 10,
      limit: 11,
    });
    expect(screen.getByText("Página 2")).toBeVisible();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });
});
