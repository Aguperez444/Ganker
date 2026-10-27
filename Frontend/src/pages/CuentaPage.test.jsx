import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { AuthProvider, useAuth } from "../context/AuthContext";
import CuentaPage from "./CuentaPage";
import { solicitarCambioEmail } from "../api/cambioEmailApi";

vi.mock("../api/cambioEmailApi", () => ({ solicitarCambioEmail: vi.fn() }));
import { actualizarJugador, obtenerJugadorActual } from "../api/jugadoresApi";

// La seccion de Discord se prueba en components/discord/Discord.test.jsx
vi.mock("../api/discordApi", () => ({
  getMyDiscord: vi.fn().mockResolvedValue({ linked: false }),
}));

vi.mock("../api/jugadoresApi", () => ({
  registrarJugador: vi.fn(),
  obtenerJugadorActual: vi.fn(),
  actualizarJugador: vi.fn(),
}));

vi.mock("../api/axiosClient", () => ({
  revocarRefreshToken: vi.fn(() => Promise.resolve()),
  default: { post: vi.fn(), get: vi.fn(), put: vi.fn() },
  registrarOnSesionExpirada: vi.fn(),
  registrarOnTokensRenovados: vi.fn(),
}));

// jsdom no implementa canvas, asi que el recorte real no puede ejecutarse aca.
// Mockeamos SOLO la conversion del canvas a archivo; el resto de recorteAvatar
// (incluida calcularDimensionesRecorte) sigue siendo el codigo real.
//
// Antes esto no hacia falta porque canvasAArchivo traia un respaldo interno que
// fabricaba un File falso cuando no habia canvas. Ese respaldo vivia en codigo
// de produccion: hacia pasar el test sin recortar nada y, en un navegador donde
// toBlob fallara, el usuario habria subido una imagen corrupta sin enterarse.
vi.mock("../utils/recorteAvatar", async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    canvasAArchivo: vi.fn(async (_canvas, nombreArchivo = "avatar.png") => ({
      file: new File(["contenido-png"], nombreArchivo, { type: "image/png" }),
      previewUrl: "blob:recorte-de-prueba",
    })),
  };
});

const JUGADOR = {
  username: "joaco_gg",
  name: "Joaquin Trabucco",
  mail: "joaco@ejemplo.com",
  role: "player",
  profiles: [],
  icon_url: "/media/users/icons/icon_example_1.png",
};

// Hace de ProtectedRoute: en la app real CuentaPage nunca se renderiza sin
// sesion cargada, asi que el test respeta la misma condicion.
function ConSesion({ children }) {
  const { loading, user } = useAuth();
  if (loading || !user) return <p>cargando</p>;
  return children;
}

function conflicto(mensaje) {
  return { response: { status: 409, data: { error: mensaje } } };
}

async function renderCuenta() {
  localStorage.setItem("access_token", "acceso");
  localStorage.setItem("refresh_token", "refresco");

  render(
    <MemoryRouter>
      <AuthProvider>
        <ConSesion>
          <CuentaPage />
        </ConSesion>
      </AuthProvider>
    </MemoryRouter>
  );

  // Espera a que /me responda y el formulario se precargue.
  return screen.findByDisplayValue(JUGADOR.username);
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  obtenerJugadorActual.mockResolvedValue(JUGADOR);
});

