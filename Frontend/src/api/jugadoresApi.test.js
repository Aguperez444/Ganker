import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  actualizarJugador,
  registrarJugador,
  obtenerJugadorActual,
} from "./jugadoresApi";
import axiosClient from "./axiosClient";

vi.mock("./axiosClient", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe("jugadoresApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("actualizarJugador - Nueva firma PUT /api/v1/users/", () => {
    it("envía username, name y mail en FormData con Content-Type multipart/form-data", async () => {
      axiosClient.put.mockResolvedValue({
        data: {
          user_id: 1,
          username: "player1",
          name: "Jugador Uno",
          mail: "p1@ganker.com",
          icon_url: "/media/users/icons/1.png",
        },
      });

      const respuesta = await actualizarJugador({
        nombre: "Jugador Uno",
        username: "player1",
        mail: "p1@ganker.com",
      });

      expect(axiosClient.put).toHaveBeenCalledTimes(1);
      const [url, formData, config] = axiosClient.put.mock.calls[0];

      expect(url).toBe("/api/v1/users/");
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get("username")).toBe("player1");
      expect(formData.get("name")).toBe("Jugador Uno");
      expect(formData.get("mail")).toBe("p1@ganker.com");
      expect(formData.get("icon")).toBeNull();

      expect(config).toEqual({
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      expect(respuesta).toEqual({
        user_id: 1,
        username: "player1",
        name: "Jugador Uno",
        mail: "p1@ganker.com",
        icon_url: "/media/users/icons/1.png",
      });
    });

    it("adjunta el archivo de icono cuando se proporciona", async () => {
      axiosClient.put.mockResolvedValue({
        data: {
          user_id: 1,
          username: "player1",
          name: "Jugador Uno",
          mail: "p1@ganker.com",
          icon_url: "/media/users/icons/new.png",
        },
      });

      const iconFile = new File(["icon-bytes"], "avatar.png", {
        type: "image/png",
      });

      await actualizarJugador({
        nombre: "Jugador Uno",
        username: "player1",
        mail: "p1@ganker.com",
        icon: iconFile,
      });

      const [, formData] = axiosClient.put.mock.calls[0];
      const iconRecibido = formData.get("icon");
      expect(iconRecibido).toBeInstanceOf(File);
      expect(iconRecibido.name).toBe("avatar.png");
    });
  });

  describe("otros métodos de jugadoresApi", () => {
    it("registrarJugador hace POST a /api/v1/users/register con JSON", async () => {
      axiosClient.post.mockResolvedValue({ data: { access_token: "tok" } });

      const res = await registrarJugador({
        nombre: "Test",
        username: "test",
        mail: "test@mail.com",
        password: "Pass",
      });

      expect(axiosClient.post).toHaveBeenCalledWith("/api/v1/users/register", {
        name: "Test",
        username: "test",
        mail: "test@mail.com",
        password: "Pass",
      });
      expect(res).toEqual({ access_token: "tok" });
    });

    it("obtenerJugadorActual hace GET a /api/v1/users/me", async () => {
      axiosClient.get.mockResolvedValue({ data: { user_id: 10 } });

      const res = await obtenerJugadorActual();

      expect(axiosClient.get).toHaveBeenCalledWith("/api/v1/users/me");
      expect(res).toEqual({ user_id: 10 });
    });
  });
});
