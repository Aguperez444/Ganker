import { describe, it, expect, beforeEach, vi } from "vitest";

import axiosClient from "./axiosClient";
import { createGame, updateGame } from "./gameApi";

vi.mock("./axiosClient", () => ({
  default: { post: vi.fn(), put: vi.fn() },
}));

function formDataEnviado(metodo) {
  return metodo.mock.calls[0][1];
}

describe("gameApi - has_characters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axiosClient.post.mockResolvedValue({ data: {} });
    axiosClient.put.mockResolvedValue({ data: {} });
  });

  it("al crear manda has_characters (true por defecto)", async () => {
    await createGame("Valorant", null, false);

    expect(formDataEnviado(axiosClient.post).get("has_characters")).toBe(
      "true"
    );
  });

  it("al crear un juego sin personajes manda false", async () => {
    await createGame("CS2", null, false, false);

    expect(formDataEnviado(axiosClient.post).get("has_characters")).toBe(
      "false"
    );
  });

  // Si se omitiera al editar, el backend lo vuelve a poner en true.
  it("al editar siempre manda el valor elegido", async () => {
    await updateGame(3, "CS2", null, false, false);

    expect(axiosClient.put).toHaveBeenCalledWith(
      "/api/v1/videogames/3",
      expect.any(FormData),
      expect.anything()
    );
    expect(formDataEnviado(axiosClient.put).get("has_characters")).toBe(
      "false"
    );
  });
});
