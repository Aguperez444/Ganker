import { beforeEach, describe, expect, it } from "vitest";

import {
  ESPERA_ENTRE_REPORTES_MS,
  LARGO_MAXIMO_DESCRIPCION_REPORTE,
  formatearEsperaReporte,
  mensajeDeErrorReporte,
  nombreDeMotivoReporte,
  obtenerMsEsperaReporte,
  registrarReporteEnviado,
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

describe("cooldown de reportes", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("no bloquea si nunca se reportó al jugador", () => {
    expect(obtenerMsEsperaReporte(1, 7)).toBe(0);
  });

  it("bloquea durante diez minutos después de enviar el reporte", () => {
    const ahora = 1_000_000;
    registrarReporteEnviado(1, 7, ahora);

    expect(obtenerMsEsperaReporte(1, 7, ahora)).toBe(ESPERA_ENTRE_REPORTES_MS);
    expect(obtenerMsEsperaReporte(1, 7, ahora + 60_000)).toBe(
      ESPERA_ENTRE_REPORTES_MS - 60_000
    );
    expect(obtenerMsEsperaReporte(1, 7, ahora + ESPERA_ENTRE_REPORTES_MS)).toBe(
      0
    );
  });

  it("solo afecta al par reportero/reportado", () => {
    registrarReporteEnviado(1, 7);

    expect(obtenerMsEsperaReporte(1, 7)).toBeGreaterThan(0);
    expect(obtenerMsEsperaReporte(1, 8)).toBe(0);
    expect(obtenerMsEsperaReporte(2, 7)).toBe(0);
  });

  it("ignora un localStorage con datos inválidos", () => {
    localStorage.setItem("ganker_reportes_enviados", "no-es-json");

    expect(obtenerMsEsperaReporte(1, 7)).toBe(0);
  });
});

describe("formatearEsperaReporte", () => {
  it("redondea hacia arriba y usa singular para un minuto", () => {
    expect(formatearEsperaReporte(1_000)).toBe("1 minuto");
    expect(formatearEsperaReporte(60_000 + 1)).toBe("2 minutos");
    expect(formatearEsperaReporte(10 * 60_000)).toBe("10 minutos");
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
