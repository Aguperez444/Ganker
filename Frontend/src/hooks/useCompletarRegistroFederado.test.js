import { act, renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { useCompletarRegistroFederado } from "./useCompletarRegistroFederado";
import { completarRegistroFederado } from "../api/federatedAuthApi";
import { CLAVE_REGISTRO_FEDERADO } from "../utils/proveedoresFederados";

vi.mock("../api/federatedAuthApi", () => ({
  completarRegistroFederado: vi.fn(),
}));

const DATOS = {
  status: "needs_registration",
  provider: "discord",
  registration_token: "token-reg",
  suggested_username: "ana_sugerida",
  suggested_name: "Ana Discord",
  email: "ana@ejemplo.com",
};

const TOKENS = { access_token: "a", refresh_token: "r", token_type: "bearer" };

const eventoSubmit = { preventDefault: vi.fn() };

describe("useCompletarRegistroFederado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("precarga los valores sugeridos por el proveedor", () => {
    const { result } = renderHook(() =>
      useCompletarRegistroFederado({ datosFederados: DATOS })
    );

    expect(result.current.datosFederados).toEqual(DATOS);
    expect(result.current.valores).toEqual({
      username: "ana_sugerida",
      nombre: "Ana Discord",
      mail: "ana@ejemplo.com",
    });
  });

  it("recupera los datos de sessionStorage si se perdió el location.state", () => {
    sessionStorage.setItem(CLAVE_REGISTRO_FEDERADO, JSON.stringify(DATOS));

    const { result } = renderHook(() => useCompletarRegistroFederado(null));

    expect(result.current.datosFederados).toEqual(DATOS);
  });

  it("devuelve datosFederados null si no hay token de registro", () => {
    sessionStorage.setItem(CLAVE_REGISTRO_FEDERADO, "{no es json");

    const { result } = renderHook(() => useCompletarRegistroFederado(null));

    expect(result.current.datosFederados).toBeNull();
  });

  it("no llama al backend si el formulario es inválido", async () => {
    const { result } = renderHook(() =>
      useCompletarRegistroFederado({ datosFederados: DATOS })
    );

    act(() => result.current.handleChange("username", "   "));
    let tokens;
    await act(async () => {
      tokens = await result.current.handleSubmit(eventoSubmit);
    });

    expect(tokens).toBeNull();
    expect(result.current.errores.username).toBeDefined();
    expect(completarRegistroFederado).not.toHaveBeenCalled();
  });

  it("devuelve los tokens y limpia sessionStorage al completar el registro", async () => {
    sessionStorage.setItem(CLAVE_REGISTRO_FEDERADO, JSON.stringify(DATOS));
    completarRegistroFederado.mockResolvedValue(TOKENS);
    const { result } = renderHook(() => useCompletarRegistroFederado(null));

    act(() => result.current.handleChange("username", "ana_elegido"));
    let tokens;
    await act(async () => {
      tokens = await result.current.handleSubmit(eventoSubmit);
    });

    expect(tokens).toEqual(TOKENS);
    expect(completarRegistroFederado).toHaveBeenCalledWith({
      registrationToken: "token-reg",
      username: "ana_elegido",
      nombre: "Ana Discord",
      mail: "ana@ejemplo.com",
    });
    expect(sessionStorage.getItem(CLAVE_REGISTRO_FEDERADO)).toBeNull();
  });

  it("asigna el 409 de username al campo correspondiente", async () => {
    completarRegistroFederado.mockRejectedValue({
      response: { status: 409, data: { error: "El username ya está en uso." } },
    });
    const { result } = renderHook(() =>
      useCompletarRegistroFederado({ datosFederados: DATOS })
    );

    await act(async () => {
      await result.current.handleSubmit(eventoSubmit);
    });

    expect(result.current.errores.username).toBe("El username ya está en uso.");
    expect(result.current.errorServidor).toBeNull();
  });

  it("muestra un error general ante otros fallos", async () => {
    completarRegistroFederado.mockRejectedValue({ response: { status: 500 } });
    const { result } = renderHook(() =>
      useCompletarRegistroFederado({ datosFederados: DATOS })
    );

    await act(async () => {
      await result.current.handleSubmit(eventoSubmit);
    });

    expect(result.current.errorServidor).toMatch(/no se pudo completar/i);
  });

  it("cancelar borra el registro pendiente", () => {
    sessionStorage.setItem(CLAVE_REGISTRO_FEDERADO, JSON.stringify(DATOS));
    const { result } = renderHook(() => useCompletarRegistroFederado(null));

    act(() => result.current.cancelar());

    expect(sessionStorage.getItem(CLAVE_REGISTRO_FEDERADO)).toBeNull();
  });
});
