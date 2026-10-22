import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";

import UsuariosPage from "./UsuariosPage";
import { eliminarUsuario, obtenerPerfilJugador } from "../../api/jugadoresApi";
import { MENSAJE_AUTOELIMINACION } from "../../hooks/useDarDeBajaUsuario";

vi.mock("../../api/jugadoresApi", () => ({
  obtenerPerfilJugador: vi.fn(),
  eliminarUsuario: vi.fn(),
}));

function tokenDe(userId) {
  return `x.${btoa(JSON.stringify({ sub: String(userId) }))}.x`;
}

const auth = vi.hoisted(() => ({ user: null, tokens: null }));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => auth,
}));

const PEDRO = {
  user_id: 12,
  username: "pedro",
  name: "Pedro",
  icon_url: null,
  last_connection: null,
  profiles: [{ game_profile_id: 1 }],
};

async function buscar(usuario, id) {
  await usuario.type(screen.getByLabelText("ID del usuario"), String(id));
  await usuario.click(screen.getByRole("button", { name: "Buscar" }));
}

describe("UsuariosPage - US 50 Eliminar cuenta de usuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.user = { role: "admin" };
    auth.tokens = { access_token: tokenDe(1) };
    obtenerPerfilJugador.mockResolvedValue(PEDRO);
  });

  it("busca por ID, confirma la baja y muestra el aviso", async () => {
    const usuario = userEvent.setup();
    eliminarUsuario.mockResolvedValue({
      message: "El usuario ha sido eliminado exitosamente.",
    });
    render(<UsuariosPage />);

    await buscar(usuario, 12);
    expect(obtenerPerfilJugador).toHaveBeenCalledWith(12);
    expect(await screen.findByText(/@pedro · ID 12/)).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Dar de baja" }));
    const modal = screen.getByRole("dialog");
    expect(modal).toHaveTextContent(/perfiles de juego/);
    await usuario.click(
      within(modal).getByRole("button", { name: "Dar de baja" })
    );

    expect(eliminarUsuario).toHaveBeenCalledWith(12);
    expect(
      await screen.findByText(/La cuenta de @pedro fue dada de baja/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/@pedro · ID 12/)).toBeNull();
  });

  it("avisa si no existe un usuario activo con ese ID", async () => {
    const usuario = userEvent.setup();
    obtenerPerfilJugador.mockRejectedValue({ response: { status: 404 } });
    render(<UsuariosPage />);

    await buscar(usuario, 999);

    expect(
      await screen.findByText("No existe un usuario activo con ese ID.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dar de baja" })).toBeNull();
  });

  it("avisa si el usuario ya fue dado de baja al confirmar", async () => {
    const usuario = userEvent.setup();
    eliminarUsuario.mockRejectedValue({
      response: { status: 404, data: { error: "Usuario no encontrado" } },
    });
    render(<UsuariosPage />);

    await buscar(usuario, 12);
    await usuario.click(
      await screen.findByRole("button", { name: "Dar de baja" })
    );
    await usuario.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Dar de baja",
      })
    );

    expect(
      await screen.findByText("El usuario no existe o ya fue dado de baja.")
    ).toBeInTheDocument();
  });

  it("sin permisos de admin muestra el error del backend", async () => {
    const usuario = userEvent.setup();
    eliminarUsuario.mockRejectedValue({
      response: {
        status: 403,
        data: {
          detail: "No tienes permisos suficientes para realizar esta acción",
        },
      },
    });
    render(<UsuariosPage />);

    await buscar(usuario, 12);
    await usuario.click(
      await screen.findByRole("button", { name: "Dar de baja" })
    );
    await usuario.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Dar de baja",
      })
    );

    expect(
      await screen.findByText(
        "No tienes permisos suficientes para realizar esta acción"
      )
    ).toBeInTheDocument();
  });

  it("no permite darse de baja a uno mismo", async () => {
    const usuario = userEvent.setup();
    auth.tokens = { access_token: tokenDe(12) };
    render(<UsuariosPage />);

    await buscar(usuario, 12);

    expect(
      await screen.findByText(/Es tu cuenta: para darla de baja usá Mi cuenta/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dar de baja" })).toBeNull();
    expect(eliminarUsuario).not.toHaveBeenCalled();
    expect(MENSAJE_AUTOELIMINACION).toMatch(/Mi cuenta/);
  });

  it("cancelar no da de baja al usuario", async () => {
    const usuario = userEvent.setup();
    render(<UsuariosPage />);

    await buscar(usuario, 12);
    await usuario.click(
      await screen.findByRole("button", { name: "Dar de baja" })
    );
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(eliminarUsuario).not.toHaveBeenCalled();
    expect(screen.getByText(/@pedro · ID 12/)).toBeInTheDocument();
  });
});
