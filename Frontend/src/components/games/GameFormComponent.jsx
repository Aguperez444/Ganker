import { useEffect, useState } from "react";

const GameForm = ({
  mode = "create",
  initialName = "",
  isLoading = false,
  error = "",
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(initialName);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    setName(initialName);
    setValidationError("");
  }, [initialName, mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setValidationError("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setValidationError("El nombre del videojuego es obligatorio.");
      return;
    }

    await onSubmit(trimmedName);
  };

  const title =
    mode === "edit" ? "Modificar videojuego" : "Registrar videojuego";

  const description =
    mode === "edit"
      ? "Actualizá la información del videojuego."
      : "Agregá un nuevo videojuego a la plataforma.";

  const buttonText =
    mode === "edit" ? "GUARDAR CAMBIOS" : "REGISTRAR VIDEOJUEGO";

  const loadingText = mode === "edit" ? "GUARDANDO..." : "REGISTRANDO...";

  const displayedError = validationError || error;

  const hasChanges = mode === "create" || name.trim() !== initialName.trim();

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
            htmlFor="game-name"
            className="mb-2 block text-sm font-medium text-ganker-text"
          >
            Nombre del videojuego
          </label>

          <input
            id="game-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);

              if (validationError) {
                setValidationError("");
              }
            }}
            placeholder="Ej: Valorant"
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

export default GameForm;
