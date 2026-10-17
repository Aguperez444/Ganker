import { describe, expect, it } from "vitest";
import { filtrarPorNombre, normalizarTexto } from "./busqueda";

const PERSONAJES = [
  { id: 1, name: "Kai'Sa" },
  { id: 2, name: "Nunu y Willump" },
  { id: 3, name: "Miss Fortune" },
];

describe("normalizarTexto", () => {
  it("ignora mayúsculas, tildes y signos", () => {
    expect(normalizarTexto("  Región Sudamérica ")).toBe("region sudamerica");
    expect(normalizarTexto("Kai'Sa")).toBe("kaisa");
    expect(normalizarTexto(null)).toBe("");
  });
});

describe("filtrarPorNombre", () => {
  it("devuelve todos si no hay texto", () => {
    expect(filtrarPorNombre(PERSONAJES, "   ")).toBe(PERSONAJES);
  });

  it("encuentra coincidencias parciales sin importar mayúsculas ni signos", () => {
    expect(filtrarPorNombre(PERSONAJES, "kaisa").map((p) => p.id)).toEqual([1]);
    expect(filtrarPorNombre(PERSONAJES, "FORT").map((p) => p.id)).toEqual([3]);
    expect(filtrarPorNombre(PERSONAJES, "u").map((p) => p.id)).toEqual([2, 3]);
  });

  it("devuelve una lista vacía si nada coincide", () => {
    expect(filtrarPorNombre(PERSONAJES, "zed")).toEqual([]);
  });
});
