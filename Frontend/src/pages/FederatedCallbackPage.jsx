import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { procesarCallbackFederado } from "../api/federatedAuthApi";
import { useAuth } from "../context/AuthContext";
import { rutaInicialPara } from "../utils/rutas";

export const CLAVE_REGISTRO_FEDERADO = "ganker_registro_federado";

function FederatedCallbackPage() {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { guardarSesion } = useAuth();
  const procesadoRef = useRef(false);
  const [errorMensaje, setErrorMensaje] = useState(null);

  useEffect(() => {
    if (procesadoRef.current) return;
    procesadoRef.current = true;

    async function verificarCallback() {
      const errorProveedor = searchParams.get("error");
      const openidMode = searchParams.get("openid.mode");

      if (errorProveedor || openidMode === "cancel") {
        setErrorMensaje("Se canceló la autorización con el proveedor externo.");
        return;
      }

      const state = searchParams.get("state");
      const code = searchParams.get("code");

      const openidParams = {};
      for (const [clave, valor] of searchParams.entries()) {
        if (clave.startsWith("openid.")) {
          openidParams[clave] = valor;
        }
      }

      if (!state) {
        setErrorMensaje("La respuesta del proveedor externo está incompleta.");
        return;
      }

      try {
        const respuesta = await procesarCallbackFederado(provider, {
          state,
          code,
          openidParams: Object.keys(openidParams).length > 0 ? openidParams : null,
        });

        if (respuesta.status === "authenticated") {
          sessionStorage.removeItem(CLAVE_REGISTRO_FEDERADO);
          const usuario = await guardarSesion({
            access_token: respuesta.access_token,
            refresh_token: respuesta.refresh_token,
            token_type: respuesta.token_type || "bearer",
          });
          navigate(rutaInicialPara(usuario), { replace: true });
          return;
        }

        if (respuesta.status === "needs_registration") {
          sessionStorage.setItem(CLAVE_REGISTRO_FEDERADO, JSON.stringify(respuesta));
          navigate("/completar-registro", {
            replace: true,
            state: { datosFederados: respuesta },
          });
          return;
        }

        setErrorMensaje("No se pudo completar el inicio de sesión externo.");
      } catch (error) {
        const mensaje =
          error.response?.data?.error ||
          "No pudimos verificar tu cuenta con el proveedor. Volvé a intentarlo.";
        setErrorMensaje(mensaje);
      }
    }

    verificarCallback();
  }, [provider, searchParams, guardarSesion, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ganker-bg px-6">
      <div className="w-full max-w-md rounded-2xl border border-ganker-bg bg-ganker-surface p-8 text-center shadow-[0_0px_10px] shadow-ganker-purple">
        {!errorMensaje ? (
          <div className="space-y-4">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-ganker-purple border-t-ganker-orange" />
            <h1 className="font-heading text-xl font-bold text-ganker-text">
              Verificando tu cuenta...
            </h1>
            <p className="font-body text-sm text-ganker-muted">
              Estamos conectando tu identidad con Ganker.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <h1 className="font-heading text-xl font-bold text-ganker-text">
              No se pudo iniciar sesión
            </h1>
            <p
              role="alert"
              className="rounded-lg border border-ganker-error/40 bg-ganker-error/10 px-4 py-3 font-body text-sm text-ganker-error"
            >
              {errorMensaje}
            </p>
            <div className="flex justify-center gap-3">
              <Link
                to="/login"
                className="w-full rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple py-2.5 font-heading text-sm font-bold tracking-wide text-ganker-text uppercase transition hover:brightness-110"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default FederatedCallbackPage;
