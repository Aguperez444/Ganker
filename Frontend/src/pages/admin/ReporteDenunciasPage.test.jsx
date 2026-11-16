import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import ReporteDenunciasPage from "./ReporteDenunciasPage";
import { obtenerReporteDenuncias } from "../../api/reportesApi";
import {
  buscarDenuncias,
  obtenerHistorialBaneos,
  obtenerDetalleBaneo,
  desestimarDenuncia,
} from "../../api/moderacionApi";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ tokens: null }),
}));
vi.mock("../../api/moderacionApi", () => ({
  buscarDenuncias: vi.fn(),
  obtenerHistorialBaneos: vi.fn(),
  obtenerDetalleBaneo: vi.fn(),
  desestimarDenuncia: vi.fn(),
  obtenerDenunciasCruzadas: vi.fn().mockResolvedValue({ reports: [] }),
}));

vi.mock("../../api/reportesApi", () => ({ obtenerReporteDenuncias: vi.fn() }));

const REPORTE = {
  generated_at: "2026-11-16T12:00:00Z",
  start_date: null,
  end_date: "2026-11-16T12:00:00Z",
  ranking_limit: 10,
  reports: {
    total: 3,
    pending: 1,
    resolved: 1,
    dismissed: 1,
    reported_players: 2,
    reporters: 2,
    with_evidence: 2,
    without_game: 1,
    reasons: [
      { key: "cheating", count: 2 },
      { key: "other", count: 1 },
    ],
    games: [
      { videogame_id: 1, name: "League of Legends", count: 2 },
      { videogame_id: null, name: "Sin juego especificado", count: 1 },
    ],
    top_players: [
      { user_id: 1, username: "juan", count: 2, reporters: 2, deleted: false },
      {
        user_id: 2,
        username: "Cuenta eliminada",
        count: 1,
        reporters: 1,
        deleted: true,
      },
    ],
  },
  bans: {
    total: 2,
    active: 1,
    finalized: 1,
    banned_players: 1,
    repeat_offenders: 1,
    outcomes: [
      { key: "active", count: 1 },
      { key: "appeal", count: 1 },
    ],
    top_players: [
      { user_id: 1, username: "juan", count: 2, repeat_offender: true },
    ],
  },
  appeals: { total: 1, pending: 0, accepted: 1, rejected: 0 },
  activity: [{ month: "2026-11", reports: 3, bans: 2 }],
};

const DENUNCIA = {
  id: 33,
  reported_user_id: 1,
  reported_user_name: "juan",
  reporter_user_id: 9,
  reporter_user_name: "pepe",
  reason: "cheating",
  status: "pending",
  description: "Evidencia de insultos",
  evidence_image_url: "/media/prueba.png",
  created_at: "2026-11-01T12:00:00Z",
};
const BANEO = {
  id: 22,
  user_id: 1,
  username: "juan",
  reason: "Insultos reiterados",
  status: "expired",
  created_at: "2026-11-02T12:00:00Z",
  expires_at: "2026-11-03T12:00:00Z",
  end_reason: "expired",
  appeal: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  obtenerReporteDenuncias.mockResolvedValue(REPORTE);
  buscarDenuncias.mockResolvedValue([DENUNCIA]);
  obtenerHistorialBaneos.mockResolvedValue([BANEO]);
  obtenerDetalleBaneo.mockResolvedValue(BANEO);
  desestimarDenuncia.mockResolvedValue({ id: 33, status: "rejected" });
});

function mostrar() {
  render(
    <MemoryRouter>
      <ReporteDenunciasPage />
    </MemoryRouter>
  );
}

