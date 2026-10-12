import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import RangoPermitidoComponent from "./RangoPermitidoComponent";

const BRONCE = { rank_id: 1, name: "Bronce", icon_url: "/media/bronce.png" };
const DIAMANTE = {
  rank_id: 5,
  name: "Diamante",
  icon_url: "/media/diamante.png",
};

describe("RangoPermitidoComponent", () => {
  it("muestra los dos rangos con sus íconos", () => {
    const { container } = render(
      <RangoPermitidoComponent rangoMinimo={BRONCE} rangoMaximo={DIAMANTE} />
    );

    expect(screen.getByText("Bronce")).toBeInTheDocument();
    expect(screen.getByText("Diamante")).toBeInTheDocument();
    expect(container.querySelectorAll("img")).toHaveLength(2);
  });

  it("si el mínimo y el máximo son el mismo rango lo muestra una sola vez", () => {
    const { container } = render(
      <RangoPermitidoComponent rangoMinimo={BRONCE} rangoMaximo={BRONCE} />
    );

    expect(screen.getAllByText("Bronce")).toHaveLength(1);
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });
});
