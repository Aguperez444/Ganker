import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import ChatWindowComponent from "./ChatWindowComponent";
import {
  obtenerHistorialChatroom,
  obtenerHistorialMensajes,
} from "../../api/chatApi";

vi.mock("../../api/chatApi", () => ({
  obtenerHistorialMensajes: vi.fn(),
  obtenerHistorialChatroom: vi.fn(),
}));

vi.mock("../../context/ChatContext", () => ({
  useChat: () => ({
    obtenerMensajesDeConversacion: () => undefined,
    sembrarMensajesDeConversacion: vi.fn(),
    actualizarMensajesDeConversacion: vi.fn(),
    marcarConversacionComoVista: vi.fn(),
  }),
}));

// El socket no es lo que se prueba acá.
vi.mock("../../hooks/useChatSocket", () => ({
  useChatSocket: (id, mensajesIniciales) => ({
    mensajes: mensajesIniciales,
    setMensajes: vi.fn(),
    estado: "ABIERTO",
    error: null,
    enviarMensaje: vi.fn(),
  }),
}));

const chatDelEquipo = {
  tipo: "equipo",
  conversation_id: 9,
  nombre: "Los Gankers",
  icon_url: "",
  member_count: 3,
};

function renderChat() {
  return render(
    <ChatWindowComponent conversacion={chatDelEquipo} currentUserId={1} />
  );
}

describe("ChatWindowComponent - US 45 historial del chat del equipo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("muestra los mensajes en orden y el nombre de quien escribió", async () => {
    obtenerHistorialChatroom.mockResolvedValue([
      {
        message_id: 2,
        sender_id: 2,
        sender_name: "Pepe",
        content: "a las 22?",
        timestamp: "2026-10-12T20:05:00",
      },
      {
        message_id: 1,
        sender_id: 2,
        sender_name: "Pepe",
        content: "jugamos hoy?",
        timestamp: "2026-10-12T20:00:00",
      },
    ]);
    renderChat();

    const primero = await screen.findByText("jugamos hoy?");
    const segundo = screen.getByText("a las 22?");
    expect(
      primero.compareDocumentPosition(segundo) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    // El nombre va una sola vez al empezar la tanda del mismo autor.
    expect(screen.getAllByText("Pepe")).toHaveLength(1);
    expect(screen.getByText("Los Gankers")).toBeInTheDocument();
  });

  it("explica que no es integrante si el backend responde 403", async () => {
    obtenerHistorialChatroom.mockRejectedValue({ response: { status: 403 } });
    renderChat();

    expect(
      await screen.findByText(/No sos integrante de este equipo/)
    ).toBeInTheDocument();
  });

  it("explica que el chat no existe si el backend responde 404", async () => {
    obtenerHistorialChatroom.mockRejectedValue({ response: { status: 404 } });
    renderChat();

    expect(
      await screen.findByText("El chat de este equipo no existe.")
    ).toBeInTheDocument();
  });
});

describe("ChatWindowComponent - acceso al perfil de otro jugador", () => {
  beforeEach(() => vi.clearAllMocks());

  it("en el chat privado, el encabezado lleva al perfil del otro jugador", async () => {
    const usuario = userEvent.setup();
    const onVerPerfil = vi.fn();
    obtenerHistorialMensajes.mockResolvedValue([]);
    render(
      <ChatWindowComponent
        conversacion={{
          conversation_id: 4,
          other_participant: {
            user_id: 7,
            username: "ana",
            name: "Ana",
            icon_url: "",
          },
        }}
        currentUserId={1}
        onVerPerfil={onVerPerfil}
      />
    );

    await usuario.click(
      await screen.findByRole("button", { name: "Ver perfil de Ana" })
    );

    expect(onVerPerfil).toHaveBeenCalledWith(7);
  });

  it("en el chat del equipo, el nombre de quien escribió lleva a su perfil", async () => {
    const usuario = userEvent.setup();
    const onVerPerfil = vi.fn();
    obtenerHistorialChatroom.mockResolvedValue([
      {
        message_id: 1,
        sender_id: 2,
        sender_name: "Pepe",
        content: "jugamos hoy?",
        timestamp: "2026-10-12T20:00:00",
      },
    ]);
    render(
      <ChatWindowComponent
        conversacion={chatDelEquipo}
        currentUserId={1}
        onVerPerfil={onVerPerfil}
      />
    );

    await usuario.click(await screen.findByRole("button", { name: "Pepe" }));

    expect(onVerPerfil).toHaveBeenCalledWith(2);
  });

  it("sin onVerPerfil el nombre del autor no es clickeable", async () => {
    obtenerHistorialChatroom.mockResolvedValue([
      {
        message_id: 1,
        sender_id: 2,
        sender_name: "Pepe",
        content: "jugamos hoy?",
        timestamp: "2026-10-12T20:00:00",
      },
    ]);
    renderChat();

    expect(await screen.findByText("Pepe")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pepe" })).toBeNull();
  });
});
