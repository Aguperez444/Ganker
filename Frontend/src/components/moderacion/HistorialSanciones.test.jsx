import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buscarDenuncias,
  obtenerDetalleBaneo,
  obtenerHistorialBaneos,
} from "../../api/moderacionApi";
import { obtenerApelacion } from "../../api/apelacionesApi";
import ModalHistorialSancionesComponent from "./ModalHistorialSancionesComponent";

vi.mock("../../api/moderacionApi", () => ({
  obtenerDenunciasCruzadas: vi.fn().mockResolvedValue({ reports: [] }),
  buscarDenuncias: vi.fn(),
  obtenerDetalleBaneo: vi.fn(),
  obtenerHistorialBaneos: vi.fn(),
}));
vi.mock("../../api/apelacionesApi", () => ({
  obtenerApelacion: vi.fn(),
  resolverApelacion: vi.fn(),
}));

const BANEO = {
  id: 2,
  user_id: 7,
  username: "ana",
  banned_by_username: "admin",
  reason: "Scripts reiterados",
  created_at: "2026-11-01T12:00:00Z",
  expires_at: "2026-12-01T12:00:00Z",
  ended_at: "2026-11-02T12:00:00Z",
  ended_by_username: "moderadora",
  end_reason: "manual",
  status: "unbanned",
  appeal: null,
};
const APELACION = {
  id: 3,
  text: "Apelo este baneo",
  images: ["https://cdn.test/appeal.png"],
  status: "pending",
  created_at: "2026-11-02T12:00:00Z",
  resolved_at: null,
  ban: {
    ban_id: 2,
    user_id: 7,
    username: "ana",
    reason: "Scripts reiterados",
    active: true,
    created_at: BANEO.created_at,
    expires_at: BANEO.expires_at,
  },
};
const REPORTE = {
  id: 9,
  reported_user_id: 7,
  reported_user_name: "ana",
  reporter_user_id: 1,
  reporter_user_name: "beto",
  reason: "cheating",
  status: "resolved",
  description: "Denuncia antes del baneo",
};

beforeEach(() => {
  vi.clearAllMocks();
  obtenerDetalleBaneo.mockResolvedValue(BANEO);
  obtenerHistorialBaneos.mockResolvedValue([
    { ...BANEO, id: 1, reason: "Sanción anterior" },
  ]);
  obtenerApelacion.mockResolvedValue(APELACION);
  buscarDenuncias.mockResolvedValue([REPORTE]);
});

