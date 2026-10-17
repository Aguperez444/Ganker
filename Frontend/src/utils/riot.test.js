import { describe, expect, it } from "vitest";
import {
  esRiotIdValido,
  formatearDuracion,
  formatearPuntos,
  nombreServidor,
} from "./riot";

describe("utilidades de Riot", () => {
  it("valida el formato Nombre#TAG igual que el backend", () => {
    expect(esRiotIdValido("Faker#KR1")).toBe(true);
    expect(esRiotIdValido(" Mi Nombre#LAS ")).toBe(true);
    expect(esRiotIdValido("Faker")).toBe(false);
    expect(esRiotIdValido("ab#KR1")).toBe(false);
    expect(esRiotIdValido("Faker#K")).toBe(false);
  });

  it("muestra el nombre corto del servidor", () => {
    expect(nombreServidor("la2")).toBe("LAS");
    expect(nombreServidor("desconocido")).toBe("desconocido");
  });

  it("formatea duración y puntos", () => {
    expect(formatearDuracion(1805)).toBe("30:05");
    expect(formatearPuntos(950)).toBe("950");
    expect(formatearPuntos(60000)).toBe("60.0k");
    expect(formatearPuntos(150000)).toBe("150k");
  });
});

describe("nombreServidor con regiones de Valorant", () => {
  it("muestra el nombre de la región", () => {
    expect(nombreServidor("latam")).toBe("LATAM");
    expect(nombreServidor("ap")).toBe("Asia-Pacífico");
    expect(nombreServidor("kr")).toBe("KR");
  });
});
