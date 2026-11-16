import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ListaDenunciasComponent from "./ListaDenunciasComponent";

const DENUNCIA = {
  id: 3,
  reported_user_id: 7,
  reported_user_name: "ana",
  reporter_user_id: 1,
  reporter_user_name: "beto",
  status: "pending",
  reason: "cheating",
  description: "Usaba cheats",
  created_at: "2026-11-01T12:00:00Z",
  resolved_at: null,
  resolved_by: null,
  evidence_image_url: null,
  evidence_video_url: null,
};

describe("ListaDenunciasComponent - evidencia", () => {
  it("muestra la imagen y el video adjuntos como links a otra pestaña", () => {
    render(
      <ListaDenunciasComponent
        denuncias={[
          {
            ...DENUNCIA,
            evidence_image_url: "https://cdn.test/reports/evidence/a.png",
            evidence_video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          },
        ]}
      />
    );

    const imagen = screen.getByRole("img", {
      name: /evidencia de la denuncia 3/i,
    });
    expect(imagen).toHaveAttribute(
      "src",
      "https://cdn.test/reports/evidence/a.png"
    );
    expect(imagen.closest("a")).toHaveAttribute("target", "_blank");

    const video = screen.getByRole("link", { name: /ver video/i });
    expect(video).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
    expect(video).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("muestra un guion cuando la denuncia no tiene evidencia", () => {
    render(<ListaDenunciasComponent denuncias={[DENUNCIA]} />);

    expect(
      screen.getByRole("columnheader", { name: "Evidencia" })
    ).toBeVisible();
    expect(screen.queryByRole("link", { name: /ver video/i })).toBeNull();
  });
});
