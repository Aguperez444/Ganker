import FondoJuegoComponent from "../inicio/FondoJuegoComponent";
import SelectorJuegoComponent from "./SelectorJuegoComponent";

function SelectorJuegoConBannerComponent({
  etiqueta = "Videojuego",
  juegos,
  value,
  onChange,
}) {
  const juegoSeleccionado = juegos.find(
    (juego) => String(juego.id) === String(value)
  );

  return (
    <FondoJuegoComponent
      nombreJuego={juegoSeleccionado?.name}
      className="rounded-xl border border-white/10"
    >
      <div className="flex min-h-44 flex-col justify-end gap-4 p-4 sm:min-h-56 sm:p-6">
        <div>
          <h2 className="mt-1 font-heading text-2xl font-bold text-ganker-text drop-shadow-lg">
            {juegoSeleccionado?.name ?? "Seleccioná un videojuego"}
          </h2>
        </div>

        <SelectorJuegoComponent
          etiqueta={etiqueta}
          juegos={juegos}
          value={value}
          onChange={onChange}
        />
      </div>
    </FondoJuegoComponent>
  );
}

export default SelectorJuegoConBannerComponent;
