import { describe, it, expect, beforeEach, vi } from "vitest";

import axiosClient from "./axiosClient";
import { getRanksByGame } from "./rankApi";

vi.mock("./axiosClient", () => ({ default: { get: vi.fn() } }));

describe("getRanksByGame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve los rangos ordenados por valor, del menor al mayor", async () => {
    axiosClient.get.mockResolvedValue({
      data: {
        ranks: [
          { rank_id: 3, name: "Oro", value: 4 },
          { rank_id: 1, name: "Hierro", value: 0 },
          { rank_id: 5, name: "Diamante", value: 7 },
          { rank_id: 2, name: "Plata", value: 3 },
        ],
      },
    });

    const rangos = await getRanksByGame(2);

    expect(axiosClient.get).toHaveBeenCalledWith("/api/v1/ranks/2");
    expect(rangos.map((r) => r.name)).toEqual([
      "Hierro",
      "Plata",
      "Oro",
      "Diamante",
    ]);
  });

  it("sin rangos devuelve una lista vacía", async () => {
    axiosClient.get.mockResolvedValue({ data: {} });

    await expect(getRanksByGame(2)).resolves.toEqual([]);
  });
});
