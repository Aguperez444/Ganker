import { useState, useEffect, useRef, useCallback } from "react";
import {
  VIEWPORT_SIZE,
  RADIUS,
  CENTER,
  calcularDimensionesRecorte,
  recortarImagenEnCanvas,
  canvasAArchivo,
} from "../../utils/recorteAvatar";

function ModalRecortarAvatar({
  isOpen,
  imagenSrc,
  nombreArchivoOriginal = "avatar.png",
  onClose,
  onConfirm,
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [procesandoRecorte, setProcesandoRecorte] = useState(false);

  const imageRef = useRef(null);

  // Carga asíncrona de la imagen al abrir o cambiar la fuente
  useEffect(() => {
    if (!isOpen || !imagenSrc) return;

    let activo = true;
    const img = new Image();

    img.onload = () => {
      if (!activo) return;
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setCargando(false);
      setErrorCarga(null);
    };

    img.onerror = () => {
      if (!activo) return;
      setErrorCarga("No se pudo cargar la imagen para recortar.");
      setCargando(false);
    };

    img.src = imagenSrc;

    return () => {
      activo = false;
    };
  }, [isOpen, imagenSrc]);

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const { width: nw, height: nh } = imageSize;

  // Escala base mínima para que la imagen cubra completamente el círculo de 240px
  const scaleMin =
    nw > 0 && nh > 0 ? Math.max((2 * RADIUS) / nw, (2 * RADIUS) / nh) : 1;

  const currentScale = scaleMin * zoom;

  // Límites para que el círculo nunca quede fuera del área de la imagen
  const maxPanX = nw > 0 ? Math.max(0, (nw * currentScale) / 2 - RADIUS) : 0;
  const maxPanY = nh > 0 ? Math.max(0, (nh * currentScale) / 2 - RADIUS) : 0;

  const clampedX = Math.max(-maxPanX, Math.min(maxPanX, pan.x));
  const clampedY = Math.max(-maxPanY, Math.min(maxPanY, pan.y));

  // Diámetro en píxeles de la imagen original que entra en el círculo
  const sourceDiameter = currentScale > 0 ? (2 * RADIUS) / currentScale : 240;

  // Dimensión destino acotada estrictamente entre 128 y 512 px
  const targetDim = calcularDimensionesRecorte(sourceDiameter);

  // Manejo de arrastre (mouse y touch)
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ x: clampedX, y: clampedY });
  };

  const handleTouchStart = (e) => {
    if (!e.touches[0]) return;
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setPanStart({ x: clampedX, y: clampedY });
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e) => {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({
        x: panStart.x + dx,
        y: panStart.y + dy,
      });
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    const onTouchMove = (e) => {
      if (!e.touches[0]) return;
      const dx = e.touches[0].clientX - dragStart.x;
      const dy = e.touches[0].clientY - dragStart.y;
      setPan({
        x: panStart.x + dx,
        y: panStart.y + dy,
      });
    };

    const onTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging, dragStart, panStart]);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((prev) =>
      Math.max(1, Math.min(3, Number((prev + delta).toFixed(2))))
    );
  };

  const handleRestablecer = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleConfirmar = useCallback(async () => {
    if (!imageSize.width || !imageSize.height || procesandoRecorte) return;

    setProcesandoRecorte(true);

    try {
      const sourceX =
        imageSize.width / 2 - clampedX / currentScale - sourceDiameter / 2;
      const sourceY =
        imageSize.height / 2 - clampedY / currentScale - sourceDiameter / 2;

      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imagenSrc;
      });

      const canvas = recortarImagenEnCanvas({
        img,
        sourceX,
        sourceY,
        sourceDiameter,
        targetDim,
      });

      const nombreLimpio =
        nombreArchivoOriginal.replace(/\.[^.]+$/, "") || "avatar";
      const resultado = await canvasAArchivo(
        canvas,
        `${nombreLimpio}.png`,
        imagenSrc
      );

      if (resultado) {
        onConfirm(resultado.file, resultado.previewUrl);
      }
    } catch {
      setErrorCarga("Hubo un error al procesar el recorte de la imagen.");
    } finally {
      setProcesandoRecorte(false);
    }
  }, [
    imageSize,
    procesandoRecorte,
    clampedX,
    clampedY,
    currentScale,
    sourceDiameter,
    targetDim,
    imagenSrc,
    nombreArchivoOriginal,
    onConfirm,
  ]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-recorte-avatar"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-2xl">
        <header className="flex items-start justify-between">
          <div>
            <h3
              id="titulo-recorte-avatar"
              className="font-heading text-lg font-bold text-ganker-text"
            >
              Encuadrar foto de perfil
            </h3>
            <p className="mt-1 text-xs text-ganker-muted">
              Arrastrá y ajustá el zoom para centrar tu foto en el círculo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="cursor-pointer rounded-lg p-1.5 text-ganker-muted transition hover:bg-white/10 hover:text-ganker-text"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        {/* Contenedor de visualización con overlay circular */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onWheel={handleWheel}
          style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}
          className="relative mx-auto touch-none overflow-hidden rounded-xl bg-black/70 shadow-inner select-none cursor-grab active:cursor-grabbing"
        >
          {cargando && (
            <div className="flex h-full w-full items-center justify-center font-heading text-sm text-ganker-muted">
              Cargando imagen...
            </div>
          )}

          {errorCarga && (
            <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-ganker-error">
              {errorCarga}
            </div>
          )}

          {!cargando && !errorCarga && imagenSrc && (
            <img
              ref={imageRef}
              src={imagenSrc}
              alt="Área para recortar"
              draggable={false}
              style={{
                position: "absolute",
                left: `${CENTER}px`,
                top: `${CENTER}px`,
                transform: `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px)) scale(${currentScale})`,
                transformOrigin: "center center",
                maxWidth: "none",
                maxHeight: "none",
                pointerEvents: "none",
              }}
            />
          )}

          {/* Overlay circular SVG */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 ${VIEWPORT_SIZE} ${VIEWPORT_SIZE}`}
          >
            <defs>
              <mask id="avatar-circle-cutout">
                {/* Fondo blanco: opaco */}
                <rect
                  width={VIEWPORT_SIZE}
                  height={VIEWPORT_SIZE}
                  fill="white"
                />
                {/* Círculo negro: recorte transparente */}
                <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="black" />
              </mask>
            </defs>

            {/* Sombra oscura fuera del círculo */}
            <rect
              width={VIEWPORT_SIZE}
              height={VIEWPORT_SIZE}
              fill="rgba(8, 6, 31, 0.72)"
              mask="url(#avatar-circle-cutout)"
            />

            {/* Borde exterior del círculo con color de acento Ganker */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="#ff6b00"
              strokeWidth="2.5"
            />

            {/* Guía punteada interior */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="white"
              strokeWidth="1"
              strokeDasharray="4 4"
              className="opacity-70"
            />
          </svg>
        </div>

        {/* Controles de Zoom y Dimensiones */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setZoom((z) => Math.max(1, Number((z - 0.1).toFixed(2))))
              }
              disabled={zoom <= 1}
              className="cursor-pointer rounded-lg border border-white/10 bg-ganker-surface-light p-1.5 text-ganker-text transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Alejar"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 12H4"
                />
              </svg>
            </button>

            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Nivel de zoom"
              className="flex-1 accent-ganker-orange cursor-pointer"
            />

            <button
              type="button"
              onClick={() =>
                setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))
              }
              disabled={zoom >= 3}
              className="cursor-pointer rounded-lg border border-white/10 bg-ganker-surface-light p-1.5 text-ganker-text transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Acercar"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-ganker-muted">
            <button
              type="button"
              onClick={handleRestablecer}
              className="cursor-pointer font-medium text-ganker-purple-light hover:underline"
            >
              Restablecer posición
            </button>

            <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-xs text-ganker-text">
              Salida: {targetDim}×{targetDim} px
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={procesandoRecorte}
            className="cursor-pointer rounded-lg border border-white/10 px-4 py-2 font-heading text-xs font-semibold text-ganker-muted transition hover:bg-white/5 hover:text-ganker-text disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={cargando || Boolean(errorCarga) || procesandoRecorte}
            className="cursor-pointer rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple px-5 py-2 font-heading text-xs font-bold text-white uppercase transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {procesandoRecorte ? "Procesando..." : "Aplicar recorte"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalRecortarAvatar;
