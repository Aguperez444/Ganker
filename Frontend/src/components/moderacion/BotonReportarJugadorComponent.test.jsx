import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BotonReportarJugadorComponent from "./BotonReportarJugadorComponent";
import { reportarJugador } from "../../api/moderacionApi";

vi.mock("../../api/moderacionApi", () => ({
  reportarJugador: vi.fn(),
}));

vi.mock("../../utils/logs", () => ({
  logError: vi.fn(),
}));

const ANA = { user_id: 7, username: "ana", name: "Ana" };

function renderBoton(props = {}) {
  return render(
    <BotonReportarJugadorComponent jugador={ANA} currentUserId={1} {...props} />
  );
}

async function abrirModal(usuario) {
  await usuario.click(screen.getByRole("button", { name: /reportar a ana/i }));
  return screen.getByRole("dialog");
}

describe("BotonReportarJugadorComponent - US 35", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reportarJugador.mockResolvedValue({ id: 55 });
  });

  it("no muestra la opción para reportarse a uno mismo", () => {
    renderBoton({ currentUserId: 7 });

    expect(screen.queryByRole("button", { name: /reportar/i })).toBeNull();
  });

  it("no muestra la opción si el jugador no tiene id", () => {
    renderBoton({ jugador: { username: "sin-id" } });

    expect(screen.queryByRole("button", { name: /reportar/i })).toBeNull();
  });

  it("abre el formulario y exige un motivo", async () => {
    const usuario = userEvent.setup();
    renderBoton();

    await abrirModal(usuario);
    await usuario.click(
      screen.getByRole("button", { name: /revisar reporte/i })
    );

    expect(
      screen.getByText("Seleccioná un motivo para el reporte.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Confirmar reporte")).toBeNull();
  });

  it("permite cancelar antes de enviar", async () => {
    const usuario = userEvent.setup();
    renderBoton();

    await abrirModal(usuario);
    await usuario.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("pide confirmación y permite volver al formulario", async () => {
    const usuario = userEvent.setup();
    renderBoton();

    await abrirModal(usuario);
    await usuario.selectOptions(
      screen.getByLabelText(/motivo del reporte/i),
      "abusive_behavior"
    );
    await usuario.type(
      screen.getByLabelText(/descripción/i),
      "Insultó a todos."
    );
    await usuario.click(
      screen.getByRole("button", { name: /revisar reporte/i })
    );

    expect(
      screen.getByRole("heading", { name: "Confirmar reporte" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Toxicidad o comportamiento abusivo")
    ).toBeInTheDocument();
    expect(screen.getByText("Insultó a todos.")).toBeInTheDocument();
    expect(reportarJugador).not.toHaveBeenCalled();

    await usuario.click(screen.getByRole("button", { name: /volver/i }));

    expect(
      screen.getByRole("heading", { name: "Reportar a ana" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/motivo del reporte/i)).toHaveValue(
      "abusive_behavior"
    );
  });

  it("envía el reporte y muestra el mensaje de éxito", async () => {
    const usuario = userEvent.setup();
    renderBoton();

    await abrirModal(usuario);
    await usuario.selectOptions(
      screen.getByLabelText(/motivo del reporte/i),
      "cheating"
    );
    await usuario.click(
      screen.getByRole("button", { name: /revisar reporte/i })
    );
    await usuario.click(
      screen.getByRole("button", { name: /confirmar y enviar/i })
    );

    expect(
      await screen.findByRole("heading", { name: "Reporte enviado" })
    ).toBeInTheDocument();
    expect(screen.getByText(/fue enviado exitosamente/i)).toBeInTheDocument();
    expect(reportarJugador).toHaveBeenCalledWith({
      reportedId: 7,
      motivo: "cheating",
      descripcion: "",
    });
  });

  it("si el backend rechaza un reporte repetido (429), muestra el aviso", async () => {
    reportarJugador.mockRejectedValue({
      response: {
        status: 429,
        data: {
          error:
            "Ya reportaste a este jugador recientemente. Podrás volver a reportarlo a partir de 2026-10-23T18:00:00+00:00.",
        },
      },
    });
    const usuario = userEvent.setup();
    renderBoton();

    await abrirModal(usuario);
    await usuario.selectOptions(
      screen.getByLabelText(/motivo del reporte/i),
      "spamming"
    );
    await usuario.click(
      screen.getByRole("button", { name: /revisar reporte/i })
    );
    await usuario.click(
      screen.getByRole("button", { name: /confirmar y enviar/i })
    );

    expect(
      await screen.findByText(/Ya reportaste a este jugador recientemente/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/2026-10-23T/)).toBeNull();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
