export const ESTADOS_APELACION = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

export function validarImagenesApelacion(archivos) {
  if (archivos.length > 3) return "Podés adjuntar hasta 3 imágenes.";
  for (const archivo of archivos) {
    if (
      !/\.(png|jpe?g|webp)$/i.test(archivo.name) ||
      !["image/png", "image/jpeg", "image/webp"].includes(archivo.type)
    ) {
      return "Adjuntá imágenes PNG, JPG o WebP.";
    }
    if (archivo.size > 2 * 1024 * 1024)
      return "Cada imagen puede pesar hasta 2 MB.";
  }
  return "";
}

export function mensajeErrorApelacion(error) {
  if (error.response?.status === 401)
    return "El permiso para apelar venció. Volvé a iniciar sesión.";
  return (
    error.response?.data?.error ||
    "No se pudo completar la operación. Probá de nuevo."
  );
}