describe("Detalles e historial de sanciones", () => {
  it("distingue al administrador que baneó del que desbaneó y muestra denuncias anteriores a la sanción", async () => {
    const user = userEvent.setup();
    render(
      <ModalHistorialSancionesComponent
        baneoId={2}
        miId={1}
        onClose={vi.fn()}
      />
    );
    expect(
      await screen.findByRole("heading", { name: "@ana · ID 7" })
    ).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Datos de la sanción" })
    ).toHaveTextContent("Baneado por @admin");
    expect(
      screen.getByRole("region", { name: "Finalización del baneo" })
    ).toHaveTextContent("Desbaneado por @moderadora");
    expect(screen.getByText(/levantó la sanción manualmente/i)).toBeVisible();
    await user.click(
      await screen.findByRole("button", { name: /ver detalle del reporte/i })
    );
    expect(buscarDenuncias).toHaveBeenCalledWith({
      denunciadoId: 7,
      fechaCreacionHasta: BANEO.created_at,
      skip: 0,
      limit: 11,
    });
    expect(screen.getByText("Denuncia antes del baneo")).toBeVisible();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    await user.click(
      screen.getByRole("button", { name: "Cerrar detalle del reporte" })
    );
    expect(
      screen.getByRole("dialog", { name: "Detalle del baneo" })
    ).toBeVisible();
  });

  it("muestra el vencimiento para un desbaneo automático", async () => {
    obtenerDetalleBaneo.mockResolvedValue({
      ...BANEO,
      status: "expired",
      end_reason: "expired",
      ended_by_username: null,
    });
    render(<ModalHistorialSancionesComponent baneoId={2} onClose={vi.fn()} />);
    expect(
      await screen.findByText(/desbaneado automáticamente por vencimiento/i)
    ).toBeVisible();
    const finalizacion = screen.getByRole("region", {
      name: "Finalización del baneo",
    });
    expect(finalizacion).toHaveTextContent(
      "El baneo finalizó por vencimiento el"
    );
    expect(finalizacion).not.toHaveTextContent("@moderadora");
  });

  it("muestra la apelación asociada con imágenes y permite volver desde su detalle", async () => {
    const user = userEvent.setup();
    obtenerDetalleBaneo.mockResolvedValue({
      ...BANEO,
      appeal: APELACION,
      end_reason: "appeal",
    });
    render(
      <ModalHistorialSancionesComponent
        baneoId={2}
        miId={1}
        onClose={vi.fn()}
        onResuelta={vi.fn()}
      />
    );
    expect(await screen.findByText("Apelo este baneo")).toBeVisible();
    expect(
      screen.getByRole("img", { name: "Imagen 1 de la apelación del baneo" })
    ).toHaveAttribute("src", "https://cdn.test/appeal.png");
    await user.click(
      screen.getByRole("button", { name: "Ver detalle de la apelación" })
    );
    expect(
      await screen.findByRole("dialog", { name: "Detalle de la apelación" })
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Volver al detalle anterior" })
    );
    expect(
      await screen.findByRole("dialog", { name: "Detalle del baneo" })
    ).toBeVisible();
  });

  it("permite revisar los baneos anteriores del jugador desde una apelación", async () => {
    const user = userEvent.setup();
    render(
      <ModalHistorialSancionesComponent
        apelacionId={3}
        miId={1}
        onClose={vi.fn()}
        onResuelta={vi.fn()}
      />
    );
    const historial = await screen.findByRole("region", {
      name: "Baneos anteriores del jugador",
    });
    expect(
      await within(historial).findByText("Sanción anterior")
    ).toBeVisible();
    expect(within(historial).getByText("Finalizado")).toBeVisible();
    expect(obtenerHistorialBaneos).toHaveBeenCalledWith(7, {
      antesDeBaneoId: 2,
      skip: 0,
      limit: 11,
    });
    await user.click(
      within(historial).getByRole("button", {
        name: /ver detalle del baneo 1/i,
      })
    );
    expect(obtenerDetalleBaneo).toHaveBeenCalledWith(1);
    expect(
      await screen.findByRole("dialog", { name: "Detalle del baneo" })
    ).toBeVisible();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    await user.click(
      screen.getByRole("button", { name: "Volver al detalle anterior" })
    );
    expect(
      await screen.findByRole("dialog", { name: "Detalle de la apelación" })
    ).toBeVisible();
  });

  it("permite reintentar un detalle que no se pudo cargar", async () => {
    const user = userEvent.setup();
    obtenerDetalleBaneo.mockRejectedValueOnce(new Error("Sin conexión"));
    render(<ModalHistorialSancionesComponent baneoId={2} onClose={vi.fn()} />);
    await user.click(
      await screen.findByRole("button", { name: "Volver a intentar" })
    );
    expect(
      await screen.findByRole("heading", { name: "@ana · ID 7" })
    ).toBeVisible();
  });

  it("no atribuye un registro histórico incompleto a vencimiento o a un administrador", async () => {
    obtenerDetalleBaneo.mockResolvedValue({
      ...BANEO,
      status: "unknown",
      end_reason: "unknown",
      ended_by_username: null,
    });
    render(<ModalHistorialSancionesComponent baneoId={2} onClose={vi.fn()} />);
    expect(
      await screen.findByText(/no se puede determinar si finalizó/i)
    ).toBeVisible();
    expect(screen.queryByText(/desbaneado automáticamente/i)).toBeNull();
  });
});
