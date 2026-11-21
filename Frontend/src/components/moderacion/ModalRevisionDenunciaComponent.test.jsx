import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  banearJugador,
  buscarDenuncias,
  desestimarDenuncia,
} from "../../api/moderacionApi";
import { DIAS_BANEO_PERMANENTE } from "../../utils/baneos";
import ListaDenunciasComponent from "./ListaDenunciasComponent";

vi.mock("../../api/moderacionApi", () => ({
  obtenerDenunciasCruzadas: vi.fn().mockResolvedValue({ reports: [] }),
  buscarDenuncias: vi.fn(),
  banearJugador: vi.fn(),
  desestimarDenuncia: vi.fn(),
}));
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ tokens: null }),
}));
vi.mock("../../utils/logs", () => ({ logError: vi.fn() }));

const REPORTE = {
  id: 1,
  reported_user_id: 7,
  reported_user_name: "ana",
  reporter_user_id: 2,
  reporter_user_name: "beto",
  status: "pending",
  reason: "cheating",
  description: "Uso de scripts",
  created_at: "2026-11-01T12:00:00Z",
};
const OTRO_REPORTE = {
  ...REPORTE,
  id: 2,
  reporter_user_name: "carlos",
  description: "Otra denuncia",
};

async function abrirDetalle(user, props = {}) {
  render(<ListaDenunciasComponent denuncias={[REPORTE]} {...props} />);
  await user.click(screen.getByRole("button", { name: /ver detalle/i }));
}

