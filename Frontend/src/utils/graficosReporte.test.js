import { describe, it, expect } from "vitest";

import {
  COLORES_CATEGORIAS,
  COLOR_OTROS,
  armarComparacion,
} from "./graficosReporte";

const item = (name, count, variation = null) => ({
  name,
  count,
  variation,
  variation_percentage: null,
  trend: null,
});

describe("utils/graficosReporte - armarComparacion", () => {
  it("calcula proporciones que suman 1 aunque los porcentajes se superpongan", () => {
    const { ultimo } = armarComparacion([item("Oro", 6), item("Plata", 4)]);

    expect(ultimo.map((s) => s.proporcion)).toEqual([0.6, 0.4]);
  });

  it("agrupa todo lo que pasa de 5 categorías en Otros", () => {
    const items = ["A", "B", "C", "D", "E", "F", "G"].map((n, i) =>
      item(n, 10 - i)
    );
    const { ultimo, leyenda } = armarComparacion(items);

    expect(ultimo).toHaveLength(6);
    expect(ultimo.at(-1)).toMatchObject({
      nombre: "Otros",
      valor: 5 + 4,
      color: COLOR_OTROS,
    });
    expect(leyenda.at(-1).nombre).toBe("Otros (2)");
  });

  it("mantiene el color de cada categoría en la torta anterior", () => {
    const { ultimo, anterior } = armarComparacion(
      [item("LoL", 7, 2), item("Valorant", 5, 1)],
      [item("Valorant", 4), item("LoL", 5), item("CS2", 1)]
    );

    expect(ultimo.map((s) => [s.nombre, s.color])).toEqual([
      ["LoL", COLORES_CATEGORIAS[0]],
      ["Valorant", COLORES_CATEGORIAS[1]],
    ]);
    // Mismo orden y colores; lo que ya no esta entre las principales, a Otros.
    expect(anterior.map((s) => [s.nombre, s.color, s.valor])).toEqual([
      ["LoL", COLORES_CATEGORIAS[0], 5],
      ["Valorant", COLORES_CATEGORIAS[1], 4],
      ["Otros", COLOR_OTROS, 1],
    ]);
  });
});
