import { describe, it, expect } from "vitest";
import { urlDeMedia } from "./media";

describe("urlDeMedia", () => {
  it("devuelve null cuando no hay ruta", () => {
    expect(urlDeMedia(null)).toBeNull();
    expect(urlDeMedia(undefined)).toBeNull();
    expect(urlDeMedia("")).toBeNull();
  });

  it("convierte la ruta relativa del backend en absoluta", () => {
    const url = urlDeMedia("/media/users/icons/icon_example_1.png");

    // No se afirma el host: VITE_API_URL sale del .env de cada dev y ese
    // archivo no esta versionado.
    expect(url).toContain("/media/users/icons/icon_example_1.png");
    expect(url.startsWith("/")).toBe(false);
  });

  it("no duplica la barra entre el host y la ruta", () => {
    expect(urlDeMedia("/media/x.png")).not.toContain("//media");
  });

  it("deja intacta una URL que ya es absoluta", () => {
    const absoluta = "https://cdn.ganker.com/users/1.png";
    expect(urlDeMedia(absoluta)).toBe(absoluta);
  });
});
