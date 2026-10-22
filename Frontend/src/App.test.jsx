import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import userEvent from "@testing-library/user-event";

// AuthProvider vive en main.jsx, fuera de App, asi que en los tests hay que
// reponerlo a mano: sin el, PublicOnlyRoute revienta al llamar a useAuth().
vi.mock("./api/jugadoresApi", () => ({
  registrarJugador: vi.fn(),
  obtenerJugadorActual: vi.fn(),
}));

describe("App", () => {
  it("renderiza la pantalla inicial", () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );
    expect(
      screen.getByRole("heading", { name: /ganker/i })
    ).toBeInTheDocument();
  });

  it.each([
    "/pagina-inexistente",
    "/app/ruta-inventada",
    "/auth/callback/google/no-existe",
  ])("muestra 404 en %s y permite volver al inicio", async (path) => {
    window.history.replaceState({}, "", path);
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Esta partida no existe" })
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe(path);
    expect(document.title).toBe("Página no encontrada | Ganker");
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, follow"
    );

    await userEvent
      .setup()
      .click(screen.getByRole("link", { name: "Volver al inicio" }));
    expect(window.location.pathname).toBe("/");
    expect(
      screen.getByRole("heading", { name: /ganker/i })
    ).toBeInTheDocument();
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "index, follow"
    );
  });
});
