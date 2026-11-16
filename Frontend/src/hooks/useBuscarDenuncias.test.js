import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useBuscarDenuncias } from "./useBuscarDenuncias";
import { buscarDenuncias } from "../api/moderacionApi";

vi.mock("../api/moderacionApi", () => ({
  buscarDenuncias: vi.fn(),
}));

vi.mock("../utils/logs", () => ({
  logError: vi.fn(),
}));

describe("useBuscarDenuncias", () => {
  it("conserva la evidencia que manda el backend en cada denuncia", async () => {
    buscarDenuncias.mockResolvedValue([
      {
        id: 3,
        reported_user_id: 15,
        reported_user_name: "jugador1",
        reporter_user_id: 2,
        reporter_user_name: "owner_user",
        status: "pending",
        reason: "abusive_behavior",
        description: "insulto",
        created_at: "2026-11-05T13:43:46",
        resolved_at: null,
        resolved_by: null,
        evidence_image_url: "/media/reports/evidence/a.jpg",
        evidence_video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ]);

    const { result } = renderHook(() => useBuscarDenuncias());

    await waitFor(() => expect(result.current.denuncias).toHaveLength(1));
    expect(result.current.denuncias[0]).toMatchObject({
      evidence_image_url: "/media/reports/evidence/a.jpg",
      evidence_video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });
  });
});
