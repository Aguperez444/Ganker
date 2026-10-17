import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { useCallbackFederado } from "./useCallbackFederado";
import { procesarCallbackFederado } from "../api/federatedAuthApi";
import { CLAVE_REGISTRO_FEDERADO } from "../utils/proveedoresFederados";

const { guardarSesion } = vi.hoisted(() => ({ guardarSesion: vi.fn() }));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ guardarSesion }),
}));

vi.mock("../api/federatedAuthApi", () => ({
  procesarCallbackFederado: vi.fn(),
}));

const JUGADOR = { username: "ana", role: "player" };

function renderCallback(provider, query) {
  const searchParams = new URLSearchParams(query);
  return renderHook(() => useCallbackFederado(provider, searchParams));
}

describe("useCallbackFederado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("guarda la sesión cuando la identidad ya estaba vinculada", async () => {
    procesarCallbackFederado.mockResolvedValue({
      status: "authenticated",
      provider: "google",
      access_token: "a",
      refresh_token: "r",
      token_type: "bearer",
    });
    guardarSesion.mockResolvedValue(JUGADOR);

    const { result } = renderCallback("google", "code=c1&state=s1");

    await waitFor(() => expect(result.current.estado).toBe("autenticado"));
    expect(result.current.usuario).toEqual(JUGADOR);
    expect(procesarCallbackFederado).toHaveBeenCalledWith("google", {
      state: "s1",
      code: "c1",
      openidParams: null,
    });
    expect(guardarSesion).toHaveBeenCalledWith({
      access_token: "a",
      refresh_token: "r",
      token_type: "bearer",
    });
  });

  it("deja los datos en sessionStorage cuando hay que completar el registro", async () => {
    const respuesta = {
      status: "needs_registration",
      provider: "discord",
      registration_token: "tok",
      suggested_username: "ana",
    };
    procesarCallbackFederado.mockResolvedValue(respuesta);

    const { result } = renderCallback("discord", "code=c&state=s");

    await waitFor(() => expect(result.current.estado).toBe("registro"));
    expect(result.current.datosFederados).toEqual(respuesta);
    expect(JSON.parse(sessionStorage.getItem(CLAVE_REGISTRO_FEDERADO))).toEqual(
      respuesta
    );
    expect(guardarSesion).not.toHaveBeenCalled();
  });

  it("manda los parámetros openid.* de Steam tal cual", async () => {
    procesarCallbackFederado.mockResolvedValue({
      status: "needs_registration",
    });

    renderCallback(
      "steam",
      "state=s&openid.mode=id_res&openid.claimed_id=https%3A%2F%2Fsteamcommunity.com%2Fopenid%2Fid%2F1"
    );

    await waitFor(() => expect(procesarCallbackFederado).toHaveBeenCalled());
    expect(procesarCallbackFederado).toHaveBeenCalledWith("steam", {
      state: "s",
      code: null,
      openidParams: {
        "openid.mode": "id_res",
        "openid.claimed_id": "https://steamcommunity.com/openid/id/1",
      },
    });
  });

  it("marca error sin llamar al backend si el usuario canceló en el proveedor", async () => {
    const { result } = renderCallback("discord", "error=access_denied&state=s");

    await waitFor(() => expect(result.current.estado).toBe("error"));
    expect(result.current.errorMensaje).toMatch(/se canceló/i);
    expect(procesarCallbackFederado).not.toHaveBeenCalled();
  });

  it("marca error si falta el state", async () => {
    const { result } = renderCallback("google", "code=c");

    await waitFor(() => expect(result.current.estado).toBe("error"));
    expect(result.current.errorMensaje).toMatch(/incompleta/i);
  });

  it("muestra el mensaje del backend si rechaza el callback", async () => {
    procesarCallbackFederado.mockRejectedValue({
      response: { status: 400, data: { error: "State inválido o vencido." } },
    });

    const { result } = renderCallback("twitch", "code=c&state=s");

    await waitFor(() => expect(result.current.estado).toBe("error"));
    expect(result.current.errorMensaje).toBe("State inválido o vencido.");
  });
});
