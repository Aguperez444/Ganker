import { describe, it, expect } from "vitest";

import {
  PROVEEDORES_FEDERADOS,
  nombreProveedorFederado,
} from "./proveedoresFederados";

describe("proveedoresFederados", () => {
  it("incluye los cuatro proveedores que soporta el backend", () => {
    expect(PROVEEDORES_FEDERADOS.map((p) => p.id)).toEqual([
      "discord",
      "steam",
      "twitch",
      "google",
    ]);
  });

  it("devuelve el nombre visible del proveedor", () => {
    expect(nombreProveedorFederado("twitch")).toBe("Twitch");
  });

  it("devuelve el id tal cual si el proveedor es desconocido", () => {
    expect(nombreProveedorFederado("github")).toBe("github");
  });
});
