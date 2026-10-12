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
