import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import MiEquipoPage from "./MiEquipoPage";
import {
  eliminarEquipo,
  marcarEquipoInactivo,
  obtenerMiEquipo,
  salirDeEquipo,
  transferirLiderazgo,
  actualizarEquipo,
} from "../api/teamApi";

const { chat } = vi.hoisted(() => ({
  chat: {
    conversacionActivaId: 99,
    cargarConversaciones: vi.fn(),
    cerrarConversacionActiva: vi.fn(),
    seleccionarConversacion: vi.fn(),
  },
}));

vi.mock("../context/ChatContext", () => ({
  useChat: () => chat,
  useEventosEquipo: (callback) => {
    chat.alEventoEquipo = callback;
  },
}));

vi.mock("../api/rankApi", () => ({
  getRanksByGame: vi.fn().mockResolvedValue([
    { rank_id: 2, name: "Plata", value: 2 },
    { rank_id: 3, name: "Oro", value: 3 },
    { rank_id: 4, name: "Platino", value: 4 },
  ]),
}));

vi.mock("../api/regionApi", () => ({
  getRegionsByGame: vi.fn().mockResolvedValue([
    { region_id: 2, name: "LAS" },
    { region_id: 5, name: "LAN" },
  ]),
}));

vi.mock("../api/roleApi", () => ({
  getRolesByGame: vi.fn().mockResolvedValue([]),
}));

