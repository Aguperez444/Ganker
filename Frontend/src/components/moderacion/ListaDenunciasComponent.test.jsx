import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ListaDenunciasComponent from "./ListaDenunciasComponent";

vi.mock("../../api/moderacionApi", () => ({
  obtenerDenunciasCruzadas: vi.fn().mockResolvedValue({ reports: [] }),
}));

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

describe("ListaDenunciasComponent", () => {
  it("resume los reportes y abre toda la información y evidencia en el detalle", async () => {
    const user = userEvent.setup();
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

    expect(
      screen.getAllByRole("columnheader").map((celda) => celda.textContent)
    ).toEqual(["Denunciado", "Denunciante", "Motivo", "Estado", "Detalle"]);
    expect(screen.getByText("@ana")).toBeVisible();
    expect(screen.getByText("@beto")).toBeVisible();
    expect(screen.getByText("Pendiente")).toBeVisible();
    expect(screen.queryByText("Usaba cheats")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();

    const abrir = screen.getByRole("button", { name: /ver detalle/i });
    await user.click(abrir);
    const detalle = screen.getByRole("dialog", { name: "Detalle del reporte" });
    expect(within(detalle).getByText("Reporte #3")).toBeVisible();
    expect(within(detalle).getByText("Usaba cheats")).toBeVisible();
    expect(within(detalle).getByText("ID 7")).toBeVisible();
    expect(within(detalle).getByText("ID 1")).toBeVisible();
    expect(within(detalle).getByText("Creado")).toBeVisible();
    expect(within(detalle).getByText("Sin resolución")).toBeVisible();
    const imagen = within(detalle).getByRole("img", {
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
    expect(
      screen.getByTitle("Video de evidencia del reporte 3")
    ).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    );

    await user.click(within(detalle).getByRole("button", { name: /cerrar/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(abrir).toHaveFocus();
  });

  it("indica cuando no hay evidencia y permite cerrar con Escape", async () => {
    const user = userEvent.setup();
    render(<ListaDenunciasComponent denuncias={[DENUNCIA]} />);

    await user.click(screen.getByRole("button", { name: /ver detalle/i }));
    expect(screen.getByText("No se adjuntó evidencia.")).toBeVisible();
    expect(screen.queryByRole("link", { name: /ver video/i })).toBeNull();
    expect(screen.queryByTitle(/video de evidencia/i)).toBeNull();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("abre el reporte seleccionado y conserva sus datos de resolución", async () => {
    const user = userEvent.setup();
    render(
      <ListaDenunciasComponent
        denuncias={[
          DENUNCIA,
          {
            ...DENUNCIA,
            id: 4,
            reported_user_name: "carlos",
            status: "resolved",
            description: "Insultos reiterados",
            resolved_by: "admin",
            resolved_at: "2026-11-02T12:00:00Z",
          },
        ]}
      />
    );
    await user.click(
      screen.getByRole("button", { name: /ver detalle.*carlos/i })
    );
    const detalle = screen.getByRole("dialog");
    expect(within(detalle).getByText("Reporte #4")).toBeVisible();
    expect(within(detalle).getByText("@admin")).toBeVisible();
    expect(within(detalle).getByText("Insultos reiterados")).toBeVisible();
    expect(within(detalle).queryByText("Usaba cheats")).toBeNull();
    expect(within(detalle).queryByText("Sin resolución")).toBeNull();
  });

  it("muestra el video aunque no se haya adjuntado una imagen", async () => {
    const user = userEvent.setup();
    render(
      <ListaDenunciasComponent
        denuncias={[
          {
            ...DENUNCIA,
            evidence_video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          },
        ]}
      />
    );
    await user.click(screen.getByRole("button", { name: /ver detalle/i }));
    expect(screen.getByTitle(/video de evidencia/i)).toBeVisible();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByText("No se adjuntó evidencia.")).toBeNull();
  });
});
