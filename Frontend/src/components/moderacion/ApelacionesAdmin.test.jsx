import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buscarApelaciones,
  obtenerApelacion,
  resolverApelacion,
} from "../../api/apelacionesApi";
import {
  buscarDenuncias,
  obtenerHistorialBaneos,
} from "../../api/moderacionApi";
import ListaApelacionesComponent from "./ListaApelacionesComponent";

vi.mock("../../api/apelacionesApi", () => ({
  buscarApelaciones: vi.fn(),
  obtenerApelacion: vi.fn(),
  resolverApelacion: vi.fn(),
}));
vi.mock("../../api/moderacionApi", () => ({
  obtenerDenunciasCruzadas: vi.fn().mockResolvedValue({ reports: [] }),
  buscarDenuncias: vi.fn(),
  obtenerHistorialBaneos: vi.fn(),
  obtenerDetalleBaneo: vi.fn(),
}));
const APELACION = {
  id: 2,
  text: "No usé scripts",
  status: "pending",
  created_at: "2026-11-16T12:00:00Z",
  images: ["https://cdn.test/evidence.png"],
  resolved_at: null,
  ban: {
    ban_id: 3,
    user_id: 7,
    username: "ana",
    reason: "Scripts",
    active: true,
    created_at: "2026-11-15T12:00:00Z",
    expires_at: "2126-11-15T12:00:00Z",
  },
};
const REPORTE = {
  id: 8,
  reported_user_id: 7,
  reported_user_name: "ana",
  reporter_user_id: 1,
  reporter_user_name: "beto",
  reason: "cheating",
  status: "resolved",
  description: "Denuncia anterior",
  evidence_image_url: "https://cdn.test/report.png",
};

beforeEach(() => {
  vi.clearAllMocks();
  buscarApelaciones.mockResolvedValue([APELACION]);
  obtenerApelacion.mockResolvedValue(APELACION);
  buscarDenuncias.mockResolvedValue([REPORTE]);
  obtenerHistorialBaneos.mockResolvedValue([]);
  resolverApelacion.mockResolvedValue({ ...APELACION, status: "accepted" });
});

describe("Apelaciones en administración", () => {
  it.each([
    ["pending", "Pendiente"],
    ["accepted", "Aceptada"],
    ["rejected", "Rechazada"],
  ])(
    "resalta el estado %s con una etiqueta explícita",
    async (status, etiqueta) => {
      buscarApelaciones.mockResolvedValue([{ ...APELACION, status }]);
      render(<ListaApelacionesComponent miId={1} onResuelta={vi.fn()} />);
      expect(await screen.findByText(`Estado: ${etiqueta}`)).toBeVisible();
    }
  );
  it("filtra por jugador y estado y abre detalles con imágenes y denuncias previas", async () => {
    const user = userEvent.setup();
    render(<ListaApelacionesComponent miId={1} onResuelta={vi.fn()} />);
    await screen.findByRole("button", { name: "Ver apelación de @ana" });
    expect(buscarApelaciones).toHaveBeenCalledWith({
      username: "",
      estado: "",
      skip: 0,
      limit: 11,
    });
    await user.type(screen.getByLabelText("Jugador que apeló"), "@ana");
    await user.selectOptions(
      screen.getByLabelText("Estado de la apelación"),
      "pending"
    );
    await user.click(
      screen.getByRole("button", { name: "Buscar apelaciones" })
    );
    await user.click(
      await screen.findByRole("button", { name: "Ver apelación de @ana" })
    );
    expect(buscarApelaciones).toHaveBeenLastCalledWith({
      username: "ana",
      estado: "pending",
      skip: 0,
      limit: 11,
    });
    const detalle = screen.getByRole("dialog", {
      name: "Detalle de la apelación",
    });
    expect(await within(detalle).findByText("No usé scripts")).toBeVisible();
    expect(
      within(detalle).getByRole("img", { name: "Imagen 1 de la apelación" })
    ).toHaveAttribute("src", "https://cdn.test/evidence.png");
    await user.click(
      await within(detalle).findByRole("button", {
        name: /ver detalle del reporte/i,
      })
    );
    expect(await screen.findByText("Denuncia anterior")).toBeVisible();
    expect(
      screen.getByRole("img", { name: "Evidencia de la denuncia 8" })
    ).toHaveAttribute("src", "https://cdn.test/report.png");
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Banear jugador" })).toBeNull();
    await user.click(
      screen.getByRole("button", { name: /cerrar detalle del reporte/i })
    );
    expect(
      await screen.findByRole("dialog", { name: "Detalle de la apelación" })
    ).toBeVisible();
  });

  it.each(["accepted", "rejected"])(
    "exige confirmación y resuelve la apelación como %s",
    async (decision) => {
      const user = userEvent.setup();
      const onResuelta = vi.fn();
      render(<ListaApelacionesComponent miId={1} onResuelta={onResuelta} />);
      await user.click(
        await screen.findByRole("button", { name: "Ver apelación de @ana" })
      );
      await user.click(
        await screen.findByRole("button", {
          name:
            decision === "accepted"
              ? "Aceptar apelación y desbanear"
              : "Rechazar apelación",
        })
      );
      expect(resolverApelacion).not.toHaveBeenCalled();
      await user.click(
        screen.getByRole("button", { name: "Confirmar decisión" })
      );
      expect(resolverApelacion).toHaveBeenCalledWith(2, decision);
      expect(onResuelta).toHaveBeenCalledWith(decision);
      expect(screen.queryByRole("dialog")).toBeNull();
    }
  );

  it("no ofrece resolver apelaciones antiguas o ya resueltas", async () => {
    const user = userEvent.setup();
    obtenerApelacion.mockResolvedValue({
      ...APELACION,
      ban: { ...APELACION.ban, active: false },
    });
    render(<ListaApelacionesComponent miId={1} onResuelta={vi.fn()} />);
    await user.click(
      await screen.findByRole("button", { name: "Ver apelación de @ana" })
    );
    expect(
      await screen.findByText(/este baneo ya no está vigente/i)
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Aceptar apelación y desbanear" })
    ).toBeNull();
  });
});
