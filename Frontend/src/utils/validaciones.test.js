import { describe, it, expect } from "vitest";

import {
  validarFormularioNuevaContrasena,
  validarFormularioRecuperarContrasena,
  validarFormularioReenviarConfirmacion,
  validarFormularioRegistro,
  validarFormularioRegistroFederado,
} from "./validaciones";

describe("validarFormularioRegistro - contraseña", () => {
  const conPassword = (password) =>
    validarFormularioRegistro({
      nombre: "Ana",
      username: "ana",
      mail: "ana@ejemplo.com",
      password,
      confirmarPassword: password,
    });

  // Misma regla que el backend (PasswordSecurityService): al menos 8.
  it("acepta exactamente 8 caracteres con mayúscula, minúscula y número", () => {
    expect(conPassword("Abcdefg1")).toEqual({});
  });

  it("rechaza 7 caracteres", () => {
    expect(conPassword("Abcdef1").password).toBe(
      "Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número."
    );
  });
});

describe("US 34 - validarFormularioRecuperarContrasena", () => {
  it("exige un email con formato válido", () => {
    expect(validarFormularioRecuperarContrasena({ email: "" }).email).toBe(
      "Ingresá tu email."
    );
    expect(
      validarFormularioRecuperarContrasena({ email: "no-es-mail" }).email
    ).toBe("El email no tiene un formato válido.");
    expect(
      validarFormularioRecuperarContrasena({ email: "ana@ejemplo.com" })
    ).toEqual({});
  });
});

describe("validarFormularioReenviarConfirmacion", () => {
  it("exige un email con formato válido", () => {
    expect(validarFormularioReenviarConfirmacion({ email: "" }).email).toBe(
      "Ingresá tu email."
    );
    expect(
      validarFormularioReenviarConfirmacion({ email: "no-es-mail" }).email
    ).toBe("El email no tiene un formato válido.");
    expect(
      validarFormularioReenviarConfirmacion({ email: "ana@ejemplo.com" })
    ).toEqual({});
  });
});

describe("US 34 - validarFormularioNuevaContrasena", () => {
  const conPassword = (password) =>
    validarFormularioNuevaContrasena({ password, confirmarPassword: password });

  it("acepta 8 caracteres con mayúscula, minúscula y número", () => {
    expect(conPassword("Abcdefg1")).toEqual({});
  });

  it.each([
    ["menos de 8 caracteres", "Abcde1"],
    ["sin mayúscula", "abcdefg1"],
    ["sin minúscula", "ABCDEFG1"],
    ["sin número", "Abcdefgh"],
  ])("rechaza una contraseña %s", (_caso, password) => {
    expect(conPassword(password).password).toMatch(/al menos 8 caracteres/);
  });

  it("exige que la confirmación coincida", () => {
    expect(
      validarFormularioNuevaContrasena({
        password: "Abcdefg1",
        confirmarPassword: "Abcdefg2",
      }).confirmarPassword
    ).toBe("Las contraseñas no coinciden.");
  });
});

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
