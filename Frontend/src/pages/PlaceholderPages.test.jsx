import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";

import EquiposPage from "./EquiposPage";
import ModeracionPage from "./admin/ModeracionPage";
import HomePage from "./HomePage";
import AdminHomePage from "./admin/AdminHomePage";

describe("Páginas placeholder para funcionalidades en desarrollo", () => {
  // BuscarJugadoresPage dejo de ser un placeholder (US 10 - Iniciar
  // conversacion privada). Su propio test vive en BuscarJugadoresPage.test.jsx.

  it("EquiposPage muestra el mensaje de funcionalidad en próximo sprint", () => {
    render(
      <MemoryRouter>
        <EquiposPage />
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
  });

  // CharactersPage dejo de ser un placeholder (Registrar/Modificar
  // personaje). Su propio test viviria en CharactersPage.test.jsx si se
  // agrega cobertura (mismo criterio que Ranks/Roles, sin tests propios).

  it("ModeracionPage muestra el mensaje de funcionalidad en próximo sprint", () => {
    render(
      <MemoryRouter>
        <ModeracionPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Moderación" })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /\[Moderación\] se implementará en un próximo sprint\.\.\./i
      )
    ).toBeInTheDocument();
  });

  it("HomePage muestra enlaces a las funcionalidades y su mensaje placeholder", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Inicio" })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/\[Inicio\] se implementará en un próximo sprint\.\.\./i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /buscar jugadores/i })
    ).toHaveAttribute("href", "/app/jugadores");

    expect(screen.getByRole("link", { name: /ver equipos/i })).toHaveAttribute(
      "href",
      "/app/equipos"
    );
  });

  it("AdminHomePage muestra enlaces a los módulos administrativos", () => {
    render(
      <MemoryRouter>
        <AdminHomePage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Panel administrativo" })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /\[Panel administrativo\] se implementará en un próximo sprint\.\.\./i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /gestionar personajes/i })
    ).toHaveAttribute("href", "/app/admin/characters");

    expect(
      screen.getByRole("link", { name: /ir a moderación/i })
    ).toHaveAttribute("href", "/app/admin/moderacion");
  });

  it("Sidebar y AdminSidebar utilizan el mismo logo de Ganker (/images/logo_svg.svg)", async () => {
    const { default: Sidebar } = await import("../components/layout/Sidebar");
    const { default: AdminSidebar } =
      await import("../components/layout/AdminSidebar");

    const { unmount: unmountUser } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const logoUser = screen.getByRole("img", { name: /logo de ganker/i });
    expect(logoUser).toHaveAttribute("src", "/images/logo_svg.svg");
    unmountUser();

    render(
      <MemoryRouter>
        <AdminSidebar />
      </MemoryRouter>
    );

    const logoAdmin = screen.getByRole("img", { name: /logo de ganker/i });
    expect(logoAdmin).toHaveAttribute("src", "/images/logo_svg.svg");
  });
});
