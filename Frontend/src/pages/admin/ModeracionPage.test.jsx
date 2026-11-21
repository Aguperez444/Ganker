import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  banearJugador,
  buscarBaneos,
  buscarDenuncias,
  obtenerDetalleBaneo,
  desestimarDenuncia,
} from "../../api/moderacionApi";
import ModeracionPage from "./ModeracionPage";
import { buscarApelaciones } from "../../api/apelacionesApi";
import { MemoryRouter } from "react-router-dom";
import { obtenerReporteDenuncias } from "../../api/reportesApi";

vi.mock("../../api/reportesApi", () => ({ obtenerReporteDenuncias: vi.fn() }));

function mostrar(ruta = "/app/admin/moderacion") {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ModeracionPage />
    </MemoryRouter>
  );
}

vi.mock("../../api/apelacionesApi", () => ({ buscarApelaciones: vi.fn() }));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ tokens: null }),
}));
vi.mock("../../api/moderacionApi", () => ({
  obtenerDenunciasCruzadas: vi.fn().mockResolvedValue({ reports: [] }),
  buscarBaneos: vi.fn(),
  buscarDenuncias: vi.fn(),
  desbanearJugador: vi.fn(),
  banearJugador: vi.fn(),
  obtenerDetalleBaneo: vi.fn(),
  desestimarDenuncia: vi.fn(),
}));

