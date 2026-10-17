import { useEffect, useState } from "react";
import { getPlayerDiscord } from "../../api/discordApi";
import { logError } from "../../utils/logs";
import IconoChicoComponent from "../common/IconoChicoComponent";

// Funcion de modulo por el mismo motivo que cargarEquipo en useEquipo.js
// (regla set-state-in-effect).
async function cargarDiscord({ userId, setEstado }) {
  try {
    setEstado({ userId, cuenta: await getPlayerDiscord(userId) });
  } catch (error) {
    // Es un dato extra del perfil: si falla, simplemente no se muestra
    logError("Error al cargar el Discord del jugador:", error);
    setEstado({ userId, cuenta: null });
  }
}

// Discord de otro jugador en su perfil publico. El backend solo lo devuelve
// si el jugador lo comparte con quien mira (todos o su equipo).
const DiscordJugadorComponent = ({ userId }) => {
  const [estado, setEstado] = useState({ userId: null, cuenta: null });
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    cargarDiscord({ userId, setEstado });
  }, [userId]);

  const cuenta = estado.userId === userId ? estado.cuenta : null;
  if (!cuenta?.linked) {
    return null;
  }

  const copiarUsuario = async () => {
    try {
      await navigator.clipboard.writeText(cuenta.username);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#5865F2]/30 bg-[#5865F2]/10 px-4 py-3">
      <IconoChicoComponent
        src={cuenta.avatar_url}
        alt=""
        className="h-9 w-9 shrink-0 rounded-full"
        placeholder
      />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-wide text-[#A5ADFF] uppercase">
          Discord
        </p>
        <p className="truncate text-sm font-semibold text-ganker-text">
          {cuenta.display_name}{" "}
          <span className="font-normal text-ganker-muted">
            @{cuenta.username}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={copiarUsuario}
          className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-ganker-text transition hover:bg-white/5"
        >
          {copiado ? "¡Copiado!" : "Copiar usuario"}
        </button>
        <a
          href={cuenta.profile_url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-[#5865F2] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#4752C4]"
        >
          Abrir en Discord
        </a>
      </div>
    </div>
  );
};

export default DiscordJugadorComponent;
