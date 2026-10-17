import { useEffect, useRef, useState } from "react";
import { procesarCallbackFederado } from "../api/federatedAuthApi";
import { useAuth } from "../context/AuthContext";
import { CLAVE_REGISTRO_FEDERADO } from "../utils/proveedoresFederados";

// Arma el body del callback a partir de la query que dejó el proveedor:
// OAuth2 (Discord, Twitch, Google) manda `code`; Steam (OpenID 2.0) manda
// varios `openid.*` que el backend necesita tal cual para verificar la firma.
function leerParametrosCallback(searchParams) {
  const openidParams = {};
  for (const [clave, valor] of searchParams.entries()) {
    if (clave.startsWith("openid.")) {
      openidParams[clave] = valor;
    }
  }

  return {
    state: searchParams.get("state"),
    code: searchParams.get("code"),
    openidParams: Object.keys(openidParams).length > 0 ? openidParams : null,
  };
}

// Paso 2: procesa la vuelta del proveedor. Termina en uno de tres estados:
//   - "autenticado": la identidad ya estaba vinculada, la sesión quedó guardada.
//   - "registro": es la primera vez, hay que completar el registro.
//   - "error": se canceló o el backend rechazó el callback.
// La page decide a dónde navegar según el estado.
export function useCallbackFederado(provider, searchParams) {
  const { guardarSesion } = useAuth();
  const procesadoRef = useRef(false);
  const [resultado, setResultado] = useState({ estado: "verificando" });

  useEffect(() => {
    // El code/state de OAuth es de un solo uso: en StrictMode el efecto corre
    // dos veces y el segundo intento fallaría en el backend.
    if (procesadoRef.current) return;
    procesadoRef.current = true;

    function fallar(errorMensaje) {
      setResultado({ estado: "error", errorMensaje });
    }

    async function verificarCallback() {
      if (
        searchParams.get("error") ||
        searchParams.get("openid.mode") === "cancel"
      ) {
        fallar("Se canceló la autorización con el proveedor externo.");
        return;
      }

      const parametros = leerParametrosCallback(searchParams);
      if (!parametros.state) {
        fallar("La respuesta del proveedor externo está incompleta.");
        return;
      }

      try {
        const respuesta = await procesarCallbackFederado(provider, parametros);

        if (respuesta.status === "authenticated") {
          sessionStorage.removeItem(CLAVE_REGISTRO_FEDERADO);
          const usuario = await guardarSesion({
            access_token: respuesta.access_token,
            refresh_token: respuesta.refresh_token,
            token_type: respuesta.token_type || "bearer",
          });
          setResultado({ estado: "autenticado", usuario });
          return;
        }

        if (respuesta.status === "needs_registration") {
          sessionStorage.setItem(
            CLAVE_REGISTRO_FEDERADO,
            JSON.stringify(respuesta)
          );
          setResultado({ estado: "registro", datosFederados: respuesta });
          return;
        }

        fallar("No se pudo completar el inicio de sesión externo.");
      } catch (error) {
        fallar(
          error.response?.data?.error ??
            "No pudimos verificar tu cuenta con el proveedor. Volvé a intentarlo."
        );
      }
    }

    verificarCallback();
  }, [provider, searchParams, guardarSesion]);

  return resultado;
}
