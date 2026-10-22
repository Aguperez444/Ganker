import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { linkDiscord } from "../api/discordApi";
import {
  guardarMensajeDiscord,
  tomarVisibilidadPendiente,
} from "../utils/discord";

// Canjea el ?code=&state= con el que vuelve Discord (ver DiscordCallbackPage)
// y vuelve a Mi cuenta con el resultado guardado en sessionStorage.
function useVincularDiscord() {
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
}

export default useVincularDiscord;
