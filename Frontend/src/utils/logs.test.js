import { describe, it, expect, vi, afterEach } from "vitest";

import { logError, resumirError } from "./logs";

describe("logs", () => {
  afterEach(() => vi.restoreAllMocks());

  const errorAxios = {
    isAxiosError: true,
    message: "Request failed with status code 403",
    config: {
      method: "post",
      url: "/api/v1/teams/3/transfer-leadership/2",
      headers: { Authorization: "Bearer token-secreto" },
    },
    response: { status: 403, data: { error: "No sos el líder" } },
  };

  it("resume un error de axios sin incluir sus headers", () => {
    expect(resumirError(errorAxios)).toEqual({
      metodo: "POST",
      url: "/api/v1/teams/3/transfer-leadership/2",
      status: 403,
      mensaje: "No sos el líder",
    });
  });

  it("nunca imprime el token en la consola", () => {
    const espia = vi.spyOn(console, "error").mockImplementation(() => {});

    logError("Error al transferir:", errorAxios);

    expect(JSON.stringify(espia.mock.calls)).not.toContain("token-secreto");
  });

  it("para errores comunes deja solo el mensaje", () => {
    expect(resumirError(new Error("algo falló"))).toBe("algo falló");
  });
});
