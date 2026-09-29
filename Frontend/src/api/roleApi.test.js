import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRole, updateRole, getRolesByGame } from "./roleApi";
import axiosClient from "./axiosClient";

vi.mock("./axiosClient", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("roleApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createRole - POST /api/v1/roles", () => {
    it("devuelve el rol creado en lugar de romperse al armar la respuesta", async () => {
      axiosClient.post.mockResolvedValue({
        data: {
          role_id: 10,
          name: "Mid",
          icon_url: "/media/games/lol/roles/mid.png",
        },
      });

      const icon = new File(["icon"], "mid.png", { type: "image/png" });

      const res = await createRole({
        videogame_id: 1,
        name: "Mid",
        icon,
      });

      const [url, formData, config] = axiosClient.post.mock.calls[0];
      expect(url).toBe("/api/v1/roles");
      expect(formData.get("videogame_id")).toBe("1");
      expect(formData.get("name")).toBe("Mid");
      expect(formData.get("icon")).toBeInstanceOf(File);
      expect(config).toEqual({
        headers: { "Content-Type": "multipart/form-data" },
      });

      expect(res).toEqual({
        role_id: 10,
        name: "Mid",
        icon_url: "/media/games/lol/roles/mid.png",
      });
    });
  });

  describe("updateRole - PUT /api/v1/roles/{role_id}", () => {
    it("manda solo el nombre cuando no se cambia el ícono", async () => {
      axiosClient.put.mockResolvedValue({
        data: { role_id: 10, name: "Middle Lane", icon_url: "/mid.png" },
      });

      const res = await updateRole({ roleId: 10, name: "Middle Lane", icon: null });

      const [url, formData] = axiosClient.put.mock.calls[0];
      expect(url).toBe("/api/v1/roles/10");
      expect(formData.get("name")).toBe("Middle Lane");
      expect(formData.get("icon")).toBeNull();

      expect(res).toEqual({
        role_id: 10,
        name: "Middle Lane",
        icon_url: "/mid.png",
      });
    });

    it("adjunta el ícono cuando se sube uno nuevo", async () => {
      axiosClient.put.mockResolvedValue({
        data: { role_id: 10, name: "Mid", icon_url: "/mid_nuevo.png" },
      });

      const icon = new File(["icon"], "mid_nuevo.png", { type: "image/png" });

      await updateRole({ roleId: 10, name: "Mid", icon });

      const [, formData] = axiosClient.put.mock.calls[0];
      expect(formData.get("icon")).toBeInstanceOf(File);
      expect(formData.get("icon").name).toBe("mid_nuevo.png");
    });
  });

  it("getRolesByGame devuelve la lista de roles del videojuego", async () => {
    axiosClient.get.mockResolvedValue({ data: { roles: [{ role_id: 1 }] } });

    const res = await getRolesByGame(3);

    expect(axiosClient.get).toHaveBeenCalledWith("/api/v1/roles/3");
    expect(res).toEqual([{ role_id: 1 }]);
  });
});
