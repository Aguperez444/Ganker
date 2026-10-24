import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ListaBaneosComponent from "./ListaBaneosComponent";

const EN_UNA_SEMANA = new Date(
  Date.now() + 7 * 24 * 60 * 60 * 1000
).toISOString();

function baneo(id, userId, expiresAt) {
  return {
    id,
    user_id: userId,
    username: `jugador${userId}`,
    admin_id: 1,
    admin_username: "admin",
    created_at: "2026-10-01T10:00:00+00:00",
    expires_at: expiresAt,
    reason: `motivo ${id}`,
  };
}

function renderLista(props = {}) {
  const callbacks = {
    onDesbanear: vi.fn(),
    onPaginaAnterior: vi.fn(),
    onPaginaSiguiente: vi.fn(),
  };
  render(
    <ListaBaneosComponent
      baneos={[]}
      cargando={false}
      error=""
      hayFiltros={false}
      pagina={0}
      hayMas={false}
      miId={1}
      {...callbacks}
      {...props}
    />
  );
  return callbacks;
}

describe("ListaBaneosComponent - Buscar jugadores baneados", () => {
  it("muestra un mensaje informativo si los filtros no tienen coincidencias", () => {
    renderLista({ hayFiltros: true });

    expect(
      screen.getByText(
        "No se encontraron baneos que coincidan con los filtros aplicados."
      )
    ).toBeInTheDocument();
  });

  it("muestra el detalle de cada baneo y quién lo aplicó", () => {
    renderLista({ baneos: [baneo(1, 10, EN_UNA_SEMANA)] });

    expect(screen.getByText("@jugador10 · ID 10")).toBeInTheDocument();
    expect(screen.getByText("motivo 1")).toBeInTheDocument();
    expect(screen.getByText(/Baneado por @admin/)).toBeInTheDocument();
    expect(screen.getByText("Vigente")).toBeInTheDocument();
  });

  it("ofrece Desbanear solo en los baneos vigentes", async () => {
    const user = userEvent.setup();
    const vigente = baneo(1, 10, EN_UNA_SEMANA);
    const { onDesbanear } = renderLista({
      baneos: [vigente, baneo(2, 20, "2026-01-01T00:00:00+00:00")],
    });

    expect(screen.getByText("Vencido")).toBeInTheDocument();
    const botones = screen.getAllByRole("button", { name: "Desbanear" });
    expect(botones).toHaveLength(1);

    await user.click(botones[0]);
    expect(onDesbanear).toHaveBeenCalledWith(vigente);
  });

  it("no ofrece Desbanear sobre la propia cuenta", () => {
    renderLista({ baneos: [baneo(1, 1, null)], miId: 1 });

    expect(
      screen.queryByRole("button", { name: "Desbanear" })
    ).not.toBeInTheDocument();
  });

  it("pagina hacia adelante y bloquea Anterior en la primera página", async () => {
    const user = userEvent.setup();
    const { onPaginaSiguiente } = renderLista({
      baneos: [baneo(1, 10, null)],
      hayMas: true,
    });

    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(onPaginaSiguiente).toHaveBeenCalled();
  });

  it("muestra el error de la búsqueda", () => {
    renderLista({ error: "No tenés permisos para ver los baneos." });

    expect(
      screen.getByText("No tenés permisos para ver los baneos.")
    ).toBeInTheDocument();
  });
});
