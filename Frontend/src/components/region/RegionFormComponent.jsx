import { useState } from "react";

const RegionForm = ({
  mode = "create",
  games = [],
  initialVideogameId = "",
  initialName = "",
  isLoading = false,
  error = "",
  onSubmit,
  onCancel,
}) => {
  const [videogameId, setVideogameId] = useState(initialVideogameId ?? "");

  const [name, setName] = useState(initialName);
  const [validationError, setValidationError] = useState("");

  const isEditMode = mode === "edit";

  const handleSubmit = async (event) => {
    event.preventDefault();

    setValidationError("");

    const trimmedName = name.trim();

    if (!videogameId) {
      setValidationError("Debés seleccionar un videojuego.");
      return;
    }

    if (!trimmedName) {
      setValidationError("El nombre de la región es obligatorio.");
      return;
    }

    await onSubmit({
      videogame_id: Number(videogameId),
      name: trimmedName,
    });
  };

  const displayedError = validationError || error;

  const hasChanges = isEditMode
    ? name.trim().length > 0 && name.trim() !== initialName.trim()
    : Boolean(videogameId) && name.trim().length > 0;

  const title = isEditMode ? "Modificar región" : "Registrar región";

  const description = isEditMode
    ? "Actualizá el nombre de la región."
    : "Agregá una nueva región para un videojuego.";

  const buttonText = isEditMode ? "GUARDAR CAMBIOS" : "REGISTRAR REGIÓN";

  const loadingText = isEditMode ? "GUARDANDO..." : "REGISTRANDO...";

  return (
    <section className="rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl">
      <header className="mb-6">
        <h2 className="font-heading text-xl font-semibold text-ganker-text">
          {title}
        </h2>

        <p className="mt-1 text-sm text-ganker-muted">{description}</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label
            htmlFor="region-videogame"
            className="mb-2 block text-sm font-medium text-ganker-text"
          >
            Videojuego <span className="text-ganker-orange">*</span>
          </label>

          <select
            id="region-videogame"
            value={videogameId}
            onChange={(event) => {
              setVideogameId(event.target.value);

              if (validationError) {
                setValidationError("");
              }
            }}
            disabled={isLoading || isEditMode}
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

          {isEditMode && (
            <p className="mt-2 text-xs text-ganker-muted">
              El videojuego asociado a una región no puede modificarse.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="region-name"
            className="mb-2 block text-sm font-medium text-ganker-text"
          >
            Nombre de la región <span className="text-ganker-orange">*</span>
          </label>

          <input
            id="region-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);

              if (validationError) {
                setValidationError("");
              }
            }}
            placeholder="Ej: LAS"
            disabled={isLoading}
            className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-4 py-3 text-ganker-text placeholder:text-ganker-muted outline-none transition-all duration-200 focus:border-ganker-purple-light focus:ring-2 focus:ring-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50"
          />

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
            {isLoading ? loadingText : buttonText}
          </button>
        </div>
      </form>
    </section>
  );
};

export default RegionForm;
