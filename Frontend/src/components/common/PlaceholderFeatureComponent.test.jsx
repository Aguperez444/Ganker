import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import PlaceholderFeatureComponent from "./PlaceholderFeatureComponent";

describe("PlaceholderFeatureComponent", () => {
  it("renderiza el título y el mensaje con el formato esperado", () => {
    render(
      <MemoryRouter>
        <PlaceholderFeatureComponent
          funcionalidad="Equipos"
          titulo="Equipos"
          descripcion="Gestión de equipos"
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Equipos" })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /\[Equipos\] se implementará en un próximo sprint\.\.\./i
      )
    ).toBeInTheDocument();

    expect(screen.getByText("Gestión de equipos")).toBeInTheDocument();
  });

  it("renderiza el botón de retorno con la ruta adecuada", () => {
    render(
      <MemoryRouter>
        <PlaceholderFeatureComponent
          funcionalidad="Personajes"
          volverRuta="/app/admin"
          volverTexto="Volver al panel"
        />
      </MemoryRouter>
    );

    const botonVolver = screen.getByRole("link", { name: "Volver al panel" });
    expect(botonVolver).toHaveAttribute("href", "/app/admin");
  });
});
