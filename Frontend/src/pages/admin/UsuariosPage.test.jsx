import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";

import UsuariosPage from "./UsuariosPage";
import {
  eliminarUsuario,
  buscarUsuarios,
  obtenerPerfilJugador,
  registrarUsuario,
} from "../../api/jugadoresApi";
import { MENSAJE_AUTOELIMINACION } from "../../hooks/useDarDeBajaUsuario";

vi.mock("../../api/jugadoresApi", () => ({
  buscarUsuarios: vi.fn(),
  obtenerPerfilJugador: vi.fn(),
  eliminarUsuario: vi.fn(),
  registrarUsuario: vi.fn(),
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

async function buscar(usuario, username) {
  await usuario.type(screen.getByLabelText("Nombre de usuario"), username);
  await usuario.click(screen.getByRole("button", { name: "Buscar" }));
}

describe("UsuariosPage - US 50 Eliminar cuenta de usuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.user = { role: "admin" };
    auth.tokens = { access_token: tokenDe(1) };
    // La busqueda es parcial: trae tambien a "pedro_2" y el exacto se elige
    // en el front.
    buscarUsuarios.mockResolvedValue([
      { user_id: 12, username: "pedro", name: "Pedro", icon_url: "" },
      { user_id: 13, username: "pedro_2", name: "Pedro 2", icon_url: "" },
    ]);
    obtenerPerfilJugador.mockResolvedValue(PEDRO);
  });

  it("busca por nombre de usuario, confirma la baja y muestra el aviso", async () => {
    const usuario = userEvent.setup();
    eliminarUsuario.mockResolvedValue({
      message: "El usuario ha sido eliminado exitosamente.",
    });
    render(<UsuariosPage />);

    await buscar(usuario, "pedro");
    expect(buscarUsuarios).toHaveBeenCalledWith("pedro", { size: 100 });
    expect(await screen.findByText(/@pedro · ID 12/)).toBeInTheDocument();
    expect(obtenerPerfilJugador).toHaveBeenCalledWith(12);

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

  it("avisa si no existe un usuario activo con ese nombre de usuario", async () => {
    const usuario = userEvent.setup();
    render(<UsuariosPage />);

    // "pedr" matchea parcialmente pero ningun username es exactamente ese.
    await buscar(usuario, "pedr");

    expect(
      await screen.findByText(
        "No existe un usuario activo con ese nombre de usuario."
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dar de baja" })).toBeNull();
  });

  it("acepta el username escrito con @ y espacios", async () => {
    const usuario = userEvent.setup();
    render(<UsuariosPage />);

    await buscar(usuario, "  @pedro ");

    expect(buscarUsuarios).toHaveBeenCalledWith("pedro", { size: 100 });
  });

  it("no distingue mayúsculas al elegir el username exacto", async () => {
    const usuario = userEvent.setup();
    render(<UsuariosPage />);

    await buscar(usuario, "PEDRO");

    expect(await screen.findByText(/@pedro · ID 12/)).toBeInTheDocument();
  });

  it("avisa si falla la búsqueda", async () => {
    const usuario = userEvent.setup();
    buscarUsuarios.mockRejectedValue({ response: { status: 500 } });
    render(<UsuariosPage />);

    await buscar(usuario, "pedro");

    expect(
      await screen.findByText("No se pudo buscar el usuario.")
    ).toBeInTheDocument();
  });

  it("avisa si el usuario ya fue dado de baja al confirmar", async () => {
    const usuario = userEvent.setup();
    eliminarUsuario.mockRejectedValue({
      response: { status: 404, data: { error: "Usuario no encontrado" } },
    });
    render(<UsuariosPage />);

    await buscar(usuario, "pedro");
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

    await buscar(usuario, "pedro");
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

    await buscar(usuario, "pedro");

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

    await buscar(usuario, "pedro");
    await usuario.click(
      await screen.findByRole("button", { name: "Dar de baja" })
    );
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(eliminarUsuario).not.toHaveBeenCalled();
    expect(screen.getByText(/@pedro · ID 12/)).toBeInTheDocument();
  });
});

const DATOS_VALIDOS = {
  nombre: "Ana Pérez",
  username: "ana",
  mail: "ana@ejemplo.com",
  password: "Segura123",
};

async function completarRegistro(usuario, datos = DATOS_VALIDOS, rol) {
  const campos = [
    ["Nombre completo del usuario", datos.nombre],
    ["Username único", datos.username],
    ["usuario@ejemplo.com", datos.mail],
    ["Contraseña inicial", datos.password],
    ["Repetí la contraseña", datos.password],
  ];
  for (const [placeholder, valor] of campos) {
    if (valor)
      await usuario.type(screen.getByPlaceholderText(placeholder), valor);
  }
  if (rol) await usuario.selectOptions(screen.getByLabelText("ROL"), rol);
  await usuario.click(
    screen.getByRole("button", { name: "Registrar usuario" })
  );
}

describe("UsuariosPage - US 39 Registrar usuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.user = { role: "admin" };
    auth.tokens = { access_token: tokenDe(1) };
  });

  it("registra al usuario con datos válidos y muestra la confirmación", async () => {
    const usuario = userEvent.setup();
    registrarUsuario.mockResolvedValue({
      user_id: 30,
      username: "ana",
      name: "Ana Pérez",
      mail: "ana@ejemplo.com",
      role: "admin",
    });
    render(<UsuariosPage />);

    await completarRegistro(usuario, DATOS_VALIDOS, "admin");

    expect(registrarUsuario).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: "Ana Pérez",
        username: "ana",
        mail: "ana@ejemplo.com",
        password: "Segura123",
        rol: "admin",
      })
    );
    expect(
      await screen.findByText(
        /La cuenta de @ana \(Administrador\) fue creada correctamente/
      )
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Username único")).toHaveValue("");
  });

  it("no registra sin mail", async () => {
    const usuario = userEvent.setup();
    render(<UsuariosPage />);

    await completarRegistro(usuario, { ...DATOS_VALIDOS, mail: "" });

    expect(screen.getByText("Ingresá tu email.")).toBeInTheDocument();
    expect(registrarUsuario).not.toHaveBeenCalled();
  });

  it("no registra con un mail de formato inválido", async () => {
    const usuario = userEvent.setup();
    render(<UsuariosPage />);

    await completarRegistro(usuario, { ...DATOS_VALIDOS, mail: "ana@" });

    expect(
      screen.getByText("El email no tiene un formato válido.")
    ).toBeInTheDocument();
    expect(registrarUsuario).not.toHaveBeenCalled();
  });

  it("muestra el error si el mail ya está ocupado", async () => {
    const usuario = userEvent.setup();
    registrarUsuario.mockRejectedValue({
      response: {
        status: 409,
        data: {
          error:
            "Ya existe una cuenta registrada con el email ana@ejemplo.com.",
        },
      },
    });
    render(<UsuariosPage />);

    await completarRegistro(usuario);

    expect(
      await screen.findByText(/Ya existe una cuenta registrada con el email/)
    ).toBeInTheDocument();
  });

  it("muestra el error si el username ya está ocupado", async () => {
    const usuario = userEvent.setup();
    registrarUsuario.mockRejectedValue({
      response: {
        status: 409,
        data: { error: 'El username: "ana" ya está ocupado.' },
      },
    });
    render(<UsuariosPage />);

    await completarRegistro(usuario);

    expect(
      await screen.findByText('El username: "ana" ya está ocupado.')
    ).toBeInTheDocument();
  });

  it("no registra con una contraseña de formato inválido", async () => {
    const usuario = userEvent.setup();
    render(<UsuariosPage />);

    await completarRegistro(usuario, { ...DATOS_VALIDOS, password: "corta" });

    expect(
      screen.getByText(
        "Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número."
      )
    ).toBeInTheDocument();
    expect(registrarUsuario).not.toHaveBeenCalled();
  });

  it("un admin no puede elegir el rol owner", () => {
    render(<UsuariosPage />);

    const opciones = within(screen.getByLabelText("ROL"))
      .getAllByRole("option")
      .map((o) => o.value);
    expect(opciones).toEqual(["player", "admin"]);
  });

  it("un owner puede registrar a otro owner", () => {
    auth.user = { role: "owner" };
    render(<UsuariosPage />);

    expect(
      within(screen.getByLabelText("ROL")).getByRole("option", {
        name: "Owner",
      })
    ).toBeInTheDocument();
  });

  it("muestra el rechazo del backend al registrar un rol superior", async () => {
    const usuario = userEvent.setup();
    registrarUsuario.mockRejectedValue({
      response: {
        status: 401,
        data: {
          error:
            "El usuario con ID 1 y rol admin no está autorizado para registrar un usuario con rol owner.",
        },
      },
    });
    render(<UsuariosPage />);

    await completarRegistro(usuario);

    expect(
      await screen.findByText(/no está autorizado para registrar/)
    ).toBeInTheDocument();
  });
});
