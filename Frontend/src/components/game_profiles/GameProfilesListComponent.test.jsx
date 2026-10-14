import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import GameProfilesListComponent from "./GameProfilesListComponent";

const PERFIL_LOL = {
  game_profile_id: 10,
  videogame: { id: 2, name: "League of Legends", icon_url: null },
  characters: [],
  role_profiles: [],
  region: null,
  in_game_name: "Ana#LAS",
};

describe("GameProfilesListComponent", () => {
  it("'Ver' abre el perfil y 'Modificar' lo edita", async () => {
    const usuario = userEvent.setup();
    const onView = vi.fn();
    const onEdit = vi.fn();
    render(
      <GameProfilesListComponent
        profiles={[PERFIL_LOL]}
        onEdit={onEdit}
        onView={onView}
      />
    );

    expect(screen.getByText(/Ana#LAS/)).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Ver" }));
    expect(onView).toHaveBeenCalledWith(PERFIL_LOL);

    await usuario.click(screen.getByRole("button", { name: "Modificar" }));
    expect(onEdit).toHaveBeenCalledWith(PERFIL_LOL);
  });

  it("sin onView no muestra 'Ver'", () => {
    render(
      <GameProfilesListComponent profiles={[PERFIL_LOL]} onEdit={vi.fn()} />
    );

    expect(screen.queryByRole("button", { name: "Ver" })).toBeNull();
  });
});
