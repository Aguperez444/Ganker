import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import MiEquipoPage from "./MiEquipoPage";
import {
  eliminarEquipo,
  obtenerMiEquipo,
  transferirLiderazgo,
} from "../api/teamApi";

const { chat } = vi.hoisted(() => ({
  chat: {
    conversacionActivaId: 99,
    cargarConversaciones: vi.fn(),
    cerrarConversacionActiva: vi.fn(),
  },
}));

vi.mock("../context/ChatContext", () => ({
  useChat: () => chat,
}));

vi.mock("../api/teamApi", () => ({
  obtenerMiEquipo: vi.fn(),
  expulsarIntegrante: vi.fn(),
  transferirLiderazgo: vi.fn(),
  eliminarEquipo: vi.fn(),
}));

const integrante = (userId, username, esLider) => ({
  team_member_role_id: userId * 10,
  is_vacant: false,
  is_leader: esLider,
  user_id: userId,
  username,
  icon_url: "",
  active_game_profile: {
    active_role_profile: {
      role_id: userId,
      role_name: "Mid",
      rank_name: "Oro",
    },
  },
});

const equipoComoLider = {
  team_id: 3,
  team_name: "Los Gankers",
  conversation_id: 99,
  player_count: 2,
  max_players: 2,
  videogame: { name: "League of Legends" },
  consultant_player_info: { is_member: true, is_leader: true },
  members: [integrante(1, "lider", true), integrante(2, "pepe", false)],
};

const equipoComoIntegrante = {
  ...equipoComoLider,
  consultant_player_info: { is_member: true, is_leader: false },
  members: [integrante(1, "lider", false), integrante(2, "pepe", true)],
};

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={["/app/equipos/mi-equipo"]}>
      <Routes>
        <Route path="/app/equipos/mi-equipo" element={<MiEquipoPage />} />
        <Route path="/app/equipos" element={<p>Pantalla equipos</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("MiEquipoPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerMiEquipo.mockResolvedValue(equipoComoLider);
  });

  describe("US 43 - Transferir liderazgo", () => {
    it("el líder elige a otro integrante, confirma y se actualizan los roles", async () => {
      const usuario = userEvent.setup();
      transferirLiderazgo.mockResolvedValue({
        message: "El liderazgo del equipo fue transferido exitosamente a pepe",
      });
      renderPagina();

      await usuario.click(
        await screen.findByRole("button", { name: "Hacer líder" })
      );
      const modal = screen.getByRole("dialog");
      expect(within(modal).getByText("pepe")).toBeInTheDocument();

      obtenerMiEquipo.mockResolvedValue(equipoComoIntegrante);
      await usuario.click(
        within(modal).getByRole("button", { name: "Transferir" })
      );

      expect(transferirLiderazgo).toHaveBeenCalledWith(3, 2);
      expect(
        await screen.findByText(/transferido exitosamente a pepe/)
      ).toBeInTheDocument();
      // Ya no es líder: desaparecen las acciones de líder.
      expect(screen.queryByRole("button", { name: "Hacer líder" })).toBeNull();
    });

    it("cancelar no transfiere el liderazgo", async () => {
      const usuario = userEvent.setup();
      renderPagina();

      await usuario.click(
        await screen.findByRole("button", { name: "Hacer líder" })
      );
      await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(transferirLiderazgo).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("un integrante común no ve las acciones de líder", async () => {
      obtenerMiEquipo.mockResolvedValue(equipoComoIntegrante);
      renderPagina();

      expect(await screen.findByText("Los Gankers")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Hacer líder" })).toBeNull();
      expect(
        screen.queryByRole("button", { name: "Eliminar equipo" })
      ).toBeNull();
    });
  });

  describe("US 16 - Eliminar equipo", () => {
    it("el líder confirma, se cierra el chat del equipo y vuelve a Equipos", async () => {
      const usuario = userEvent.setup();
      eliminarEquipo.mockResolvedValue({
        message: "El equipo fue disuelto exitosamente.",
      });
      renderPagina();

      await usuario.click(
        await screen.findByRole("button", { name: "Eliminar equipo" })
      );
      await usuario.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: "Eliminar equipo",
        })
      );

      expect(eliminarEquipo).toHaveBeenCalledWith(3);
      expect(chat.cerrarConversacionActiva).toHaveBeenCalled();
      expect(chat.cargarConversaciones).toHaveBeenCalled();
      expect(await screen.findByText("Pantalla equipos")).toBeInTheDocument();
    });

    it("cancelar mantiene el equipo", async () => {
      const usuario = userEvent.setup();
      renderPagina();

      await usuario.click(
        await screen.findByRole("button", { name: "Eliminar equipo" })
      );
      await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(eliminarEquipo).not.toHaveBeenCalled();
      expect(screen.getByText("Los Gankers")).toBeInTheDocument();
    });
  });
});
