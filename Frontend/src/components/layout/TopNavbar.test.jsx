import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { AuthProvider, useAuth } from "../../context/AuthContext";
import TopNavbar from "./TopNavbar";
import { obtenerJugadorActual } from "../../api/jugadoresApi";

vi.mock("../../api/jugadoresApi", () => ({
  registrarJugador: vi.fn(),
  obtenerJugadorActual: vi.fn(),
  actualizarJugador: vi.fn(),
}));

vi.mock("../../api/axiosClient", () => ({
  default: { post: vi.fn(), get: vi.fn(), put: vi.fn() },
  registrarOnSesionExpirada: vi.fn(),
}));

const base = {
  name: "Alguien",
  mail: "alguien@ejemplo.com",
  profiles: [],
  icon_url: null,
};
const JUGADOR = { ...base, username: "un_player", role: "player" };
const ADMIN = { ...base, username: "admin_user", role: "admin" };

// Hace de ProtectedRoute: el navbar solo se renderiza con sesion cargada.
function ConSesion({ children }) {
  const { loading, user } = useAuth();
  if (loading || !user) return <p>cargando</p>;
  return children;
}

async function abrirMenuComo(usuario) {
  obtenerJugadorActual.mockResolvedValue(usuario);
  localStorage.setItem("access_token", "acceso");
  localStorage.setItem("refresh_token", "refresco");

  render(
    <MemoryRouter>
      <AuthProvider>
        <ConSesion>
          <TopNavbar />
        </ConSesion>
      </AuthProvider>
    </MemoryRouter>
  );

  const boton = await screen.findByRole("button", {
    name: new RegExp(usuario.username),
  });
  await userEvent.setup().click(boton);
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("menu del avatar", () => {
  it("le ofrece al admin las dos areas", async () => {
    await abrirMenuComo(ADMIN);

    expect(
      screen.getByRole("link", { name: "Panel de administración" })
    ).toHaveAttribute("href", "/app/admin");
    expect(screen.getByRole("link", { name: "Panel jugador" })).toHaveAttribute(
      "href",
      "/app"
    );
  });

  // El sidebar de jugador ya no ofrece admin, asi que este menu es el unico
  // lugar donde podria filtrarse el acceso al panel.
  it("no le muestra nada de admin al jugador", async () => {
    await abrirMenuComo(JUGADOR);

    expect(
      screen.queryByRole("link", { name: /panel de administración/i })
    ).toBeNull();
    expect(screen.queryByRole("link", { name: /panel jugador/i })).toBeNull();
    expect(screen.getByRole("link", { name: "Mi cuenta" })).toBeInTheDocument();
  });
});
