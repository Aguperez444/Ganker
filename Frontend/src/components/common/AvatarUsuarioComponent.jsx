import { useState } from "react";
import { urlDeMedia } from "../../utils/media";

/**
 * Contenido de un avatar de usuario: la foto de perfil si el backend la manda,
 * y si no la inicial del username.
 *
 * Renderiza solo el contenido, no el contenedor: el tamano, el borde y el
 * fondo los pone quien lo usa, porque el navbar y la pantalla de cuenta tienen
 * tratamientos distintos.
 *
 * Ojo: hoy GET /api/v1/users/me devuelve el mismo icon_url de ejemplo para
 * todos los usuarios (el use case no lo completa, se aplica el default del
 * DTO). Se muestra igual para tener el diseno completo en la review de sprint.
 * Cuando el backend guarde una imagen por usuario, esto funciona sin cambios.
 */
function AvatarUsuarioComponent({ user, alt }) {
  const [imagenFallo, setImagenFallo] = useState(false);

  const inicial = user?.username?.charAt(0).toUpperCase() ?? "G";
  const foto = imagenFallo ? null : urlDeMedia(user?.icon_url);

  if (!foto) {
    return <span aria-hidden="true">{inicial}</span>;
  }

  return (
    <img
      src={foto}
      alt={
        alt ??
        (user?.username
          ? `Foto de perfil de ${user.username}`
          : "Foto de perfil")
      }
      // Si la imagen no carga (ruta rota, backend caido) volvemos a la inicial
      // en vez de dejar el icono de imagen rota del navegador.
      onError={() => setImagenFallo(true)}
      className="h-full w-full rounded-full object-cover"
    />
  );
}

export default AvatarUsuarioComponent;
