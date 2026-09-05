import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

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
});