describe("Revisión de denuncias", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buscarDenuncias.mockResolvedValue([REPORTE, OTRO_REPORTE]);
    banearJugador.mockResolvedValue("Jugador baneado exitosamente");
    desestimarDenuncia.mockResolvedValue({ ...REPORTE, status: "rejected" });
  });

  it("busca los reportes por ID, abre su detalle y permite volver al reporte inicial", async () => {
    const user = userEvent.setup();
    await abrirDetalle(user);
    await user.click(
      screen.getByRole("button", { name: /ver otros reportes/i })
    );
    const historial = await screen.findByRole("dialog", {
      name: "Reportes de @ana",
    });
    expect(await within(historial).findByText("@carlos")).toBeVisible();
    expect(buscarDenuncias).toHaveBeenCalledWith({
      denunciadoId: 7,
      skip: 0,
      limit: 11,
    });
    expect(within(historial).queryByText("Otra denuncia")).toBeNull();
    await user.click(
      within(historial).getByRole("button", { name: /ver detalle.*carlos/i })
    );
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByText("Reporte #2")).toBeVisible();
    expect(screen.getByText("Otra denuncia")).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: /volver a los reportes/i })
    );
    expect(
      await screen.findByRole("dialog", { name: "Reportes de @ana" })
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Volver al reporte" }));
    expect(screen.getByText("Reporte #1")).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: /ver detalle/i })).toHaveFocus();
  });

  it("pagina los reportes y conserva la página al volver desde un detalle", async () => {
    const user = userEvent.setup();
    const primeraPagina = Array.from({ length: 11 }, (_, index) => ({
      ...REPORTE,
      id: index + 1,
      reporter_user_name: `reporter${index}`,
    }));
    buscarDenuncias
      .mockResolvedValueOnce(primeraPagina)
      .mockResolvedValue([OTRO_REPORTE]);
    await abrirDetalle(user);
    await user.click(
      screen.getByRole("button", { name: /ver otros reportes/i })
    );
    let historial = screen.getByRole("dialog");
    await within(historial).findByText("@reporter0");
    await user.click(
      within(historial).getByRole("button", { name: "Siguiente" })
    );
    await within(historial).findByText("@carlos");
    expect(buscarDenuncias).toHaveBeenLastCalledWith({
      denunciadoId: 7,
      skip: 10,
      limit: 11,
    });
    await user.click(
      within(historial).getByRole("button", { name: /ver detalle/i })
    );
    await user.click(
      screen.getByRole("button", { name: /volver a los reportes/i })
    );
    historial = screen.getByRole("dialog");
    expect(await within(historial).findByText("@carlos")).toBeVisible();
    expect(within(historial).getByText("Página 2")).toBeVisible();
    expect(
      within(historial).getByRole("button", { name: "Siguiente" })
    ).toBeDisabled();
  });

  it("permite reintentar si falla la búsqueda", async () => {
    const user = userEvent.setup();
    buscarDenuncias.mockRejectedValueOnce(new Error("Sin conexión"));
    await abrirDetalle(user);
    await user.click(
      screen.getByRole("button", { name: /ver otros reportes/i })
    );
    await user.click(
      await screen.findByRole("button", { name: "Volver a intentar" })
    );
    expect(
      await within(screen.getByRole("dialog")).findByText("@carlos")
    ).toBeVisible();
    expect(buscarDenuncias).toHaveBeenCalledTimes(2);
  });

  it.each([7, DIAS_BANEO_PERMANENTE])(
    "confirma un baneo de %s días al jugador del reporte",
    async (dias) => {
      const user = userEvent.setup();
      const onBaneado = vi.fn();
      await abrirDetalle(user, { onBaneado });
      await user.click(screen.getByRole("button", { name: "Banear jugador" }));
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      expect(
        screen.getByRole("dialog", { name: "Banear a ana" })
      ).toBeVisible();
      await user.type(
        screen.getByLabelText(/motivo o justificación/i),
        "Uso reiterado de scripts"
      );
      if (dias === DIAS_BANEO_PERMANENTE) {
        await user.click(screen.getByRole("button", { name: "Permanente" }));
      } else {
        await user.clear(screen.getByLabelText(/duración/i));
        await user.type(screen.getByLabelText(/duración/i), String(dias));
      }
      await user.click(screen.getByRole("button", { name: "Enviar sanción" }));
      expect(banearJugador).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "Confirmar baneo" }));
      expect(banearJugador).toHaveBeenCalledWith({
        denunciaId: REPORTE.id,
        jugadorId: 7,
        motivo: "Uso reiterado de scripts",
        duracionDias: dias === DIAS_BANEO_PERMANENTE ? dias : String(dias),
      });
      expect(
        await screen.findByRole("dialog", { name: "Jugador baneado" })
      ).toBeVisible();
      await user.click(screen.getByRole("button", { name: "Cerrar" }));
      expect(onBaneado).toHaveBeenCalledWith("@ana fue baneado correctamente.");
      expect(screen.queryByRole("dialog")).toBeNull();
    }
  );

  it("cancelar el baneo vuelve al detalle sin enviar una sanción", async () => {
    const user = userEvent.setup();
    await abrirDetalle(user);
    await user.click(screen.getByRole("button", { name: "Banear jugador" }));
    expect(screen.getByLabelText(/motivo o justificación/i)).toHaveFocus();
    await user.tab({ shift: true });
    expect(
      screen.getByRole("button", { name: "Enviar sanción" })
    ).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(
      screen.getByRole("dialog", { name: "Detalle del reporte" })
    ).toBeVisible();
    expect(banearJugador).not.toHaveBeenCalled();
  });

  it("conserva la confirmación y muestra el error si el backend rechaza el baneo", async () => {
    const user = userEvent.setup();
    const onBaneado = vi.fn();
    banearJugador.mockRejectedValueOnce({
      response: { data: { error: "Sin permisos para banear a este jugador." } },
    });
    await abrirDetalle(user, { onBaneado });
    await user.click(screen.getByRole("button", { name: "Banear jugador" }));
    await user.type(
      screen.getByLabelText(/motivo o justificación/i),
      "Uso reiterado de scripts"
    );
    await user.click(screen.getByRole("button", { name: "Enviar sanción" }));
    await user.click(screen.getByRole("button", { name: "Confirmar baneo" }));
    expect(
      await screen.findByText("Sin permisos para banear a este jugador.")
    ).toBeVisible();
    expect(
      screen.getByRole("dialog", { name: "Confirmar baneo" })
    ).toBeVisible();
    expect(onBaneado).not.toHaveBeenCalled();
  });

  it("no permite banear la propia cuenta desde el reporte", async () => {
    const user = userEvent.setup();
    await abrirDetalle(user, { miId: 7 });
    expect(
      screen.getByRole("button", { name: "Banear jugador" })
    ).toBeDisabled();
  });

  it.each(["resolved", "rejected"])(
    "no ofrece banear ni desestimar una denuncia %s",
    async (status) => {
      const user = userEvent.setup();
      await abrirDetalle(user, { denuncias: [{ ...REPORTE, status }] });
      expect(
        screen.queryByRole("button", { name: "Banear jugador" })
      ).toBeNull();
      expect(
        screen.queryByRole("button", { name: "Desestimar denuncia" })
      ).toBeNull();
      expect(screen.getByText(/esta denuncia está cerrada/i)).toBeVisible();
    }
  );

  it("confirma la desestimación y cierra la denuncia sin banear al jugador", async () => {
    const user = userEvent.setup();
    const onDesestimada = vi.fn();
    await abrirDetalle(user, { onDesestimada });
    await user.click(
      screen.getByRole("button", { name: "Desestimar denuncia" })
    );
    expect(desestimarDenuncia).not.toHaveBeenCalled();
    expect(screen.getByText(/sin banear al jugador/i)).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Confirmar desestimación" })
    );
    expect(desestimarDenuncia).toHaveBeenCalledWith(1);
    expect(banearJugador).not.toHaveBeenCalled();
    expect(onDesestimada).toHaveBeenCalledWith(
      "Denuncia desestimada. No se aplicó ningún baneo."
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("muestra el rechazo del backend si otro administrador ya cerró la denuncia", async () => {
    const user = userEvent.setup();
    desestimarDenuncia.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { error: "La denuncia ya está cerrada." },
      },
    });
    await abrirDetalle(user);
    await user.click(
      screen.getByRole("button", { name: "Desestimar denuncia" })
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar desestimación" })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La denuncia ya está cerrada."
    );
    expect(banearJugador).not.toHaveBeenCalled();
  });
});
