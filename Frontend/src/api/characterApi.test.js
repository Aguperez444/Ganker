import { describe, it, expect, beforeEach, vi } from "vitest";

import axiosClient from "./axiosClient";
import {
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getCharactersByGame,
} from "./characterApi";

vi.mock("./axiosClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

function formDataEnviado(metodo) {
  return metodo.mock.calls[0][1];
}

describe("characterApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axiosClient.get.mockResolvedValue({ data: { characters: [] } });
    axiosClient.post.mockResolvedValue({ data: { character_id: 1, name: "Ahri" } });
    axiosClient.put.mockResolvedValue({ data: { character_id: 1, name: "Ahri" } });
    axiosClient.delete.mockResolvedValue({ data: { detail: "OK" } });
  });

  describe("getCharactersByGame", () => {
    it("obtiene personajes por id de videojuego", async () => {
      const mockChars = [{ character_id: 1, name: "Ahri" }];
      axiosClient.get.mockResolvedValue({ data: { characters: mockChars } });

      const res = await getCharactersByGame(10);

      expect(axiosClient.get).toHaveBeenCalledWith("/api/v1/characters/10");
      expect(res).toEqual(mockChars);
    });
  });

  describe("createCharacter", () => {
    it("crea un personaje enviando nombre, videojuego e icono en FormData", async () => {
      const mockFile = new File(["dummy"], "ahri.png", { type: "image/png" });
      await createCharacter({
        videogame_id: 1,
        name: "Ahri",
        icon: mockFile,
      });

      expect(axiosClient.post).toHaveBeenCalledWith(
        "/api/v1/characters/",
        expect.any(FormData),
        expect.objectContaining({
          headers: { "Content-Type": "multipart/form-data" },
        })
      );
      const fd = formDataEnviado(axiosClient.post);
      expect(fd.get("name")).toBe("Ahri");
      expect(fd.get("videogame_id")).toBe("1");
      expect(fd.get("icon")).toBe(mockFile);
    });
  });

  describe("updateCharacter", () => {
    it("omite el campo icon en FormData si icon es null o undefined", async () => {
      await updateCharacter(5, {
        videogame_id: 1,
        name: "Ahri Editada",
        icon: null,
      });

      expect(axiosClient.put).toHaveBeenCalledWith(
        "/api/v1/characters/5",
        expect.any(FormData),
        expect.objectContaining({
          headers: { "Content-Type": "multipart/form-data" },
        })
      );

      const fd = formDataEnviado(axiosClient.put);
      expect(fd.get("name")).toBe("Ahri Editada");
      expect(fd.get("videogame_id")).toBe("1");
      expect(fd.has("icon")).toBe(false);
    });

    it("incluye el campo icon en FormData si se provee un archivo nuevo", async () => {
      const newFile = new File(["new-content"], "new_ahri.png", {
        type: "image/png",
      });

      await updateCharacter(5, {
        videogame_id: 2,
        name: "Ahri Fox",
        icon: newFile,
      });

      const fd = formDataEnviado(axiosClient.put);
      expect(fd.get("name")).toBe("Ahri Fox");
      expect(fd.get("videogame_id")).toBe("2");
      expect(fd.get("icon")).toBe(newFile);
    });
  });

  describe("deleteCharacter", () => {
    it("elimina un personaje por id", async () => {
      await deleteCharacter(7);

      expect(axiosClient.delete).toHaveBeenCalledWith("/api/v1/characters/7");
    });
  });
});
