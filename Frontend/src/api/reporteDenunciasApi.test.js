import { beforeEach, expect, it, vi } from "vitest";
import axiosClient from "./axiosClient";
import { obtenerReporteDenuncias } from "./reportesApi";
import { reportarJugador } from "./moderacionApi";

vi.mock("./axiosClient", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

it("consulta el informe con sus fechas y límite de ranking", async () => {
  axiosClient.get.mockResolvedValue({ data: { reports: { total: 3 } } });
  const params = { start_date: "2026-11-01T00:00:00Z", ranking_limit: 25 };
  expect(await obtenerReporteDenuncias(params)).toEqual({
    reports: { total: 3 },
  });
  expect(axiosClient.get).toHaveBeenCalledWith(
    "/api/v1/reports/moderation-summary",
    { params }
  );
});

it("adjunta el juego seleccionado al formulario multipart de denuncia", async () => {
  axiosClient.post.mockResolvedValue({ data: { report_id: 1 } });
  await reportarJugador({ reportedId: 2, motivo: "cheating", videogameId: 3 });
  expect(axiosClient.post.mock.calls[0][1].get("videogame_id")).toBe("3");
});
