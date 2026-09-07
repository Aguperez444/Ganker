import { useEffect, useRef, useState } from "react";

const RankForm = ({
  games = [],
  initialVideogameId = "",
  isLoading = false,
  error = "",
  onSubmit,
  onCancel,
}) => {
  const [videogameId, setVideogameId] = useState(initialVideogameId ?? "");
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [iconFile, setIconFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const processFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setValidationError(
        "El archivo seleccionado debe ser una imagen (PNG, JPG, WEBP o SVG)."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setValidationError("La imagen no debe superar los 5 MB.");
      return;
    }

    setValidationError("");
    setIconFile(file);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileChange = (event) => {
    processFile(event.target.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isLoading) return;

    processFile(e.dataTransfer.files?.[0]);
  };

  const handleRemoveIcon = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setIconFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setValidationError("");

    const trimmedName = name.trim();

    if (!videogameId) {
      setValidationError("Debés seleccionar un videojuego.");
      return;
    }

    if (!trimmedName) {
      setValidationError("El nombre del rango es obligatorio.");
      return;
    }

    if (value === "" || Number.isNaN(Number(value))) {
      setValidationError("El valor jerárquico del rango es obligatorio.");
      return;
    }

    if (!iconFile) {
      setValidationError("La imagen del ícono es obligatoria.");
      return;
    }

    await onSubmit({
      videogame_id: Number(videogameId),
      name: trimmedName,
      value: Number(value),
      icon: iconFile,
    });
  };

  const displayedError = validationError || error;

  const hasChanges =
    Boolean(videogameId) && name.trim().length > 0 && value !== "" && iconFile !== null;

  return (
    <section className="rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl">
      <header className="mb-6">
        <h2 className="font-heading text-xl font-semibold text-ganker-text">
          Registrar rango
        </h2>

        <p className="mt-1 text-sm text-ganker-muted">
          Agregá un nuevo rango para un videojuego.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label
            htmlFor="rank-videogame"
            className="mb-2 block text-sm font-medium text-ganker-text"
          >
            Videojuego <span className="text-ganker-orange">*</span>
          </label>

          <select
            id="rank-videogame"
            value={videogameId}
            onChange={(event) => {
              setVideogameId(event.target.value);
              if (validationError) setValidationError("");
            }}
            disabled={isLoading}
            className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-4 py-3 text-ganker-text outline-none transition-all duration-200 focus:border-ganker-purple-light focus:ring-2 focus:ring-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              Seleccioná un videojuego
            </option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="rank-name"
            className="mb-2 block text-sm font-medium text-ganker-text"
          >
            Nombre del rango <span className="text-ganker-orange">*</span>
          </label>

          <input
            id="rank-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (validationError) setValidationError("");
            }}
            placeholder="Ej: Oro"
            disabled={isLoading}
            className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-4 py-3 text-ganker-text placeholder:text-ganker-muted outline-none transition-all duration-200 focus:border-ganker-purple-light focus:ring-2 focus:ring-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="rank-value"
            className="mb-2 block text-sm font-medium text-ganker-text"
          >
            Valor jerárquico <span className="text-ganker-orange">*</span>
          </label>

          <input
            id="rank-value"
            type="number"
            min="0"
            step="1"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (validationError) setValidationError("");
            }}
            placeholder="Ej: 2 (a mayor valor, mayor jerarquía)"
            disabled={isLoading}
            className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-4 py-3 text-ganker-text placeholder:text-ganker-muted outline-none transition-all duration-200 focus:border-ganker-purple-light focus:ring-2 focus:ring-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="rank-icon"
            className="mb-2 block text-sm font-medium text-ganker-text"
          >
            Ícono del rango <span className="text-ganker-orange">*</span>
          </label>

          <input
            ref={fileInputRef}
            id="rank-icon"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFileChange}
            disabled={isLoading}
            className="sr-only"
          />

          {previewUrl ? (
            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-ganker-surface-light p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-ganker-surface">
                <img
                  src={previewUrl}
                  alt="Vista previa del ícono"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ganker-text">
                  {iconFile.name}
                </p>
                <p className="text-xs text-ganker-muted">
                  {(iconFile.size / 1024).toFixed(1)} KB
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-ganker-purple-light transition hover:bg-ganker-purple/20 hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cambiar
                </button>
                <button
                  type="button"
                  onClick={handleRemoveIcon}
                  disabled={isLoading}
                  className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-ganker-error transition hover:bg-ganker-error/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Quitar
                </button>
              </div>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-6 text-center transition-all duration-200 ${
                isDragging
                  ? "border-ganker-purple-light bg-ganker-purple/10 scale-[1.01]"
                  : "border-white/15 bg-ganker-surface-light/60 hover:border-ganker-purple-light/60 hover:bg-ganker-surface-light"
              } ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-ganker-purple/20 text-ganker-purple-light">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <p className="text-sm font-medium text-ganker-text">
                Subir imagen del ícono
              </p>
              <p className="mt-1 text-xs text-ganker-muted">
                Hacé clic o arrastrá un archivo aquí (PNG, JPG, WEBP o SVG, máx.
                5 MB)
              </p>
            </div>
          )}

          {displayedError && (
            <p className="mt-2 text-sm text-ganker-error">{displayedError}</p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="cursor-pointer rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isLoading || !hasChanges}
            className="cursor-pointer rounded-lg bg-gradient-to-r from-ganker-orange via-ganker-orange-light to-ganker-purple px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-ganker-purple/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "REGISTRANDO..." : "REGISTRAR RANGO"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default RankForm;
