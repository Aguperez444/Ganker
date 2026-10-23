import { describe, it, expect } from "vitest";
import {
  esAdmin,
  rutaInicialPara,
  rutaPerfilJugador,
  ROLES_ADMIN,
  rolesQuePuedeRegistrar,
} from "./rutas";

// El backend manda el rol en MINUSCULA: el enum UserRole vale "owner",
// "admin" y "player". Compararlo en mayuscula falla en silencio.
describe("roles y ruta inicial", () => {
  it("usa los mismos valores que el enum del backend", () => {
    expect(ROLES_ADMIN).toEqual(["admin", "owner"]);
  });

  it("reconoce admin y owner", () => {
    expect(esAdmin({ role: "admin" })).toBe(true);
    expect(esAdmin({ role: "owner" })).toBe(true);
  });

  it("no toma al jugador como admin", () => {
    expect(esAdmin({ role: "player" })).toBe(false);
    expect(esAdmin(null)).toBe(false);
    expect(esAdmin({})).toBe(false);
  });

  it("tolera que el rol venga en mayuscula", () => {
    expect(esAdmin({ role: "ADMIN" })).toBe(true);
  });

  it("manda al admin al panel y al jugador a su home", () => {
    expect(rutaInicialPara({ role: "admin" })).toBe("/app/admin");
    expect(rutaInicialPara({ role: "owner" })).toBe("/app/admin");
    expect(rutaInicialPara({ role: "player" })).toBe("/app");
    expect(rutaInicialPara(null)).toBe("/app");
  });
});

describe("rutaPerfilJugador", () => {
  it("arma la ruta al perfil de otro jugador", () => {
    expect(rutaPerfilJugador(7)).toBe("/app/jugadores/7");
  });

  it("preselecciona el videojuego si se indica", () => {
    expect(rutaPerfilJugador(7, 2)).toBe("/app/jugadores/7?juego=2");
    expect(rutaPerfilJugador(7, "")).toBe("/app/jugadores/7");
  });
});

describe("rolesQuePuedeRegistrar - US 39", () => {
  it("devuelve los roles de su jerarquía o inferior", () => {
    expect(rolesQuePuedeRegistrar({ role: "owner" })).toEqual([
      "player",
      "admin",
      "owner",
    ]);
    expect(rolesQuePuedeRegistrar({ role: "admin" })).toEqual([
      "player",
      "admin",
    ]);
    expect(rolesQuePuedeRegistrar({ role: "player" })).toEqual([]);
    expect(rolesQuePuedeRegistrar(null)).toEqual([]);
  });
});
