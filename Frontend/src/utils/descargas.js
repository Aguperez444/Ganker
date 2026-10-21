// Dispara la descarga de un archivo que ya esta en memoria (ej. un reporte
// exportado). Se libera la URL un rato despues para que el navegador llegue a
// empezar a leerla.
export function descargarArchivo(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
