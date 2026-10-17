import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import ListaConBuscadorComponent from "./ListaConBuscadorComponent";

const ROLES = [
  { id: 1, name: "Top" },
  { id: 2, name: "Jungla" },
  { id: 3, name: "Mid" },
];

function renderLista(props = {}) {
  return render(
    <ListaConBuscadorComponent
      items={ROLES}
      isLoading={false}
      error=""
      label="Buscar rol"
      placeholder="Buscar rol por nombre..."
      {...props}
    >
      {(filtrados) => (
        <ul>
          {filtrados.map((rol) => (
            <li key={rol.id}>{rol.name}</li>
          ))}
        </ul>
      )}
    </ListaConBuscadorComponent>
  );
}

describe("ListaConBuscadorComponent", () => {
  it("filtra la lista mientras se escribe", async () => {
    const usuario = userEvent.setup();
    renderLista();

    expect(screen.getAllByRole("listitem")).toHaveLength(3);

    await usuario.type(screen.getByLabelText("Buscar rol"), "JUN");

    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(
      ["Jungla"]
    );
    expect(screen.getByText("1 de 3")).toBeInTheDocument();
  });

  it("avisa cuando nada coincide", async () => {
    const usuario = userEvent.setup();
    renderLista();

    await usuario.type(screen.getByLabelText("Buscar rol"), "support");

    expect(
      screen.getByText('Ningún resultado coincide con "support".')
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("no muestra el buscador mientras carga, con error o sin elementos", () => {
    const { rerender } = renderLista({ isLoading: true });
    expect(screen.queryByLabelText("Buscar rol")).toBeNull();

    rerender(
      <ListaConBuscadorComponent
        items={[]}
        isLoading={false}
        error=""
        label="Buscar rol"
      >
        {() => <p>Sin roles</p>}
      </ListaConBuscadorComponent>
    );
    expect(screen.queryByLabelText("Buscar rol")).toBeNull();
    expect(screen.getByText("Sin roles")).toBeInTheDocument();
  });
});
