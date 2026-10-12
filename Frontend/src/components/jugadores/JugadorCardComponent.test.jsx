import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import JugadorCardComponent from "./JugadorCardComponent";

const ORO = { rank_id: 3, name: "Oro", icon_url: null };
const PLATA = { rank_id: 2, name: "Plata", icon_url: null };

const jugador = {
  user_id: 5,
  username: "pepe",
  name: "Pepe",
  icon_url: null,
  last_connection: null,
};

function renderTarjeta(perfilJuego) {
  return render(
    <JugadorCardComponent
      jugador={jugador}
      currentUserId={1}
      onEnviarMensaje={() => {}}
      perfilJuego={perfilJuego}
    />
  );
}

const roleProfiles = (rangoAdc, rangoJungla) => [
  {
    role_profile_id: 1,
    role: { role_id: 1, name: "ADC", icon_url: null },
    rank: rangoAdc,
  },
  {
    role_profile_id: 2,
    role: { role_id: 2, name: "Jungla", icon_url: null },
    rank: rangoJungla,
  },
];

describe("JugadorCardComponent - rangos del perfil", () => {
  it("en juegos con un único rango por perfil lo muestra una sola vez", () => {
    renderTarjeta({
      characters: [],
      role_profiles: roleProfiles(ORO, ORO),
      rangoPorRol: false,
    });

    expect(screen.getAllByText("Oro")).toHaveLength(1);
    expect(screen.getByText("ADC")).toBeInTheDocument();
    expect(screen.getByText("Jungla")).toBeInTheDocument();
  });

  it("en juegos con rango por rol muestra el rango de cada rol", () => {
    renderTarjeta({
      characters: [],
      role_profiles: roleProfiles(ORO, PLATA),
      rangoPorRol: true,
    });

    expect(screen.getByText("Oro")).toBeInTheDocument();
    expect(screen.getByText("Plata")).toBeInTheDocument();
  });
});