describe("US 02 - Modificar mis datos", () => {
  it("precarga el formulario con los datos actuales del jugador", async () => {
    await renderCuenta();

    expect(screen.getByDisplayValue(JUGADOR.name)).toBeInTheDocument();
    expect(screen.queryByDisplayValue(JUGADOR.mail)).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Nuevo email" })).toHaveValue(
      ""
    );
  });

  it("muestra la foto de perfil que devuelve /me", async () => {
    await renderCuenta();

    const foto = screen.getByAltText(`Foto de perfil de ${JUGADOR.username}`);
    // La ruta llega relativa desde el backend y hay que resolverla contra la
    // API, no contra el server de Vite.
    expect(foto).toHaveAttribute(
      "src",
      expect.stringContaining(JUGADOR.icon_url)
    );
    expect(foto.getAttribute("src").startsWith("/media")).toBe(false);
  });

  it("cae en la inicial del username si el backend no manda foto", async () => {
    obtenerJugadorActual.mockResolvedValue({ ...JUGADOR, icon_url: null });

    await renderCuenta();

    expect(screen.queryByAltText(/foto de perfil/i)).toBeNull();
    expect(screen.getAllByText("J").length).toBeGreaterThan(0);
  });

  it("pide la contraseña actual solamente para cambiar el email", async () => {
    await renderCuenta();

    expect(screen.getByLabelText("Contraseña actual")).toHaveAttribute(
      "type",
      "password"
    );
  });

  it("guarda los cambios y confirma cuando los datos son válidos", async () => {
    const usuario = userEvent.setup();
    actualizarJugador.mockResolvedValue({
      ...JUGADOR,
      username: "joaco_ganker",
    });

    await renderCuenta();

    const campoUsername = screen.getByPlaceholderText("Tu nombre de usuario");
    await usuario.clear(campoUsername);
    await usuario.type(campoUsername, "joaco_ganker");
    await usuario.click(
      screen.getByRole("button", { name: /guardar cambios/i })
    );

    await waitFor(() =>
      expect(actualizarJugador).toHaveBeenCalledWith({
        nombre: JUGADOR.name,
        username: "joaco_ganker",
        icon: null,
      })
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      /tus datos se guardaron correctamente/i
    );
  });

  it("no guarda si un campo obligatorio queda vacío", async () => {
    const usuario = userEvent.setup();
    await renderCuenta();

    await usuario.clear(screen.getByPlaceholderText("Tu nombre completo"));
    await usuario.click(
      screen.getByRole("button", { name: /guardar cambios/i })
    );

    expect(
      await screen.findByText(/ingresá tu nombre completo/i)
    ).toBeInTheDocument();
    expect(actualizarJugador).not.toHaveBeenCalled();
  });

  it("valida el nuevo email sin bloquear el guardado de datos personales", async () => {
    const usuario = userEvent.setup();
    await renderCuenta();
    await usuario.type(
      screen.getByRole("textbox", { name: "Nuevo email" }),
      "invalido"
    );
    await usuario.click(
      screen.getByRole("button", { name: /enviar confirmación de email/i })
    );
    expect(await screen.findByText(/formato válido/i)).toBeInTheDocument();
    expect(solicitarCambioEmail).not.toHaveBeenCalled();
    await usuario.click(
      screen.getByRole("button", { name: /guardar cambios/i })
    );
    await waitFor(() => expect(actualizarJugador).toHaveBeenCalled());
  });

  it("solicita confirmación con contraseña y conserva el correo actual", async () => {
    solicitarCambioEmail.mockResolvedValue({
      message: "Revisá el nuevo correo para confirmar el cambio.",
    });
    const usuario = userEvent.setup();
    await renderCuenta();
    await usuario.type(
      screen.getByRole("textbox", { name: "Nuevo email" }),
      "nuevo@example.com"
    );
    await usuario.type(
      screen.getByLabelText("Contraseña actual"),
      "Password123"
    );
    await usuario.click(
      screen.getByRole("button", { name: /enviar confirmación de email/i })
    );
    expect(solicitarCambioEmail).toHaveBeenCalledExactlyOnceWith({
      mail: "nuevo@example.com",
      password: "Password123",
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      /revisá el nuevo correo/i
    );
    expect(screen.getByLabelText("Contraseña actual")).toHaveValue("");
    expect(screen.getByText(JUGADOR.mail)).toBeInTheDocument();
    expect(obtenerJugadorActual).toHaveBeenCalledTimes(1);
    expect(actualizarJugador).not.toHaveBeenCalled();
  });

  it("muestra el error cuando el nuevo email está ocupado", async () => {
    solicitarCambioEmail.mockRejectedValue(
      conflicto("El correo ya está ocupado.")
    );
    const usuario = userEvent.setup();
    await renderCuenta();
    await usuario.type(
      screen.getByRole("textbox", { name: "Nuevo email" }),
      "ocupado@example.com"
    );
    await usuario.type(
      screen.getByLabelText("Contraseña actual"),
      "Password123"
    );
    await usuario.click(
      screen.getByRole("button", { name: /enviar confirmación de email/i })
    );
    expect(
      await screen.findByText(/el correo ya está ocupado/i)
    ).toBeInTheDocument();
    expect(actualizarJugador).not.toHaveBeenCalled();
  });

  it("muestra el error en el campo cuando el username ya está ocupado", async () => {
    const usuario = userEvent.setup();
    actualizarJugador.mockRejectedValue(
      conflicto('El username: "ocupado" ya está ocupado.')
    );

    await renderCuenta();

    const campoUsername = screen.getByPlaceholderText("Tu nombre de usuario");
    await usuario.clear(campoUsername);
    await usuario.type(campoUsername, "ocupado");
    await usuario.click(
      screen.getByRole("button", { name: /guardar cambios/i })
    );

    expect(
      await screen.findByText(/el username.*ya está ocupado/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("permite seleccionar una imagen, recortarla en el modal y enviarla en el formulario", async () => {
    const usuario = userEvent.setup();
    actualizarJugador.mockResolvedValue({
      ...JUGADOR,
      icon_url: "/media/users/icons/nuevo_avatar.png",
    });

    // Mock URL.createObjectURL y URL.revokeObjectURL para jsdom
    const origCreateObjectURL = URL.createObjectURL;
    const origRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:http://localhost/fake-blob");
    URL.revokeObjectURL = vi.fn();

    // Mock Image naturalWidth / naturalHeight / src para jsdom
    const origNaturalWidth = Object.getOwnPropertyDescriptor(
      globalThis.Image.prototype,
      "naturalWidth"
    );
    const origNaturalHeight = Object.getOwnPropertyDescriptor(
      globalThis.Image.prototype,
      "naturalHeight"
    );
    const origSrc = Object.getOwnPropertyDescriptor(
      globalThis.Image.prototype,
      "src"
    );

    Object.defineProperty(globalThis.Image.prototype, "naturalWidth", {
      get: () => 300,
      configurable: true,
    });
    Object.defineProperty(globalThis.Image.prototype, "naturalHeight", {
      get: () => 300,
      configurable: true,
    });
    Object.defineProperty(globalThis.Image.prototype, "src", {
      set(v) {
        origSrc?.set?.call(this, v);
        setTimeout(() => {
          if (typeof this.onload === "function") this.onload();
        }, 0);
      },
      get() {
        return origSrc?.get?.call(this);
      },
      configurable: true,
    });

    try {
      await renderCuenta();

      // Buscar el input file
      const inputArchivo = document.querySelector('input[type="file"]');
      expect(inputArchivo).toBeInTheDocument();

      const archivoFoto = new File(
        ["dummy image content"],
        "avatar_nuevo.png",
        {
          type: "image/png",
        }
      );

      await usuario.upload(inputArchivo, archivoFoto);

      // Esperar a que se abra el modal de recorte
      expect(
        await screen.findByRole("dialog", { name: /encuadrar foto de perfil/i })
      ).toBeInTheDocument();

      // Aplicar el recorte
      const botonRecortar = screen.getByRole("button", {
        name: /aplicar recorte/i,
      });
      await usuario.click(botonRecortar);

      // El modal debe haberse cerrado y debe mostrarse la vista previa y botón de descartar
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
      expect(
        screen.getByRole("button", { name: /descartar foto/i })
      ).toBeInTheDocument();

      // Guardar cambios
      await usuario.click(
        screen.getByRole("button", { name: /guardar cambios/i })
      );

      await waitFor(() =>
        expect(actualizarJugador).toHaveBeenCalledWith({
          nombre: JUGADOR.name,
          username: JUGADOR.username,
          icon: expect.any(File),
        })
      );

      expect(await screen.findByRole("status")).toHaveTextContent(
        /tus datos se guardaron correctamente/i
      );
    } finally {
      URL.createObjectURL = origCreateObjectURL;
      URL.revokeObjectURL = origRevokeObjectURL;
      if (origNaturalWidth) {
        Object.defineProperty(
          globalThis.Image.prototype,
          "naturalWidth",
          origNaturalWidth
        );
      }
      if (origNaturalHeight) {
        Object.defineProperty(
          globalThis.Image.prototype,
          "naturalHeight",
          origNaturalHeight
        );
      }
      if (origSrc) {
        Object.defineProperty(globalThis.Image.prototype, "src", origSrc);
      }
    }
  });

  it("muestra un error si se intenta cargar un archivo que no es una imagen", async () => {
    await renderCuenta();

    const inputArchivo = document.querySelector('input[type="file"]');
    const archivoInvalido = new File(["texto"], "documento.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(inputArchivo, { target: { files: [archivoInvalido] } });

    expect(
      await screen.findByText(
        /por favor seleccioná un archivo de imagen válido/i
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("permite descartar la foto seleccionada antes de guardar", async () => {
    const usuario = userEvent.setup();

    const origCreateObjectURL = URL.createObjectURL;
    const origRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:http://localhost/fake-blob");
    URL.revokeObjectURL = vi.fn();

    // Mock Image naturalWidth / naturalHeight / src para jsdom
    const origNaturalWidth = Object.getOwnPropertyDescriptor(
      globalThis.Image.prototype,
      "naturalWidth"
    );
    const origNaturalHeight = Object.getOwnPropertyDescriptor(
      globalThis.Image.prototype,
      "naturalHeight"
    );
    const origSrc = Object.getOwnPropertyDescriptor(
      globalThis.Image.prototype,
      "src"
    );

    Object.defineProperty(globalThis.Image.prototype, "naturalWidth", {
      get: () => 200,
      configurable: true,
    });
    Object.defineProperty(globalThis.Image.prototype, "naturalHeight", {
      get: () => 200,
      configurable: true,
    });
    Object.defineProperty(globalThis.Image.prototype, "src", {
      set(v) {
        origSrc?.set?.call(this, v);
        setTimeout(() => {
          if (typeof this.onload === "function") this.onload();
        }, 0);
      },
      get() {
        return origSrc?.get?.call(this);
      },
      configurable: true,
    });

    try {
      await renderCuenta();

      const inputArchivo = document.querySelector('input[type="file"]');
      const archivoFoto = new File(["imagen"], "foto.png", {
        type: "image/png",
      });

      await usuario.upload(inputArchivo, archivoFoto);

      const botonRecortar = await screen.findByRole("button", {
        name: /aplicar recorte/i,
      });
      await usuario.click(botonRecortar);

      const botonDescartar = await screen.findByRole("button", {
        name: /descartar foto/i,
      });
      await usuario.click(botonDescartar);

      expect(
        screen.queryByRole("button", { name: /descartar foto/i })
      ).toBeNull();

      await usuario.click(
        screen.getByRole("button", { name: /guardar cambios/i })
      );

      await waitFor(() =>
        expect(actualizarJugador).toHaveBeenCalledWith({
          nombre: JUGADOR.name,
          username: JUGADOR.username,
          icon: null,
        })
      );
    } finally {
      URL.createObjectURL = origCreateObjectURL;
      URL.revokeObjectURL = origRevokeObjectURL;
      if (origNaturalWidth) {
        Object.defineProperty(
          globalThis.Image.prototype,
          "naturalWidth",
          origNaturalWidth
        );
      }
      if (origNaturalHeight) {
        Object.defineProperty(
          globalThis.Image.prototype,
          "naturalHeight",
          origNaturalHeight
        );
      }
      if (origSrc) {
        Object.defineProperty(globalThis.Image.prototype, "src", origSrc);
      }
    }
  });
});
