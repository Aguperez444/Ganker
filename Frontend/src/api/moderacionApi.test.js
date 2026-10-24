import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "./axiosClient";
import { buscarBaneos, reportarJugador } from "./moderacionApi";

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

describe("buscarBaneos - Buscar jugadores baneados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("manda los filtros con los nombres del backend y devuelve la lista", async () => {
    const baneos = [{ id: 1, banned_user_username: "ana" }];
    axiosClient.get.mockResolvedValue({
      data: { list_banned_players: baneos },
    });

    await expect(
      buscarBaneos({
        usuario: "an",
        admin: "mod",
        motivo: "Cheats",
        creadoDesde: "2026-10-01T03:00:00.000Z",
        creadoHasta: "2026-10-02T02:59:59.999Z",
        vencimientoDesde: "2026-11-01T03:00:00.000Z",
        vencimientoHasta: "2026-11-02T02:59:59.999Z",
        skip: 10,
        limit: 11,
      })
    ).resolves.toEqual(baneos);
    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/moderation/banned-players",
      {
        params: {
          banned_user: "an",
          banned_by: "mod",
          reason: "Cheats",
          min_date_create: "2026-10-01T03:00:00.000Z",
          max_date_create: "2026-10-02T02:59:59.999Z",
          min_date_expire: "2026-11-01T03:00:00.000Z",
          max_date_expire: "2026-11-02T02:59:59.999Z",
          skip: 10,
          limit: 11,
        },
      }
    );
  });

  it("no manda los filtros vacíos", async () => {
    axiosClient.get.mockResolvedValue({ data: { list_banned_players: [] } });

    await buscarBaneos({ usuario: "", motivo: "" });

    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/moderation/banned-players",
      {
        params: {
          banned_user: undefined,
          banned_by: undefined,
          reason: undefined,
          min_date_create: undefined,
          max_date_create: undefined,
          min_date_expire: undefined,
          max_date_expire: undefined,
          skip: 0,
          limit: 10,
        },
      }
    );
  });
});
