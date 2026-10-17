import { describe, it, expect } from "vitest";

import { validarFormularioRegistroFederado } from "./validaciones";

describe("validarFormularioRegistroFederado", () => {
  const VALIDO = { nombre: "Ana", username: "ana", mail: "" };

  it("acepta el formulario sin mail (es opcional)", () => {
    expect(validarFormularioRegistroFederado(VALIDO)).toEqual({});
  });

  it("exige nombre y username", () => {
    const errores = validarFormularioRegistroFederado({
      ...VALIDO,
      nombre: " ",
      username: "",
    });

    expect(errores.nombre).toBeDefined();
    expect(errores.username).toBeDefined();
  });

  it("valida el formato del mail solo si se completó", () => {
    expect(
      validarFormularioRegistroFederado({ ...VALIDO, mail: "no-es-mail" }).mail
    ).toBeDefined();
    expect(
      validarFormularioRegistroFederado({ ...VALIDO, mail: "ana@ejemplo.com" })
    ).toEqual({});
  });
});
