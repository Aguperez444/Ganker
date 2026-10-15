import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import IntegrantesEquipoComponent from "./IntegrantesEquipoComponent";

const perfil = {
  region_name: "LAS",
  active_role_profile: { role_name: "Mid", rank_name: "Oro" },
};

const integrantes = [
  {
    team_member_role_id: 1,
    user_id: 1,
    username: "lider",
    is_leader: true,
    is_vacant: false,
    icon_url: "",
    active_game_profile: perfil,
  },
  {
    team_member_role_id: 2,
    user_id: 2,
    username: "pepe",
    is_leader: false,
    is_vacant: false,
    icon_url: "",
    active_game_profile: perfil,
  },
  {
    team_member_role_id: 3,
    user_id: null,
    username: "Libre",
    is_leader: false,
    is_vacant: true,
    icon_url: "",
    active_game_profile: perfil,
  },
];

describe("IntegrantesEquipoComponent", () => {
  it("no muestra el botón Expulsar si no recibe onExpulsar", () => {
    render(<IntegrantesEquipoComponent integrantes={integrantes} />);

    expect(
      screen.queryByRole("button", { name: "Expulsar" })
    ).not.toBeInTheDocument();
  });

  it("solo ofrece expulsar a integrantes que no son el líder ni vacantes", () => {
    render(
      <IntegrantesEquipoComponent
        integrantes={integrantes}
        onExpulsar={vi.fn()}
      />
    );

    expect(screen.getAllByRole("button", { name: "Expulsar" })).toHaveLength(1);
  });

  it("avisa qué integrante se eligió para expulsar", async () => {
    const onExpulsar = vi.fn();
    render(
      <IntegrantesEquipoComponent
        integrantes={integrantes}
        onExpulsar={onExpulsar}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Expulsar" }));

    expect(onExpulsar).toHaveBeenCalledWith(integrantes[1]);
  });
});

describe("IntegrantesEquipoComponent - íconos de rol y rango", () => {
  it("muestra el ícono del rol y del rango al lado de cada integrante", () => {
    const { container } = render(
      <IntegrantesEquipoComponent
        integrantes={[
          {
            team_member_role_id: 1,
            user_id: 1,
            username: "pepe",
            is_leader: false,
            is_vacant: false,
            icon_url: "",
            active_game_profile: {
              region_name: "LAS",
              active_role_profile: {
                role_id: 10,
                role_name: "Mid",
                rank_name: "Oro",
                rank_icon_url: "/media/ranks/oro.png",
              },
            },
          },
        ]}
        iconosDeRoles={{ 10: "/media/roles/mid.png" }}
      />
    );

    const fuentes = [...container.querySelectorAll("img")].map((img) =>
      img.getAttribute("src")
    );
    expect(fuentes.some((src) => src.endsWith("/media/roles/mid.png"))).toBe(
      true
    );
    expect(fuentes.some((src) => src.endsWith("/media/ranks/oro.png"))).toBe(
      true
    );
    expect(screen.getByText("Mid")).toBeInTheDocument();
    expect(screen.getByText("Oro")).toBeInTheDocument();
  });
});
