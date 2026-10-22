import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderPageMetadata } from "./seo.config.js";

const template = readFileSync("index.html", "utf8");

function pageAt(path) {
  return new DOMParser().parseFromString(
    renderPageMetadata(template, path),
    "text/html"
  );
}

describe("Metadatos en el HTML antes de ejecutar JavaScript", () => {
  it("mantiene la portada indexable con canonical y la identificación del sitio", () => {
    const page = pageAt("/");
    expect(page.querySelectorAll("title")).toHaveLength(1);
    expect(page.querySelector('meta[name="robots"]').content).toBe(
      "index, follow"
    );
    expect(
      page.querySelector('link[rel="canonical"]').getAttribute("href")
    ).toBe("https://gankerweb.app/");
    const data = JSON.parse(
      page.querySelector("#site-structured-data").textContent
    );
    expect(data["@graph"].map((item) => item["@type"])).toEqual([
      "WebSite",
      "WebApplication",
    ]);
  });

  it.each([
    ["/login", "Iniciar sesión | Ganker"],
    ["/registro", "Crear cuenta | Ganker"],
    ["/recuperar-contrasena", "Recuperar contraseña | Ganker"],
    ["/reset-password", "Restablecer contraseña | Ganker"],
    ["/auth/callback/discord", "Conectando tu cuenta | Ganker"],
    ["/app", "Mi inicio | Ganker"],
    ["/app/equipos/crear", "Crear equipo | Ganker"],
    ["/app/equipos/mi-equipo", "Mi equipo | Ganker"],
    ["/app/equipos/12", "Detalle de equipo | Ganker"],
    ["/app/admin/reportes/uso", "Reportes de uso | Ganker"],
    ["/app/ruta-inventada", "Página no encontrada | Ganker"],
    ["/url-inventada", "Página no encontrada | Ganker"],
  ])("%s se sirve con título propio y noindex", (path, title) => {
    const page = pageAt(path);
    expect(page.title).toBe(title);
    expect(page.querySelectorAll('meta[name="robots"]')).toHaveLength(1);
    expect(page.querySelector('meta[name="robots"]').content).toBe(
      "noindex, follow"
    );
    expect(page.querySelector('link[rel="canonical"]')).toBeNull();
    expect(page.querySelector('script[type="application/ld+json"]')).toBeNull();
    expect(page.querySelector('meta[property="og:title"]').content).toBe(title);
  });
});
