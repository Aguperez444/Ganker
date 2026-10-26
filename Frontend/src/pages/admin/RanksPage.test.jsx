import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import RanksPage from "./RanksPage";
import { getGames } from "../../api/gameApi";
import {
  createRank,
  deleteRank,
  getRanksByGame,
  updateRank,
} from "../../api/rankApi";

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

// Sirve para los dos selectores de videojuego: el filtro de la lista usa
// SelectorJuegoComponent (juegos siempre visibles; el click en el grupo no
// hace nada) y el formulario IconSelectComponent (el click abre la lista).
// En ambos se espera a que carguen los juegos y se elige por texto.
async function elegirJuego(usuario, label, juego) {
  const disparador = await screen.findByLabelText(label);
  await waitFor(() => expect(disparador).toBeEnabled());
  await usuario.click(disparador);
  await usuario.click(await within(disparador.parentElement).findByText(juego));
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

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("propone el máximo más uno y lo incrementa después de registrar", async () => {
    const usuario = userEvent.setup();
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL = vi.fn(() => "blob:rank-icon");
        static revokeObjectURL = vi.fn();
      }
    );
    let rangos = [
      { rank_id: 3, name: "Platino", value: 4, icon_url: "/media/ranks/p.png" },
      ...RANGOS,
    ];
    getRanksByGame.mockImplementation(async () => rangos);
    createRank.mockImplementation(async (rank) => {
      rangos = [...rangos, { ...rank, rank_id: 4 }];
    });
    await abrirRangosDeLol(usuario);
    await usuario.click(
      screen.getByRole("button", { name: "+ Registrar rango" })
    );

    await waitFor(() =>
      expect(screen.getByLabelText(/Valor jerárquico/)).toHaveValue(5)
    );
    await usuario.type(screen.getByLabelText(/Nombre del rango/), "Diamante");
    const icon = new File(["icon"], "diamante.png", { type: "image/png" });
    await usuario.upload(screen.getByLabelText(/Ícono del rango/), icon);
    await usuario.click(
      screen.getByRole("button", { name: "REGISTRAR RANGO" })
    );

    expect(createRank).toHaveBeenCalledWith({
      videogame_id: 1,
      name: "Diamante",
      value: 5,
      icon,
    });
    await screen.findByText(/Rango "Diamante" registrado correctamente/);
    await usuario.click(
      screen.getByRole("button", { name: "+ Registrar rango" })
    );
    await waitFor(() =>
      expect(screen.getByLabelText(/Valor jerárquico/)).toHaveValue(6)
    );
  });

  it("recalcula al cambiar de juego y permite modificar el valor sugerido", async () => {
    const usuario = userEvent.setup();
    getGames.mockResolvedValue([
      { id: 1, name: "League of Legends" },
      { id: 2, name: "Overwatch" },
    ]);
    getRanksByGame.mockImplementation(async (gameId) =>
      String(gameId) === "1" ? RANGOS : []
    );
    render(<RanksPage />);
    await usuario.click(
      screen.getByRole("button", { name: "+ Registrar rango" })
    );
    await elegirJuego(usuario, /^Videojuego/, "League of Legends");
    const valor = screen.getByLabelText(/Valor jerárquico/);
    await waitFor(() => expect(valor).toHaveValue(4));

    await usuario.clear(valor);
    await usuario.type(valor, "8");
    expect(valor).toHaveValue(8);
    await elegirJuego(usuario, /^Videojuego/, "Overwatch");
    await waitFor(() => expect(valor).toHaveValue(1));
  });

  it("ignora la respuesta de un juego que ya no está seleccionado", async () => {
    const usuario = userEvent.setup();
    getGames.mockResolvedValue([
      { id: 1, name: "League of Legends" },
      { id: 2, name: "Overwatch" },
    ]);
    let resolverLol;
    getRanksByGame.mockImplementation((gameId) =>
      String(gameId) === "1"
        ? new Promise((resolve) => {
            resolverLol = resolve;
          })
        : Promise.resolve([])
    );
    render(<RanksPage />);
    await usuario.click(
      screen.getByRole("button", { name: "+ Registrar rango" })
    );
    await elegirJuego(usuario, /^Videojuego/, "League of Legends");
    expect(screen.getByLabelText(/Valor jerárquico/)).toBeDisabled();
    await elegirJuego(usuario, /^Videojuego/, "Overwatch");
    await waitFor(() =>
      expect(screen.getByLabelText(/Valor jerárquico/)).toHaveValue(1)
    );
    resolverLol(RANGOS);
    await waitFor(() =>
      expect(screen.getByLabelText(/Valor jerárquico/)).toBeEnabled()
    );
    expect(screen.getByLabelText(/Valor jerárquico/)).toHaveValue(1);
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
