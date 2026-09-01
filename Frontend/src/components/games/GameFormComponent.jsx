import { useState } from "react";
import { createGame } from "../../api/gameApi";

const GameForm = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const trimmedName = name.trim();

    // Validación frontend
    if (!trimmedName) {
      setError("El nombre del videojuego es obligatorio.");
      return;
    }

    try {
      setIsLoading(true);

      const videogame = await createGame(trimmedName);

      setSuccessMessage(
        `Videojuego "${videogame.name}" registrado correctamente.`
      );
      setName("");
    } catch (error) {
      if (error.response?.status === 400) {
        setError("El nombre ingresado no es válido.");
      } else if (error.response?.status === 409) {
        setError("Ya existe un videojuego registrado con ese nombre.");
      } else {
        setError("Ocurrió un error al registrar el videojuego.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label
          htmlFor="game-name"
          className=" mb-2 block text-sm font-medium text-ganker-text"
        >
          Nombre del videojuego
        </label>

        <div className="relative">
          <input
            id="game-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej: Valorant"
            disabled={isLoading}
            className="w-full rounded-lg border border-white/10 bg-ganker-surface-light py-3 pr-4 pl-12 text-ganker-text placeholder:text-ganker-muted outline-none transition-all duration-200 focus:border-ganker-purple-light focus:ring-2 focus:ring-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {error && <p className=" mt-2 text-sm text-ganker-error">{error}</p>}
      </div>

      {successMessage && (
        <div className="rounded-lg border border-ganker-success/20 bg-ganker-success/10 px-4 py-3">
          <p className="text-sm text-ganker-success">✓ {successMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className=" w-full cursor-pointer rounded-lg bg-gradient-to-r from-ganker-orange via-ganker-orange-light to-ganker-purple px-5 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-ganker-purple/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50
        "
      >
        {isLoading ? "REGISTRANDO..." : "REGISTRAR VIDEOJUEGO"}
      </button>
    </form>
  );
};

export default GameForm;
