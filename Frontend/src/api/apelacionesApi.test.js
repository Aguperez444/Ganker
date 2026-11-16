import { beforeEach, expect, it, vi } from "vitest";
import axiosClient from "./axiosClient";
import {
  buscarApelaciones,
  enviarApelacion,
  obtenerMiApelacion,
  resolverApelacion,
} from "./apelacionesApi";

const privado = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("axios", () => ({ default: { create: vi.fn(() => privado) } }));
vi.mock("./axiosClient", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  privado.get.mockResolvedValue({ data: { appeal: null } });
  privado.post.mockResolvedValue({ data: { id: 1 } });
});

it("usa el permiso limitado sin recurrir al cliente de sesión normal", async () => {
  await obtenerMiApelacion("solo-apelar");
  expect(privado.get).toHaveBeenCalledWith("/api/v1/ban-appeals/mine", {
    headers: { Authorization: "Bearer solo-apelar" },
  });
  expect(axiosClient.get).not.toHaveBeenCalled();
});

it("envía texto y todas las imágenes como campos multipart separados", async () => {
  const imagenes = [
    new File(["a"], "a.png", { type: "image/png" }),
    new File(["b"], "b.png", { type: "image/png" }),
  ];
  await enviarApelacion({
    token: "permiso",
    texto: "  Apelo mi baneo  ",
    imagenes,
  });
  const [ruta, body, config] = privado.post.mock.calls[0];
  expect(ruta).toBe("/api/v1/ban-appeals/mine");
  expect(body.get("text")).toBe("Apelo mi baneo");
  expect(body.getAll("images").map((file) => file.name)).toEqual([
    "a.png",
    "b.png",
  ]);
  expect(config.headers.Authorization).toBe("Bearer permiso");
  expect(axiosClient.post).not.toHaveBeenCalled();
});

it("consulta y resuelve apelaciones con la sesión administrativa", async () => {
  axiosClient.get.mockResolvedValue({ data: { appeals: [{ id: 1 }] } });
  axiosClient.post.mockResolvedValue({ data: { id: 1, status: "accepted" } });
  await expect(
    buscarApelaciones({ username: "ana", estado: "pending", skip: 10 })
  ).resolves.toEqual([{ id: 1 }]);
  expect(axiosClient.get).toHaveBeenCalledWith("/api/v1/ban-appeals", {
    params: { username: "ana", status: "pending", skip: 10, limit: 11 },
  });
  await resolverApelacion(1, "accepted");
  expect(axiosClient.post).toHaveBeenCalledWith(
    "/api/v1/ban-appeals/1/resolve",
    { decision: "accepted" }
  );
});
