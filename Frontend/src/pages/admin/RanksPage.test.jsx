import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";

import RanksPage from "./RanksPage";
import { getGames } from "../../api/gameApi";
import { deleteRank, getRanksByGame, updateRank } from "../../api/rankApi";

vi.mock("../../api/gameApi", () => ({ getGames: vi.fn() }));
vi.mock("../../api/rankApi", () => ({
  getRanksByGame: vi.fn(),
  createRank: vi.fn(),
  updateRank: vi.fn(),
  deleteRank: vi.fn(),
}));

const RANGOS = [
  { rank_id: 1, name: "Bronce", value: 1, icon_url: "/media/ranks/b.png" },
  { rank_id: 2, name: "Oro", value: 3, icon_url: "/media/ranks/o.png" },
];

async function elegirJuego(usuario, etiqueta, nombreJuego) {
  const disparador = await screen.findByLabelText(etiqueta);
  await waitFor(() => expect(disparador).toBeEnabled());
  await usuario.click(disparador);
  const lista = within(disparador.parentElement).getByRole("list");
  await usuario.click(within(lista).getByText(nombreJuego));
}

async function abrirRangosDeLol(usuario) {
  render(<RanksPage />);
  await elegirJuego(usuario, "Ver rangos de", "League of Legends");
  await screen.findByText("Oro");
}

function filaDe(nombre) {
  return screen.getByText(nombre).closest("li");
}

describe("RanksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGames.mockResolvedValue([
      { id: 1, name: "League of Legends", rank_per_role: true },
    ]);
    getRanksByGame.mockResolvedValue(RANGOS);
  });

  it("modifica el valor de un rango precargando sus datos actuales", async () => {
    const usuario = userEvent.setup();
    updateRank.mockResolvedValue({});
    await abrirRangosDeLol(usuario);

    await usuario.click(
      within(filaDe("Oro")).getByRole("button", { name: "Modificar" })
    );

    expect(screen.getByLabelText(/Nombre del rango/)).toHaveValue("Oro");
    const valor = screen.getByLabelText(/Valor jerárquico/);
    expect(valor).toHaveValue(3);
    expect(screen.getByLabelText(/^Videojuego/)).toBeDisabled();

    await usuario.clear(valor);
    await usuario.type(valor, "4");
    await usuario.click(
      screen.getByRole("button", { name: "GUARDAR CAMBIOS" })
    );

    expect(updateRank).toHaveBeenCalledWith(2, {
      name: "Oro",
      value: 4,
      icon: null,
    });
    expect(
      await screen.findByText(/Rango "Oro" modificado correctamente/)
    ).toBeInTheDocument();
  });

  it("explica por qué no se puede eliminar el único rango en uso", async () => {
    const usuario = userEvent.setup();
    deleteRank.mockRejectedValue({
      response: {
        status: 400,
        data: {
          error:
            "No es posible eliminar el rango con id 2 porque tiene perfiles asociados y no existe otro rango en el videojuego para reasignarlos.",
        },
      },
    });
    await abrirRangosDeLol(usuario);

    await usuario.click(
      within(filaDe("Oro")).getByRole("button", { name: "Eliminar" })
    );
    await usuario.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Eliminar",
      })
    );

    expect(deleteRank).toHaveBeenCalledWith(2);
    expect(
      await screen.findByText(/es el único rango del videojuego/)
    ).toBeInTheDocument();
  });
});
