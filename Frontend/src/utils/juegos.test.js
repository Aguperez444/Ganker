import { describe, expect, it } from "vitest";
import { portadaDeJuego, rolConMejorRango } from "./juegos";

describe("portadaDeJuego", () => {
  it.each([
    ["Valorant", "/images/games/valorant.webp"],
    ["League of Legends", "/images/games/lol.webp"],
    ["Counter Strike 2", "/images/games/cs2.webp"],
    ["CS2", "/images/games/cs2.webp"],
    ["LoL", "/images/games/lol.webp"],
    ["Overwatch", "/images/games/ow.webp"],
  ])("%s usa la portada de la landing", (nombre, imagen) => {
    expect(portadaDeJuego(nombre)?.imagen).toBe(imagen);
  });

  it("devuelve null para juegos sin portada o sin nombre", () => {
    expect(portadaDeJuego("Rocket League")).toBeNull();
    expect(portadaDeJuego("Dota 2")).toBeNull();
    expect(portadaDeJuego("")).toBeNull();
    expect(portadaDeJuego(undefined)).toBeNull();
  });
});

describe("rolConMejorRango", () => {
  const rol = (id, valor) => ({
    role_profile_id: id,
    role: { name: `Rol ${id}` },
    rank: { name: `Rango ${valor}`, value: valor },
  });

  it("elige el rol con el rango de mayor valor", () => {
    const perfil = { role_profiles: [rol(1, 10), rol(2, 13), rol(3, 11)] };
    expect(rolConMejorRango(perfil).role_profile_id).toBe(2);
  });

  it("devuelve null si el perfil no tiene roles con rango", () => {
    expect(rolConMejorRango({ role_profiles: [] })).toBeNull();
    expect(rolConMejorRango({ role_profiles: [{ rank: null }] })).toBeNull();
    expect(rolConMejorRango(null)).toBeNull();
  });
});
