import { describe, expect, it } from "vitest";

import {
  LARGO_MAXIMO_DESCRIPCION_REPORTE,
  mensajeDeErrorReporte,
  nombreDeMotivoReporte,
  validarFormularioReporte,
} from "./reportesJugadores";

describe("validarFormularioReporte", () => {
  it("exige un motivo", () => {
    expect(validarFormularioReporte({ motivo: "", descripcion: "" })).toEqual({
      motivo: "Seleccioná un motivo para el reporte.",
    });
  });

  it("rechaza un motivo que no está en el catálogo", () => {
    expect(
      validarFormularioReporte({ motivo: "inventado", descripcion: "" }).motivo
    ).toBeDefined();
  });

  it("acepta un motivo válido sin descripción (es opcional)", () => {
    expect(
      validarFormularioReporte({
        motivo: "abusive_behavior",
        descripcion: "   ",
      })
    ).toEqual({});
  });

  it("rechaza una descripción demasiado larga", () => {
    const errores = validarFormularioReporte({
      motivo: "other",
      descripcion: "a".repeat(LARGO_MAXIMO_DESCRIPCION_REPORTE + 1),
    });

    expect(errores.descripcion).toBeDefined();
    expect(errores.motivo).toBeUndefined();
  });
});

describe("nombreDeMotivoReporte", () => {
  it("devuelve el label legible de un motivo conocido", () => {
    expect(nombreDeMotivoReporte("cheating")).toBe("Trampas o uso de cheats");
  });

  it("devuelve el valor original si el motivo no se reconoce", () => {
    expect(nombreDeMotivoReporte("otro")).toBe("otro");
  });
});

describe("mensajeDeErrorReporte", () => {
  it("avisa cuando no hay conexión con el servidor", () => {
    expect(mensajeDeErrorReporte({ message: "Network Error" })).toMatch(
      /conectar con el servidor/i
    );
  });

  it("traduce los códigos de error del backend", () => {
    expect(mensajeDeErrorReporte({ response: { status: 403 } })).toMatch(
      /permisos/i
    );
    expect(mensajeDeErrorReporte({ response: { status: 422 } })).toMatch(
      /motivo es obligatorio/i
    );
  });

  it("muestra la fecha del 429 en hora local, no en ISO", () => {
    const mensaje = mensajeDeErrorReporte({
      response: {
        status: 429,
        data: {
          error:
            "Ya reportaste a este jugador recientemente. Podrás volver a reportarlo a partir de 2026-10-23T18:00:00+00:00.",
        },
      },
    });

    expect(mensaje).toMatch(/^Ya reportaste a este jugador recientemente/);
    expect(mensaje).not.toMatch(/2026-10-23T/);
  });

  it("prioriza el mensaje de dominio del backend", () => {
    expect(
      mensajeDeErrorReporte({
        response: { status: 429, data: { error: "Esperá antes de reportar." } },
      })
    ).toBe("Esperá antes de reportar.");

    expect(
      mensajeDeErrorReporte({
        response: { status: 400, data: { detail: "Dato inválido." } },
      })
    ).toBe("Dato inválido.");
  });
});
