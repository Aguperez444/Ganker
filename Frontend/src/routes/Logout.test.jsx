import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import App from "../App.jsx";
import { obtenerJugadorActual } from "../api/jugadoresApi.js";

vi.mock("../api/jugadoresApi.js", () => ({
  obtenerJugadorActual: vi.fn(),
}));

describe("Logout redirection", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    obtenerJugadorActual.mockResolvedValue({
      username: "testuser",
      name: "Test User",
      mail: "test@example.com",
      role: "player",
      profiles: [],
      icon_url: null,
    });
  });

  it("redirecciona a la landing page cuando el usuario cierra sesion desde la app", async () => {
    localStorage.setItem("access_token", "fake-token");
    localStorage.setItem("refresh_token", "fake-refresh");
    localStorage.setItem("user", JSON.stringify({ email: "test@example.com" }));

    window.history.pushState({}, "App", "/app");

    render(<App />);

    const userButton = await screen.findByRole("button", {
      name: /abrir cuenta/i,
    });
    expect(userButton).toBeInTheDocument();

    await userEvent.click(userButton);

    const logoutButton = await screen.findByRole("button", {
      name: /cerrar sesión/i,
    });
    expect(logoutButton).toBeInTheDocument();

    await userEvent.click(logoutButton);

    expect(window.location.pathname).toBe("/");
  });

  it("redirecciona a la landing page si un usuario no autenticado intenta acceder a /app", async () => {
    window.history.pushState({}, "App", "/app");

    render(<App />);

    expect(window.location.pathname).toBe("/");
  });
});
