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

      await createGame(trimmedName);

      setSuccessMessage("Videojuego registrado correctamente.");
      setName("");
    } catch (error) {
      if (error.response?.status === 409) {
        setError("Ya existe un videojuego registrado con ese nombre.");
      } else {
        setError(
          "Ocurrió un error al registrar el videojuego. Inténtalo nuevamente."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-5"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="game-name" className="text-sm font-medium">
          Nombre del videojuego
        </label>

        <input
          id="game-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej: Valorant"
          disabled={isLoading}
          className="rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {successMessage && (
        <p className="text-sm text-green-600">{successMessage}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-lg bg-primary px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Registrando..." : "Registrar videojuego"}
      </button>
    </form>
  );
};

export default GameForm;