describe("ModeracionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerReporteDenuncias.mockResolvedValue({
      reports: { total: 30, pending: 4 },
      bans: { active: 2 },
      appeals: { pending: 1 },
    });
    buscarBaneos.mockResolvedValue([]);
    buscarApelaciones.mockResolvedValue([]);
    buscarDenuncias.mockResolvedValue([]);
  });

  it("recarga las denuncias al desestimar y no crea un baneo", async () => {
    const user = userEvent.setup();
    buscarDenuncias.mockResolvedValueOnce([
      {
        id: 5,
        reported_user_id: 7,
        reported_user_name: "ana",
        reporter_user_id: 2,
        reporter_user_name: "beto",
        reason: "cheating",
        status: "pending",
      },
    ]);
    desestimarDenuncia.mockResolvedValue({ id: 5, status: "rejected" });
    mostrar();
    await user.click(
      await screen.findByRole("button", { name: /ver detalle del reporte/i })
    );
    await user.click(
      screen.getByRole("button", { name: "Desestimar denuncia" })
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar desestimación" })
    );
    expect(
      await screen.findByText(
        /denuncia desestimada. no se aplicó ningún baneo/i
      )
    ).toBeVisible();
    expect(buscarDenuncias).toHaveBeenCalledTimes(2);
    expect(banearJugador).not.toHaveBeenCalled();
    expect(buscarBaneos).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(obtenerReporteDenuncias).toHaveBeenCalledTimes(2)
    );
  });

  it("abre el detalle desde el listado de baneos", async () => {
    const user = userEvent.setup();
    buscarBaneos.mockResolvedValue([
      {
        id: 3,
        banned_user_id: 7,
        banned_user_username: "ana",
        banned_by_user_id: 1,
        banned_by_user_username: "admin",
        reason: "Scripts",
        date_created: "2026-11-01T12:00:00Z",
        date_expire: "2026-11-02T12:00:00Z",
      },
    ]);
    obtenerDetalleBaneo.mockResolvedValue({
      id: 3,
      user_id: 7,
      username: "ana",
      banned_by_username: "admin",
      reason: "Scripts",
      created_at: "2026-11-01T12:00:00Z",
      expires_at: "2026-11-02T12:00:00Z",
      status: "expired",
      appeal: null,
    });
    mostrar();
    await user.click(
      await screen.findByRole("button", {
        name: "Ver detalle del baneo 3 de @ana",
      })
    );
    expect(
      await screen.findByText(/desbaneado automáticamente por vencimiento/i)
    ).toBeVisible();
    expect(obtenerDetalleBaneo).toHaveBeenCalledWith(3);
    await user.click(
      screen.getByRole("button", { name: "Cerrar detalle del baneo" })
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("actualiza las denuncias y los baneos al terminar una sanción desde un reporte", async () => {
    const user = userEvent.setup();
    buscarDenuncias.mockResolvedValueOnce([
      {
        id: 1,
        reported_user_id: 7,
        reported_user_name: "ana",
        reporter_user_id: 2,
        reporter_user_name: "beto",
        reason: "cheating",
        status: "pending",
      },
    ]);
    banearJugador.mockResolvedValue("Jugador baneado exitosamente");
    mostrar();
    await user.click(
      await screen.findByRole("button", { name: /ver detalle/i })
    );
    await user.click(screen.getByRole("button", { name: "Banear jugador" }));
    await user.type(
      screen.getByLabelText(/motivo o justificación/i),
      "Uso reiterado de scripts"
    );
    await user.click(screen.getByRole("button", { name: "Permanente" }));
    await user.click(screen.getByRole("button", { name: "Enviar sanción" }));
    await user.click(screen.getByRole("button", { name: "Confirmar baneo" }));
    await screen.findByRole("dialog", { name: "Jugador baneado" });
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    await waitFor(() => expect(buscarDenuncias).toHaveBeenCalledTimes(2));
    expect(buscarBaneos).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/@ana fue baneado correctamente/i)).toBeVisible();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("muestra primero las denuncias y luego los baneos, sin el buscador para banear", async () => {
    mostrar();
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((titulo) => titulo.textContent)
    ).toEqual([
      "Resumen de moderación",
      "Denuncias a jugadores",
      "Jugadores baneados",
    ]);
    expect(
      screen.queryByRole("heading", { name: "Banear jugador" })
    ).toBeNull();
    expect(screen.queryByLabelText("Nombre de usuario")).toBeNull();
    expect(
      await screen.findByText("No hay denuncias registradas.")
    ).toBeVisible();
    expect(buscarBaneos).toHaveBeenCalled();
    expect(buscarDenuncias).toHaveBeenCalled();
  });

  it("permite alternar entre el historial de baneos y quienes iniciaron una apelación", async () => {
    const user = userEvent.setup();
    mostrar();
    await user.click(screen.getByRole("button", { name: "Ver apelaciones" }));
    expect(
      await screen.findByText(
        "No hay apelaciones que coincidan con la búsqueda."
      )
    ).toBeVisible();
    expect(screen.queryByLabelText("Jugador baneado")).toBeNull();
    expect(buscarApelaciones).toHaveBeenCalledWith({
      username: "",
      estado: "",
      skip: 0,
      limit: 11,
    });
    await user.click(screen.getByRole("button", { name: "Todos los baneos" }));
    expect(screen.getByLabelText("Jugador baneado")).toBeVisible();
  });

  it("muestra un resumen histórico y acceso al informe antes de los listados", async () => {
    mostrar();
    const resumen = screen.getByRole("region", {
      name: "Resumen de moderación",
    });
    expect(await within(resumen).findByText("30")).toBeVisible();
    expect(within(resumen).getByText("4")).toBeVisible();
    expect(within(resumen).getByText("2")).toBeVisible();
    expect(within(resumen).getByText("1")).toBeVisible();
    expect(
      within(resumen).getByRole("link", { name: /Ver reporte completo/ })
    ).toHaveAttribute("href", "/app/admin/moderacion/reporte");
    expect(obtenerReporteDenuncias).toHaveBeenCalledWith({ ranking_limit: 1 });
  });

  it("abre la vista de apelaciones al entrar desde su apartado del informe", async () => {
    mostrar("/app/admin/moderacion?vista=apelaciones#sanciones");
    expect(
      screen.getByRole("button", { name: "Ver apelaciones" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      await screen.findByLabelText("Estado de la apelación")
    ).toBeVisible();
    expect(screen.queryByLabelText("Jugador baneado")).toBeNull();
  });

  it("mantiene el acceso al informe si falla el resumen y permite reintentarlo", async () => {
    obtenerReporteDenuncias.mockRejectedValueOnce(new Error("Sin conexión"));
    const user = userEvent.setup();
    mostrar();
    expect(
      await screen.findByText("No se pudo cargar el resumen de moderación.")
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Ver reporte completo/ })
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Reintentar resumen" })
    );
    expect(await screen.findByText("30")).toBeVisible();
  });
});
