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

  // El reporte viaja como multipart/form-data para poder adjuntar la imagen.
  const formDataEnviado = () => {
    const [url, formData, config] = axiosClient.post.mock.calls[0];
    expect(url).toBe("/api/v1/moderation/");
    expect(config.headers["Content-Type"]).toBe("multipart/form-data");
    return formData;
  };

  it("envía el reporte al endpoint de moderación con el contrato del backend", async () => {
    await reportarJugador({
      reportedId: 7,
      motivo: "abusive_behavior",
      descripcion: "  Insultó a otros jugadores.  ",
    });

    const formData = formDataEnviado();
    expect(formData.get("reported_id")).toBe("7");
    expect(formData.get("reason")).toBe("abusive_behavior");
    expect(formData.get("description")).toBe("Insultó a otros jugadores.");
    expect(formData.has("evidence_image")).toBe(false);
    expect(formData.has("evidence_video_url")).toBe(false);
  });

  it("manda una descripción vacía cuando no se escribió nada", async () => {
    await reportarJugador({ reportedId: "7", motivo: "other" });

    expect(formDataEnviado().get("description")).toBe("");
  });

  it("adjunta la imagen y el link de YouTube como evidencia", async () => {
    const imagen = new File(["png"], "captura.png", { type: "image/png" });

    await reportarJugador({
      reportedId: 7,
      motivo: "cheating",
      imagen,
      linkVideo: "  https://youtu.be/dQw4w9WgXcQ  ",
    });

    const formData = formDataEnviado();
    expect(formData.get("evidence_image").name).toBe("captura.png");
    expect(formData.get("evidence_video_url")).toBe(
      "https://youtu.be/dQw4w9WgXcQ"
    );
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
