import { useState } from "react";
import { actualizarJugador } from "../api/jugadoresApi";
import { useAuth } from "../context/AuthContext";
import { validarFormularioCuenta } from "../utils/validaciones";

/**
 * US 02 - Como jugador, quiero modificar mis datos.
 *
 * Los campos editables son los que acepta PUT /api/v1/users/: nombre,
 * username y mail. La contrasena queda deliberadamente afuera (US 34).
 *
 * Sigue el mismo patron que useRegistrarJugador: valida en el blur de cada
 * campo y de nuevo entero antes de mandar, asi un formulario invalido nunca
 * llega al backend.
 *
 * handleSubmit devuelve el dato util o null, igual que los otros hooks de
 * formulario: useRegistrarJugador devuelve los tokens y useIniciarSesion el
 * usuario logueado. Aca devuelve el usuario ya actualizado.
 */
export function useModificarJugador() {
  const { user, refrescarUsuario } = useAuth();

  // El formulario arranca con los datos actuales del jugador. Dentro de una
  // ruta protegida `user` siempre esta cargado (ver la invariante de
  // AuthContext), asi que se puede leer directo.
  const [valores, setValores] = useState({
    nombre: user.name,
    username: user.username,
    mail: user.mail ?? "",
    icon: null,
  });

  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const [exito, setExito] = useState(null);

  function handleChange(campo, valor) {
    setValores((prev) => ({ ...prev, [campo]: valor }));
    // Si el jugador vuelve a editar, la confirmacion anterior ya no aplica.
    setExito(null);
  }

  function handleAvatarChange(archivo, previewUrl) {
    setValores((prev) => ({ ...prev, icon: archivo }));
    setPreviewAvatar(previewUrl);
    setExito(null);
    setErrores((prev) => {
      const resto = { ...prev };
      delete resto.icon;
      return resto;
    });
  }

  function handleQuitarAvatar() {
    setValores((prev) => ({ ...prev, icon: null }));
    if (previewAvatar) {
      URL.revokeObjectURL(previewAvatar);
    }
    setPreviewAvatar(null);
    setExito(null);
  }

  function handleBlur(campo) {
    const erroresActuales = validarFormularioCuenta(valores);
    setErrores((prev) => ({ ...prev, [campo]: erroresActuales[campo] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorServidor(null);
    setExito(null);

    const erroresValidacion = validarFormularioCuenta(valores);
    setErrores(erroresValidacion);
    if (Object.keys(erroresValidacion).length > 0) return null;

    setCargando(true);
    try {
      await actualizarJugador(valores);

      // El PUT ya devuelve el jugador actualizado, pero igual pedimos /me para
      // que `user` siga saliendo de una sola fuente. De paso, el navbar y
      // cualquier otra pantalla se enteran del cambio sin recargar.
      const usuarioActualizado = await refrescarUsuario();

      if (previewAvatar) {
        URL.revokeObjectURL(previewAvatar);
        setPreviewAvatar(null);
      }
      setValores((prev) => ({ ...prev, icon: null }));

      setExito("Tus datos se guardaron correctamente.");
      return usuarioActualizado;
    } catch (error) {
      const mensaje = error.response?.data?.error;

      // El backend responde 409 tanto si el username como si el mail ya estan
      // ocupados, y solo se distinguen por el texto:
      //   UsernameAlreadyExistsException -> 'El username: "x" ya está ocupado.'
      //   MailAlreadyExistsException     -> 'El correo: "x" ya está ocupado.'
      if (error.response?.status === 409) {
        const texto = mensaje?.toLowerCase() ?? "";

        if (texto.includes("username")) {
          setErrores((prev) => ({ ...prev, username: mensaje }));
        } else if (texto.includes("correo") || texto.includes("email")) {
          setErrores((prev) => ({ ...prev, mail: mensaje }));
        } else {
          setErrorServidor(
            mensaje ?? "Esos datos ya están en uso por otra cuenta."
          );
        }
      } else {
        setErrorServidor(
          mensaje ?? "No se pudieron guardar los cambios. Probá de nuevo."
        );
      }

      return null;
    } finally {
      setCargando(false);
    }
  }

  return {
    valores,
    previewAvatar,
    errores,
    cargando,
    errorServidor,
    exito,
    handleChange,
    handleBlur,
    handleAvatarChange,
    handleQuitarAvatar,
    handleSubmit,
  };
}