vi.mock("../api/teamApi", () => ({
  obtenerMiEquipo: vi.fn(),
  expulsarIntegrante: vi.fn(),
  transferirLiderazgo: vi.fn(),
  eliminarEquipo: vi.fn(),
  salirDeEquipo: vi.fn(),
  marcarEquipoInactivo: vi.fn(),
  actualizarEquipo: vi.fn(),
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
  description: "Buscamos mid",
  allow_other_regions: false,
  videogame: { videogame_id: 1, name: "League of Legends" },
  region: { region_id: 2, region_name: "LAS" },
  min_rank: { rank_id: 2, name: "Plata", value: 2 },
  max_rank: { rank_id: 4, name: "Platino", value: 4 },
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

  describe("US 19 - Salirse de un equipo", () => {
    beforeEach(() => {
      obtenerMiEquipo.mockResolvedValue(equipoComoIntegrante);
    });

    it("un integrante confirma, se cierra el chat del equipo y vuelve a Equipos", async () => {
      const usuario = userEvent.setup();
      salirDeEquipo.mockResolvedValue({
        message: "Has salido del equipo Los Gankers con éxito",
      });
      renderPagina();

      await usuario.click(
        await screen.findByRole("button", { name: "Salir del equipo" })
      );
      await usuario.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: "Salir del equipo",
        })
      );

      expect(salirDeEquipo).toHaveBeenCalledWith(3);
      expect(chat.cerrarConversacionActiva).toHaveBeenCalled();
      expect(chat.cargarConversaciones).toHaveBeenCalled();
      expect(await screen.findByText("Pantalla equipos")).toBeInTheDocument();
    });

    it("cancelar lo deja dentro del equipo", async () => {
      const usuario = userEvent.setup();
      renderPagina();

      await usuario.click(
        await screen.findByRole("button", { name: "Salir del equipo" })
      );
      await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(salirDeEquipo).not.toHaveBeenCalled();
      expect(screen.getByText("Los Gankers")).toBeInTheDocument();
    });

    it("el líder no puede salir directamente y se le indica qué hacer", async () => {
      obtenerMiEquipo.mockResolvedValue(equipoComoLider);
      renderPagina();

      expect(
        await screen.findByRole("button", { name: "Salir del equipo" })
      ).toBeDisabled();
      expect(
        screen.getByText(
          /transferí el liderazgo a otro integrante o eliminá el equipo/
        )
      ).toBeInTheDocument();
    });
  });

  describe("Marcar equipo como inactivo", () => {
    it("el líder confirma, vuelve a Equipos y el chat del equipo NO se cierra", async () => {
      const usuario = userEvent.setup();
      marcarEquipoInactivo.mockResolvedValue({
        message: "El equipo fue marcado inactivo exitosamente.",
      });
      renderPagina();

      await usuario.click(
        await screen.findByRole("button", { name: "Marcar como inactivo" })
      );
      await usuario.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: "Marcar como inactivo",
        })
      );

      expect(marcarEquipoInactivo).toHaveBeenCalledWith(3);
      expect(await screen.findByText("Pantalla equipos")).toBeInTheDocument();
      expect(chat.cerrarConversacionActiva).not.toHaveBeenCalled();
    });

    it("cancelar mantiene el equipo activo", async () => {
      const usuario = userEvent.setup();
      renderPagina();

      await usuario.click(
        await screen.findByRole("button", { name: "Marcar como inactivo" })
      );
      await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(marcarEquipoInactivo).not.toHaveBeenCalled();
      expect(screen.getByText("Los Gankers")).toBeInTheDocument();
    });

    it("un integrante común no ve la opción", async () => {
      obtenerMiEquipo.mockResolvedValue(equipoComoIntegrante);
      renderPagina();

      expect(await screen.findByText("Los Gankers")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Marcar como inactivo" })
      ).toBeNull();
    });
  });

  describe("US 15 - Modificar equipo", () => {
    async function abrirEdicion(usuario) {
      renderPagina();
      await usuario.click(
        await screen.findByRole("button", { name: "Modificar equipo" })
      );
      // Espera a que carguen los rangos del juego (el maximo precargado es
      // Platino y se muestra en el boton del desplegable).
      const rangoMaximo = await screen.findByLabelText(/Rango máximo/);
      await waitFor(() => expect(rangoMaximo).toHaveTextContent("Platino"));
    }

    // Los rangos usan IconSelectComponent (no un <select> nativo): se abre
    // la lista con un click y se elige la opcion por su texto.
    async function elegirRango(usuario, label, rango) {
      const disparador = screen.getByLabelText(label);
      await usuario.click(disparador);
      const lista = within(disparador.parentElement).getByRole("list");
      await usuario.click(within(lista).getByText(rango));
    }

    it("el líder modifica la descripción y el permiso de región sin tocar los rangos", async () => {
      const usuario = userEvent.setup();
      actualizarEquipo.mockResolvedValue({
        message: "El equipo Los Gankers ha sido modificado exitosamente",
        data: { ...equipoComoLider, description: "Buscamos support" },
      });
      await abrirEdicion(usuario);

      // El videojuego se muestra pero no es editable.
      expect(screen.getByRole("dialog")).toHaveTextContent(
        "El videojuego del equipo no se puede cambiar"
      );

      const descripcion = screen.getByLabelText(/Mensaje de búsqueda/);
      await usuario.clear(descripcion);
      await usuario.type(descripcion, "Buscamos support");
      await usuario.click(
        screen.getByLabelText(/Admitir jugadores de otras regiones/)
      );
      await usuario.click(
        screen.getByRole("button", { name: "Guardar cambios" })
      );

      expect(actualizarEquipo).toHaveBeenCalledWith(
        3,
        expect.objectContaining({
          descripcion: "Buscamos support",
          admiteOtrasRegiones: true,
          rangoMinimoId: "2",
          rangoMaximoId: "4",
        })
      );
      expect(
        await screen.findByText(/ha sido modificado exitosamente/)
      ).toBeInTheDocument();
      expect(screen.getByText("Buscamos support")).toBeInTheDocument();
    });

    it("no guarda si el nombre queda vacío", async () => {
      const usuario = userEvent.setup();
      await abrirEdicion(usuario);

      await usuario.clear(screen.getByLabelText(/Nombre del equipo/));
      await usuario.click(
        screen.getByRole("button", { name: "Guardar cambios" })
      );

      expect(
        screen.getByText("Ingresá el nombre del equipo.")
      ).toBeInTheDocument();
      expect(actualizarEquipo).not.toHaveBeenCalled();
    });

    it("no guarda si el rango mínimo es superior al máximo", async () => {
      const usuario = userEvent.setup();
      await abrirEdicion(usuario);

      await elegirRango(usuario, /Rango mínimo/, "Platino");
      await elegirRango(usuario, /Rango máximo/, "Plata");
      await usuario.click(
        screen.getByRole("button", { name: "Guardar cambios" })
      );

      expect(
        screen.getByText(/mínimo no puede ser superior/)
      ).toBeInTheDocument();
      expect(actualizarEquipo).not.toHaveBeenCalled();
    });

    it("no guarda si el nuevo rango deja afuera a un integrante", async () => {
      const usuario = userEvent.setup();
      await abrirEdicion(usuario);

      // Los integrantes son Oro: Platino a Platino los deja afuera.
      await elegirRango(usuario, /Rango mínimo/, "Platino");
      await usuario.click(
        screen.getByRole("button", { name: "Guardar cambios" })
      );

      expect(
        screen.getByText(/Quedan afuera: lider \(Oro\)/)
      ).toBeInTheDocument();
      expect(actualizarEquipo).not.toHaveBeenCalled();
    });

    it("un integrante sin rol de líder no puede modificar el equipo", async () => {
      obtenerMiEquipo.mockResolvedValue(equipoComoIntegrante);
      renderPagina();

      expect(await screen.findByText("Los Gankers")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Modificar equipo" })
      ).toBeNull();
    });
  });

  describe("US 44 - chat del equipo", () => {
    it("abre el chat del equipo en el panel de chat", async () => {
      const usuario = userEvent.setup();
      renderPagina();

      await usuario.click(
        await screen.findByRole("button", { name: "Abrir chat del equipo" })
      );

      expect(chat.seleccionarConversacion).toHaveBeenCalledWith(99);
    });
  });

  describe("actualización automática", () => {
    it("vuelve a pedir el equipo cuando el backend avisa que alguien se unió", async () => {
      renderPagina();
      expect(await screen.findByText("Los Gankers")).toBeInTheDocument();
      expect(obtenerMiEquipo).toHaveBeenCalledTimes(1);

      obtenerMiEquipo.mockResolvedValue({
        ...equipoComoLider,
        player_count: 3,
        members: [...equipoComoLider.members, integrante(5, "nuevo", false)],
      });
      await act(async () => {
        chat.alEventoEquipo({
          type: "TEAM_NEW_MEMBER_NOTIFICATION",
          team_id: 3,
          username: "nuevo",
        });
      });

      expect(obtenerMiEquipo).toHaveBeenCalledTimes(2);
      expect(await screen.findByText("nuevo")).toBeInTheDocument();
    });
  });
});