it("centraliza gráficos, juegos, rankings y sanciones en apartados separados", async () => {
  mostrar();
  expect(
    await screen.findByRole("heading", { name: "Denuncias", exact: true })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Baneos", exact: true })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("img", { name: /^Motivos de denuncia\./ })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("img", { name: /^Situación de los baneos\./ })
  ).toBeInTheDocument();
  expect(screen.getByText("League of Legends")).toBeInTheDocument();
  expect(screen.getByText("Sin juego especificado")).toBeInTheDocument();
  const ranking = screen.getByRole("table", {
    name: "Jugadores con más denuncias",
  });
  const filas = within(ranking).getAllByRole("row");
  expect(within(filas[1]).getByRole("rowheader")).toHaveTextContent("@juan");
  expect(within(filas[2]).getByRole("rowheader")).toHaveTextContent(
    "Cuenta eliminada"
  );
  expect(
    screen.getByRole("heading", { name: "Apelaciones", exact: true })
  ).toBeInTheDocument();
  const apelaciones = screen.getByRole("region", {
    name: "Apelaciones",
    exact: true,
  });
  expect(
    within(apelaciones).getByRole("img", {
      name: /^Estado de las apelaciones\./,
    })
  ).toBeVisible();
  expect(
    within(apelaciones).getByRole("link", { name: /Ver apelaciones/ })
  ).toHaveAttribute(
    "href",
    "/app/admin/moderacion?vista=apelaciones#sanciones"
  );
  expect(screen.getByText("Administración · Moderación")).toBeVisible();
  expect(
    screen.queryByRole("navigation", { name: "Tipos de reporte" })
  ).toBeNull();
  expect(
    screen.getByRole("button", { name: "Ver denuncias de cuenta eliminada" })
  ).toBeDisabled();
});

