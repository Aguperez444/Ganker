import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";

describe("App", () => {
  it("renderiza la pantalla inicial", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /ganker/i })
    ).toBeInTheDocument();
  });
});
