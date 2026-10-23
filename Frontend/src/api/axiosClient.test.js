import { describe, it, expect, beforeEach, vi } from "vitest";
import axiosClient, { registrarOnSesionExpirada } from "./axiosClient";

// Adapter falso: responde 401 con el body indicado sin salir a la red.
function responder401(data) {
  axiosClient.defaults.adapter = (config) =>
    Promise.reject({ config, response: { status: 401, data } });
}

describe("axiosClient - interceptor de 401", () => {
  const alExpirar = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    alExpirar.mockClear();
    registrarOnSesionExpirada(alExpirar);
  });

  it("un rechazo de negocio de register_user no cierra la sesión", async () => {
    responder401({
      error:
        "El usuario con ID 1 y rol admin no está autorizado para registrar un usuario con rol owner.",
    });

    await expect(
      axiosClient.post("/api/v1/users/register_user", {})
    ).rejects.toMatchObject({ response: { status: 401 } });
    expect(alExpirar).not.toHaveBeenCalled();
  });

  it("un token vencido en register_user sí intenta renovar la sesión", async () => {
    responder401({ error: "Token inválido: Signature has expired" });

    await expect(
      axiosClient.post("/api/v1/users/register_user", {})
    ).rejects.toBeDefined();
    // Sin refresh token guardado, la renovacion falla y se cierra la sesion.
    expect(alExpirar).toHaveBeenCalledTimes(1);
  });
});