it("abre las denuncias del jugador y su evidencia conservando el informe al volver", async () => {
  const usuario = userEvent.setup();
  mostrar();
  await usuario.click(
    await screen.findByRole("button", { name: "Ver denuncias de @juan" })
  );
  expect(
    await screen.findByRole("dialog", { name: "Reportes de @juan" })
  ).toBeVisible();
  expect(buscarDenuncias).toHaveBeenCalledWith({
    denunciadoId: 1,
    skip: 0,
    limit: 11,
  });
  await usuario.click(
    await screen.findByRole("button", {
      name: "Ver detalle del reporte de @pepe a @juan",
    })
  );
  expect(screen.getByText("Evidencia de insultos")).toBeVisible();
  expect(
    screen.getByRole("img", { name: "Evidencia de la denuncia 33" })
  ).toBeVisible();
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
  await usuario.click(
    screen.getByRole("button", { name: "Volver a los reportes del jugador" })
  );
  await usuario.click(
    screen.getByRole("button", { name: "Cerrar denuncias del jugador" })
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(
    screen.getByRole("heading", { name: "Reporte de denuncias" })
  ).toBeVisible();
  expect(obtenerReporteDenuncias).toHaveBeenCalledTimes(1);
});

it("conserva la página de denuncias al regresar del detalle", async () => {
  buscarDenuncias.mockImplementation(({ skip }) =>
    Promise.resolve(
      skip === 0
        ? Array.from({ length: 11 }, (_, i) => ({ ...DENUNCIA, id: i + 1 }))
        : [DENUNCIA]
    )
  );
  const usuario = userEvent.setup();
  mostrar();
  await usuario.click(
    await screen.findByRole("button", { name: "Ver denuncias de @juan" })
  );
  await usuario.click(await screen.findByRole("button", { name: "Siguiente" }));
  await usuario.click(
    await screen.findByRole("button", {
      name: "Ver detalle del reporte de @pepe a @juan",
    })
  );
  await usuario.click(
    screen.getByRole("button", { name: "Volver a los reportes del jugador" })
  );
  expect(await screen.findByText("Página 2")).toBeVisible();
  expect(buscarDenuncias).toHaveBeenLastCalledWith({
    denunciadoId: 1,
    skip: 10,
    limit: 11,
  });
});

it("abre los baneos del jugador y conserva su página al regresar del detalle", async () => {
  obtenerHistorialBaneos.mockImplementation((id, { skip }) =>
    Promise.resolve(
      skip === 0
        ? Array.from({ length: 11 }, (_, i) => ({ ...BANEO, id: i + 1 }))
        : [BANEO]
    )
  );
  const usuario = userEvent.setup();
  mostrar();
  await usuario.click(
    await screen.findByRole("button", { name: "Ver baneos de @juan" })
  );
  expect(
    await screen.findByRole("dialog", { name: "Baneos de @juan" })
  ).toBeVisible();
  await usuario.click(await screen.findByRole("button", { name: "Siguiente" }));
  await usuario.click(
    await screen.findByRole("button", {
      name: "Ver detalle del baneo 22 de @juan",
    })
  );
  expect(
    await screen.findByText(/Desbaneado automáticamente por vencimiento/)
  ).toBeVisible();
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
  await usuario.click(
    screen.getByRole("button", { name: "Volver al detalle anterior" })
  );
  expect(await screen.findByText("Página 2")).toBeVisible();
  expect(obtenerHistorialBaneos).toHaveBeenLastCalledWith(1, {
    antesDeBaneoId: undefined,
    skip: 10,
    limit: 11,
  });
  await usuario.click(
    screen.getByRole("button", { name: "Cerrar baneos del jugador" })
  );
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("actualiza los indicadores después de desestimar desde el ranking", async () => {
  const usuario = userEvent.setup();
  mostrar();
  await usuario.click(
    await screen.findByRole("button", { name: "Ver denuncias de @juan" })
  );
  await usuario.click(
    await screen.findByRole("button", {
      name: "Ver detalle del reporte de @pepe a @juan",
    })
  );
  await usuario.click(
    screen.getByRole("button", { name: "Desestimar denuncia" })
  );
  await usuario.click(
    screen.getByRole("button", { name: "Confirmar desestimación" })
  );
  expect(
    await screen.findByText("Denuncia desestimada. No se aplicó ningún baneo.")
  ).toBeVisible();
  await waitFor(() => expect(obtenerReporteDenuncias).toHaveBeenCalledTimes(2));
  expect(obtenerReporteDenuncias.mock.calls[1][0]).toEqual(
    obtenerReporteDenuncias.mock.calls[0][0]
  );
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("aplica todo el historial y cambia el tamaño de los rankings", async () => {
  const usuario = userEvent.setup();
  mostrar();
  await screen.findByRole("heading", { name: "Denuncias", exact: true });
  await usuario.click(
    screen.getByRole("button", { name: "Todo el historial" })
  );
  await usuario.selectOptions(
    screen.getByLabelText("Jugadores por ranking"),
    "25"
  );
  await usuario.click(screen.getByRole("button", { name: "Generar reporte" }));
  await waitFor(() =>
    expect(obtenerReporteDenuncias).toHaveBeenLastCalledWith({
      ranking_limit: 25,
    })
  );
});

it("rechaza fechas invertidas sin consultar el backend", async () => {
  const usuario = userEvent.setup();
  mostrar();
  await screen.findByRole("heading", { name: "Denuncias", exact: true });
  // user-event reproduce los controles de fecha mediante la cadena ISO.
  const { fireEvent } = await import("@testing-library/react");
  fireEvent.change(screen.getByLabelText("Desde"), {
    target: { value: "2026-11-20" },
  });
  fireEvent.change(screen.getByLabelText("Hasta (inclusive)"), {
    target: { value: "2026-11-01" },
  });
  await usuario.click(screen.getByRole("button", { name: "Generar reporte" }));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "La fecha inicial no puede ser posterior a la final."
  );
  expect(obtenerReporteDenuncias).toHaveBeenCalledTimes(1);
});

it("permite reintentar si falla la consulta", async () => {
  obtenerReporteDenuncias.mockRejectedValueOnce(new Error("falló"));
  const usuario = userEvent.setup();
  mostrar();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "No se pudo generar el reporte"
  );
  await usuario.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(
    await screen.findByRole("heading", { name: "Denuncias", exact: true })
  ).toBeInTheDocument();
});

it("muestra un informe vacío sin gráficos ni porcentajes inválidos", async () => {
  obtenerReporteDenuncias.mockResolvedValue({
    ...REPORTE,
    reports: {
      total: 0,
      pending: 0,
      resolved: 0,
      dismissed: 0,
      reported_players: 0,
      reporters: 0,
      with_evidence: 0,
      without_game: 0,
      reasons: [],
      games: [],
      top_players: [],
    },
    bans: {
      total: 0,
      active: 0,
      finalized: 0,
      banned_players: 0,
      repeat_offenders: 0,
      outcomes: [],
      top_players: [],
    },
    appeals: { total: 0, pending: 0, accepted: 0, rejected: 0 },
    activity: [],
  });
  mostrar();
  expect(
    await screen.findByText("Sin actividad en este período.")
  ).toBeInTheDocument();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(document.body).not.toHaveTextContent("NaN");
});
