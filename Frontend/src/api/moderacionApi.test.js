import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "./axiosClient";
import { obtenerJugadoresBaneados, reportarJugador } from "./moderacionApi";

vi.mock("./axiosClient", () => ({
  default: { post: vi.fn(), get: vi.fn() },
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

describe("obtenerJugadoresBaneados - US 53", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pide los baneos vigentes al endpoint nuevo y devuelve la lista", async () => {
    const jugadores = [
      { user_id: 7, username: "ana", reason: "Cheats", expires_at: null },
    ];
    axiosClient.get.mockResolvedValue({ data: { players: jugadores } });

    await expect(obtenerJugadoresBaneados({ username: "an" })).resolves.toEqual(
      jugadores
    );
    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/moderation/banned-players/active",
      { params: { username: "an", skip: 0, limit: 100 } }
    );
  });

  it("no manda el filtro de username si está vacío", async () => {
    axiosClient.get.mockResolvedValue({ data: { players: [] } });

    await obtenerJugadoresBaneados({ username: "" });

    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/moderation/banned-players/active",
      { params: { username: undefined, skip: 0, limit: 100 } }
    );
  });
});
