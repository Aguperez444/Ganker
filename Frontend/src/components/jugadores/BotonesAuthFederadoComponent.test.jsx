import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import BotonesAuthFederadoComponent from "./BotonesAuthFederadoComponent";

describe("BotonesAuthFederadoComponent", () => {
  it("muestra un botón por proveedor y avisa cuál se eligió", async () => {
    const onConectar = vi.fn();
    render(<BotonesAuthFederadoComponent onConectar={onConectar} />);

    for (const nombre of ["Discord", "Steam", "Twitch", "Google"]) {
      expect(screen.getByRole("button", { name: nombre })).toBeEnabled();
    }

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Steam" }));
    expect(onConectar).toHaveBeenCalledWith("steam");
  });

  it("marca el proveedor que está cargando y deshabilita todos", () => {
    render(
      <BotonesAuthFederadoComponent
        proveedorCargando="twitch"
        onConectar={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: "Conectando..." })
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Discord" })).toBeDisabled();
  });

  it("se deshabilita mientras el formulario está enviando", () => {
    render(<BotonesAuthFederadoComponent deshabilitado onConectar={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Google" })).toBeDisabled();
  });

  it("muestra el error que recibe por props", () => {
    render(
      <BotonesAuthFederadoComponent
        error="Discord no está disponible."
        onConectar={vi.fn()}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Discord no está disponible."
    );
  });
});
