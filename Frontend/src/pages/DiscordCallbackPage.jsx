import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { linkDiscord } from "../api/discordApi";
import {
  guardarMensajeDiscord,
  tomarVisibilidadPendiente,
} from "../utils/discord";

// Discord vuelve aca despues de que el jugador autoriza (o cancela) en
// discord.com: /app/discord/callback?code=...&state=... (o ?error=...).
// Se canjea el codigo en el backend y se vuelve a Mi cuenta con el resultado.
const DiscordCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // El codigo de Discord se puede usar una sola vez: en desarrollo React
  // ejecuta los efectos dos veces (StrictMode) y el segundo canje fallaria.
  const yaProcesado = useRef(false);

  useEffect(() => {
    if (yaProcesado.current) return;
    yaProcesado.current = true;

    const volver = (mensaje) => {
      guardarMensajeDiscord(mensaje);
      navigate("/app/cuenta", { replace: true });
    };

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const visibility = tomarVisibilidadPendiente();

    if (searchParams.get("error") || !code || !state) {
      volver({
        tipo: "error",
        texto: "No se conectó Discord: la autorización se canceló.",
      });
      return;
    }

    linkDiscord({ code, state, visibility })
      .then((cuenta) =>
        volver({
          tipo: "exito",
          texto: `Tu cuenta de Discord @${cuenta.username} quedó conectada.`,
        })
      )
      .catch((error) =>
        volver({
          tipo: "error",
          texto:
            error.response?.data?.error ?? "No se pudo conectar tu Discord.",
        })
      );
  }, [searchParams, navigate]);

  return (
    <section className="flex min-h-full items-center justify-center bg-ganker-bg p-6">
      <p className="text-sm text-ganker-muted">Conectando con Discord...</p>
    </section>
  );
};

export default DiscordCallbackPage;
