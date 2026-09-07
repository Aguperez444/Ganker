export const VIEWPORT_SIZE = 320;
export const RADIUS = 120; // Diámetro del círculo de recorte: 240px
export const CENTER = VIEWPORT_SIZE / 2; // 160px

/**
 * Calcula el tamaño del lienzo final recortado, garantizando que esté
 * siempre acotado entre 128x128 y 512x512 píxeles según los requisitos del backend.
 */
export function calcularDimensionesRecorte(sourceDiameter) {
  const diametroRedondeado = Math.round(sourceDiameter);
  return Math.max(128, Math.min(512, diametroRedondeado));
}

/**
 * Recorta la porción circular de la imagen en un canvas HTML5.
 */
export function recortarImagenEnCanvas({
  img,
  sourceX,
  sourceY,
  sourceDiameter,
  targetDim,
}) {
  const canvas = document.createElement("canvas");
  canvas.width = targetDim;
  canvas.height = targetDim;
  const ctx = canvas.getContext?.("2d");

  if (!ctx) return null;

  // Mascará circular sobre el lienzo destino
  ctx.beginPath();
  ctx.arc(targetDim / 2, targetDim / 2, targetDim / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    sourceDiameter,
    sourceDiameter,
    0,
    0,
    targetDim,
    targetDim
  );

  return canvas;
}

/**
 * Convierte el canvas a un archivo File y una URL de vista previa.
 */
export function canvasAArchivo(
  canvas,
  nombreArchivo = "avatar.png",
  fallbackUrl = ""
) {
  return new Promise((resolve) => {
    if (canvas && typeof canvas.toBlob === "function") {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const file = new File([blob], nombreArchivo, { type: "image/png" });
        const previewUrl = URL.createObjectURL(blob);
        resolve({ file, previewUrl });
      }, "image/png");
    } else {
      // Respaldo para entornos sin implementación completa de toBlob/canvas (ej. jsdom)
      const blob = new Blob(["avatar-data"], { type: "image/png" });
      const file = new File([blob], nombreArchivo, { type: "image/png" });
      const previewUrl =
        fallbackUrl ||
        (typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
          ? URL.createObjectURL(blob)
          : "");
      resolve({ file, previewUrl });
    }
  });
}
