import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import RouteMetadata from "./RouteMetadata.jsx";

beforeEach(() => {
  document.head.innerHTML = "";
});

afterEach(() => {
  cleanup();
  document.head.innerHTML = "";
});

describe("Metadatos durante la navegación", () => {
  it("restaura la indexación y el schema al volver a la portada desde el registro", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RouteMetadata />
        <Link to="/registro">Registro</Link>
        <Link to="/">Inicio</Link>
      </MemoryRouter>
    );
    const homeTitle = document.title;
    const homeDescription = document.querySelector(
      'meta[name="description"]'
    ).content;

    await user.click(screen.getByRole("link", { name: "Registro" }));
    expect(document.title).toBe("Crear cuenta | Ganker");
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, follow"
    );
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.getElementById("site-structured-data")).toBeNull();

    await user.click(screen.getByRole("link", { name: "Inicio" }));
    expect(document.title).toBe(homeTitle);
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      homeDescription
    );
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "index, follow"
    );
    expect(document.querySelectorAll('meta[name="robots"]')).toHaveLength(1);
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://gankerweb.app/"
    );
    expect(document.querySelectorAll("#site-structured-data")).toHaveLength(1);
    expect(
      JSON.parse(document.getElementById("site-structured-data").textContent)[
        "@graph"
      ]
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "WebSite",
          name: "Ganker",
          url: "https://gankerweb.app/",
        }),
      ])
    );
  });

  it("no incluye tokens ni parámetros de recuperación en los metadatos", () => {
    render(
      <MemoryRouter initialEntries={["/reset-password?token=token-privado"]}>
        <RouteMetadata />
      </MemoryRouter>
    );
    expect(document.title).toBe("Restablecer contraseña | Ganker");
    expect(document.head.innerHTML).not.toContain("token-privado");
    expect(document.querySelector('meta[property="og:url"]')).toHaveAttribute(
      "content",
      "https://gankerweb.app/reset-password"
    );
  });
});
