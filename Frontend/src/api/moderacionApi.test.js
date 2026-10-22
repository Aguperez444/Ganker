import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "./axiosClient";
import { reportarJugador } from "./moderacionApi";

vi.mock("./axiosClient", () => ({
  default: { post: vi.fn() },
}));

describe("reportarJugador", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axiosClient.post.mockResolvedValue({ data: { id: 1 } });
  });

  it("envía el reporte al endpoint de moderación con el contrato del backend", async () => {
    await reportarJugador({
      reportedId: 7,
      motivo: "abusive_behavior",
      descripcion: "  Insultó a otros jugadores.  ",
    });

    expect(axiosClient.post).toHaveBeenCalledWith("/api/v1/moderation/", {
      reported_id: 7,
      reason: "abusive_behavior",
      description: "Insultó a otros jugadores.",
    });
  });

  it("manda una descripción vacía cuando no se escribió nada", async () => {
    await reportarJugador({ reportedId: "7", motivo: "other" });

    expect(axiosClient.post).toHaveBeenCalledWith("/api/v1/moderation/", {
      reported_id: 7,
      reason: "other",
      description: "",
    });
  });

  it("devuelve el reporte creado", async () => {
    axiosClient.post.mockResolvedValue({ data: { id: 12 } });

    await expect(
      reportarJugador({ reportedId: 7, motivo: "spamming" })
    ).resolves.toEqual({ id: 12 });
  });
});
