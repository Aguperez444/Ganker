import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";

describe("Páginas placeholder para funcionalidades en desarrollo", () => {
  // BuscarJugadoresPage dejo de ser un placeholder (US 10 - Iniciar
  // conversacion privada). Su propio test vive en BuscarJugadoresPage.test.jsx.

  // EquiposPage dejo de ser un placeholder (US 14 - Crear equipo). Su propio
  // test vive en EquiposPage.test.jsx.

  // CharactersPage dejo de ser un placeholder (Registrar/Modificar
  // personaje). Su propio test viviria en CharactersPage.test.jsx si se
  // agrega cobertura (mismo criterio que Ranks/Roles, sin tests propios).

  // ModeracionPage dejo de ser un placeholder (US 36 - Banear jugador).
  // Ahora usa useAuth y pide el listado de baneos, asi que ya no renderiza
  // sin un AuthProvider.

  // HomePage y AdminHomePage dejaron de ser placeholders (inicio del jugador
  // y del panel admin). Sus tests viven en HomePage.test.jsx y
  // admin/AdminHomePage.test.jsx.

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
