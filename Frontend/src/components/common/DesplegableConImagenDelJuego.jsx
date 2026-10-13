import IconSelectComponent from "./IconSelectComponent";

// Desplegable reutilizable para elegir un videojuego mostrando su imagen.
//
// Envuelve a IconSelectComponent (un <select> nativo no puede mostrar imagenes
// dentro de sus <option>) y centraliza como leer los datos de un juego, que
// segun de donde vengan usan id o videogame_id. Asi todos los desplegables de
// juego del front (filtros y formularios de admin) se ven igual.
function DesplegableConImagenDelJuego({
  id,
  value,
  onChange,
  options = [],
  placeholder = "Seleccioná un videojuego",
  disabled = false,
  error = false,
  buscable = false,
  incluirOpcionCualquiera = false,
}) {
  return (
    <IconSelectComponent
      id={id}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      buscable={buscable}
      incluirOpcionCualquiera={incluirOpcionCualquiera}
      getOptionId={(juego) => juego.id ?? juego.videogame_id}
      getOptionLabel={(juego) => juego.name}
      getOptionIcon={(juego) => juego.icon_url}
    />
  );
}

export default DesplegableConImagenDelJuego;
