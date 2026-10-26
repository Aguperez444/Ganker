import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import AdminHomePage from "./AdminHomePage";
import useGames from "../../hooks/useGames";
import { useBuscarBaneos } from "../../hooks/useBuscarBaneos";
import { useResumenReportes } from "../../hooks/useResumenReportes";

vi.mock("../../hooks/useGames", () => ({ default: vi.fn() }));
vi.mock("../../hooks/useBuscarBaneos", () => ({ useBuscarBaneos: vi.fn() }));
vi.mock("../../hooks/useResumenReportes", () => ({
  useResumenReportes: vi.fn(),
}));

const EN_UN_MES = new Date(Date.now() + 30 * 86400000).toISOString();
const HACE_UN_MES = new Date(Date.now() - 30 * 86400000).toISOString();

function baneo(id, username, expiresAt) {
  return {
    id,
    user_id: id + 100,
    username,
    admin_id: 3,
    admin_username: "admin_user",
    created_at: HACE_UN_MES,
    expires_at: expiresAt,
    reason: "Lenguaje ofensivo",
  };
}

function renderPagina() {
  render(
    <MemoryRouter>
      <AdminHomePage />
    </MemoryRouter>
  );
}

describe("AdminHomePage - inicio del panel admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useResumenReportes.mockReturnValue({
      reportes: [],
      cargando: false,
      error: "",
    });
    useGames.mockReturnValue({
      games: [
        { id: 1, name: "Valorant", icon_url: "/media/valorant.png" },
        { id: 2, name: "Overwatch", icon_url: "/media/ow.png" },
      ],
      isLoading: false,
      error: "",
    });
    useBuscarBaneos.mockReturnValue({
      baneos: [
        baneo(1, "baneo_temporal", EN_UN_MES),
        baneo(2, "baneo_viejo", HACE_UN_MES),
      ],
      cargando: false,
      error: "",
    });
  });

  it("muestra el título y enlaces a los módulos administrativos", () => {
    renderPagina();

    expect(
      screen.getByRole("heading", { level: 1, name: "Panel administrativo" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /gestionar personajes/i })
    ).toHaveAttribute("href", "/app/admin/characters");
    expect(
      screen.getByRole("link", { name: /ir a moderación/i })
    ).toHaveAttribute("href", "/app/admin/moderacion");
    expect(screen.getByRole("link", { name: /ver uso/i })).toHaveAttribute(
      "href",
      "/app/admin/reportes/uso"
    );
  });

  it("lista los baneos recientes marcando vigentes y vencidos", () => {
    renderPagina();

    expect(screen.getByText("baneo_temporal")).toBeInTheDocument();
    expect(screen.getByText("baneo_viejo")).toBeInTheDocument();
    expect(screen.getByText("Vigente")).toBeInTheDocument();
    expect(screen.getByText("Vencido")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver todos/i })).toHaveAttribute(
      "href",
      "/app/admin/moderacion"
    );
  });

  it("resume videojuegos y baneos vigentes/vencidos", () => {
    renderPagina();

    expect(screen.getByText("Juegos soportados").nextSibling).toHaveTextContent(
      "2"
    );
    expect(screen.getByText("Baneos vigentes").nextSibling).toHaveTextContent(
      "1"
    );
    expect(screen.getByText("Baneos vencidos").nextSibling).toHaveTextContent(
      "1"
    );
  });

  it("si no hay baneos lo indica", () => {
    useBuscarBaneos.mockReturnValue({ baneos: [], cargando: false, error: "" });
    renderPagina();

    expect(screen.getByText("No hay baneos registrados.")).toBeInTheDocument();
  });
  it("muestra las tortas de los últimos reportes con sus principales categorías", () => {
    useResumenReportes.mockReturnValue({
      reportes: [
        {
          clave: "perfiles",
          titulo: "Perfiles por videojuego",
          unidad: "perfiles",
          resumen: { report_id: 3, start_date: null, end_date: null },
          datos: {
            items: [
              { name: "Valorant", count: 6 },
              { name: "Overwatch", count: 2 },
            ],
            total: 8,
          },
        },
      ],
      cargando: false,
      error: "",
    });
    renderPagina();

    expect(screen.getByText("Perfiles por videojuego")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Perfiles por videojuego/ })
    ).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("sin reportes generados invita a generar uno", () => {
    renderPagina();

    expect(
      screen.getByText(/Todavía no se generó ningún reporte/)
    ).toBeInTheDocument();
  });
  it("cada juego del catálogo lleva a la gestión de videojuegos", () => {
    renderPagina();

    expect(
      screen.getByRole("link", { name: "Gestionar Valorant" })
    ).toHaveAttribute("href", "/app/admin/games");
    expect(
      screen.getByRole("link", { name: "Gestionar Overwatch" })
    ).toHaveAttribute("href", "/app/admin/games");
  });
});
