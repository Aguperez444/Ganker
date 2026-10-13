import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";

import RolesPage from "./RolesPage";
import { getGames } from "../../api/gameApi";
import { deleteRole, getRolesByGame, updateRole } from "../../api/roleApi";

vi.mock("../../api/gameApi", () => ({ getGames: vi.fn() }));
vi.mock("../../api/roleApi", () => ({
  getRolesByGame: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
}));

const ROLES = [
  { role_id: 10, name: "Mid", icon_url: "/media/roles/mid.png" },
  { role_id: 11, name: "Jungla", icon_url: "/media/roles/jungla.png" },
];

// El selector de videojuego usa IconSelectComponent (no un <select> nativo):
// se espera a que carguen los juegos, se abre la lista y se elige por texto.
async function elegirJuego(usuario, label, juego) {
  const disparador = await screen.findByLabelText(label);
  await waitFor(() => expect(disparador).toBeEnabled());
  await usuario.click(disparador);
  await usuario.click(
    await within(disparador.parentElement).findByText(juego)
  );
}

async function abrirRolesDeLol(usuario) {
  render(<RolesPage />);
  await elegirJuego(usuario, "Ver roles de", "League of Legends");
  await screen.findByText("Mid");
}

function filaDe(nombre) {
  return screen.getByText(nombre).closest("li");
}

describe("RolesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGames.mockResolvedValue([
      { id: 1, name: "League of Legends", rank_per_role: true },
    ]);
    getRolesByGame.mockResolvedValue(ROLES);
  });

  describe("US 29 - Modificar rol", () => {
    it("modifica el nombre manteniendo el ícono actual y confirma", async () => {
      const usuario = userEvent.setup();
      updateRole.mockResolvedValue({});
      await abrirRolesDeLol(usuario);

      await usuario.click(
        within(filaDe("Mid")).getByRole("button", { name: "Modificar" })
      );

      // El videojuego no se puede cambiar al editar.
      expect(screen.getByLabelText(/^Videojuego/)).toBeDisabled();

      const nombre = screen.getByLabelText(/Nombre del rol/);
      await usuario.clear(nombre);
      await usuario.type(nombre, "Medio");
      await usuario.click(
        screen.getByRole("button", { name: "GUARDAR CAMBIOS" })
      );

      expect(updateRole).toHaveBeenCalledWith(10, {
        name: "Medio",
        icon: null,
      });
      expect(
        await screen.findByText(/Rol "Medio" modificado correctamente/)
      ).toBeInTheDocument();
    });

    it("no guarda si el nombre queda vacío", async () => {
      const usuario = userEvent.setup();
      await abrirRolesDeLol(usuario);

      await usuario.click(
        within(filaDe("Mid")).getByRole("button", { name: "Modificar" })
      );
      await usuario.clear(screen.getByLabelText(/Nombre del rol/));

      // Sin cambios válidos el botón queda deshabilitado; aun forzando el
      // envío del formulario, la validación lo frena.
      const boton = screen.getByRole("button", { name: "GUARDAR CAMBIOS" });
      expect(boton).toBeDisabled();
      boton.closest("form").requestSubmit();

      expect(
        await screen.findByText("El nombre del rol es obligatorio.")
      ).toBeInTheDocument();
      expect(updateRole).not.toHaveBeenCalled();
    });

    it("muestra el error del backend si el nombre ya existe en el juego", async () => {
      const usuario = userEvent.setup();
      updateRole.mockRejectedValue({
        response: {
          status: 409,
          data: { error: 'El nombre de rol: "Jungla" ya existe.' },
        },
      });
      await abrirRolesDeLol(usuario);

      await usuario.click(
        within(filaDe("Mid")).getByRole("button", { name: "Modificar" })
      );
      const nombre = screen.getByLabelText(/Nombre del rol/);
      await usuario.clear(nombre);
      await usuario.type(nombre, "Jungla");
      await usuario.click(
        screen.getByRole("button", { name: "GUARDAR CAMBIOS" })
      );

      expect(
        await screen.findByText('El nombre de rol: "Jungla" ya existe.')
      ).toBeInTheDocument();
    });
  });

  describe("US 30 - Eliminar rol", () => {
    it("pide confirmación, elimina y muestra el mensaje del backend", async () => {
      const usuario = userEvent.setup();
      deleteRole.mockResolvedValue({
        message: "El rol ha sido eliminado exitosamente.",
      });
      await abrirRolesDeLol(usuario);

      await usuario.click(
        within(filaDe("Mid")).getByRole("button", { name: "Eliminar" })
      );
      const modal = screen.getByRole("dialog");
      // Advierte que puede borrar perfiles de juego que queden sin roles.
      expect(modal).toHaveTextContent(/ese perfil también se elimina/);

      await usuario.click(
        within(modal).getByRole("button", { name: "Eliminar" })
      );

      expect(deleteRole).toHaveBeenCalledWith(10);
      expect(
        await screen.findByText(/El rol ha sido eliminado exitosamente/)
      ).toBeInTheDocument();
    });

    it("cancelar no elimina el rol", async () => {
      const usuario = userEvent.setup();
      await abrirRolesDeLol(usuario);

      await usuario.click(
        within(filaDe("Mid")).getByRole("button", { name: "Eliminar" })
      );
      await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(deleteRole).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("avisa si el rol ya no existe y refresca la lista", async () => {
      const usuario = userEvent.setup();
      deleteRole.mockRejectedValue({
        response: {
          status: 404,
          data: { error: "El rol con id 10 no fue encontrado." },
        },
      });
      await abrirRolesDeLol(usuario);

      await usuario.click(
        within(filaDe("Mid")).getByRole("button", { name: "Eliminar" })
      );
      await usuario.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: "Eliminar",
        })
      );

      expect(
        await screen.findByText("El rol no existe o ya fue eliminado.")
      ).toBeInTheDocument();
      expect(getRolesByGame).toHaveBeenCalledTimes(2);
    });
  });
});
