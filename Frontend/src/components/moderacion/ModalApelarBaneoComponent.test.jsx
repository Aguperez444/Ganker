import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { enviarApelacion, obtenerMiApelacion } from "../../api/apelacionesApi";
import ModalApelarBaneoComponent from "./ModalApelarBaneoComponent";

vi.mock("../../api/apelacionesApi", () => ({
  obtenerMiApelacion: vi.fn(),
  enviarApelacion: vi.fn(),
}));
const BAN = {
  ban_id: 2,
  user_id: 7,
  username: "ana",
  reason: "Scripts",
  active: true,
};
const APELACION = {
  id: 1,
  text: "No usé scripts",
  images: [],
  status: "pending",
};

beforeEach(() => {
  vi.clearAllMocks();
  obtenerMiApelacion.mockResolvedValue({ ban: BAN, appeal: null });
  enviarApelacion.mockResolvedValue(APELACION);
  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:preview"),
      revokeObjectURL: vi.fn(),
    })
  );
});

describe("Formulario de apelación", () => {
  it("permite apelar con texto y sin imágenes, y muestra el estado enviado", async () => {
    const user = userEvent.setup();
    render(<ModalApelarBaneoComponent token="permiso" onClose={vi.fn()} />);
    await user.type(
      await screen.findByLabelText(/explicá por qué/i),
      "No usé scripts"
    );
    await user.click(screen.getByRole("button", { name: "Enviar apelación" }));
    expect(enviarApelacion).toHaveBeenCalledWith({
      token: "permiso",
      texto: "No usé scripts",
      imagenes: [],
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Apelación enviada. Estado: Pendiente"
    );
    expect(
      screen.queryByRole("button", { name: "Enviar apelación" })
    ).toBeNull();
  });

  it("adjunta imágenes opcionales y permite quitarlas antes de enviar", async () => {
    const user = userEvent.setup();
    const imagen = new File(["png"], "captura.png", { type: "image/png" });
    render(<ModalApelarBaneoComponent token="permiso" onClose={vi.fn()} />);
    const input = await screen.findByLabelText("Imágenes (opcional)");
    await user.upload(input, imagen);
    expect(screen.getByRole("img", { name: /vista previa/i })).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Quitar captura.png" })
    );
    expect(screen.queryByRole("img")).toBeNull();
    await user.upload(input, imagen);
    await user.type(
      screen.getByLabelText(/explicá por qué/i),
      "No usé scripts"
    );
    await user.click(screen.getByRole("button", { name: "Enviar apelación" }));
    expect(enviarApelacion).toHaveBeenCalledWith({
      token: "permiso",
      texto: "No usé scripts",
      imagenes: [imagen],
    });
  });

  it("rechaza más de tres imágenes y no envía texto vacío", async () => {
    const user = userEvent.setup();
    render(<ModalApelarBaneoComponent token="permiso" onClose={vi.fn()} />);
    await user.upload(
      await screen.findByLabelText("Imágenes (opcional)"),
      Array.from(
        { length: 4 },
        (_, i) => new File(["png"], `${i}.png`, { type: "image/png" })
      )
    );
    expect(screen.getByRole("alert")).toHaveTextContent("hasta 3 imágenes");
    await user.click(screen.getByRole("button", { name: "Enviar apelación" }));
    expect(screen.getByRole("alert")).toHaveTextContent("entre 1 y 3000");
    expect(enviarApelacion).not.toHaveBeenCalled();
  });

  it.each(["pending", "rejected", "accepted"])(
    "muestra una apelación %s existente sin permitir duplicarla",
    async (status) => {
      obtenerMiApelacion.mockResolvedValue({
        ban: BAN,
        appeal: { ...APELACION, status },
      });
      render(<ModalApelarBaneoComponent token="permiso" onClose={vi.fn()} />);
      expect(await screen.findByRole("status")).toHaveTextContent(
        "Ya presentaste una apelación"
      );
      expect(
        screen.queryByRole("button", { name: "Enviar apelación" })
      ).toBeNull();
      if (status === "accepted")
        expect(
          screen.getByText(/podés volver a iniciar sesión/i)
        ).toBeVisible();
    }
  );

  it("muestra que hay que iniciar sesión otra vez cuando vence el permiso", async () => {
    obtenerMiApelacion.mockRejectedValue({ response: { status: 401 } });
    render(<ModalApelarBaneoComponent token="vencido" onClose={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Volvé a iniciar sesión"
    );
  });
});
