import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { useCallbackFederado } from "../hooks/useCallbackFederado";
import { rutaInicialPara } from "../utils/rutas";

// Pantalla a la que vuelve el proveedor externo (/auth/callback/:provider).
// Mientras el hook verifica, muestra un spinner; después redirige o muestra
// el error.
function CallbackFederadoPage() {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const { estado, usuario, datosFederados, errorMensaje } = useCallbackFederado(
    provider,
    searchParams
  );

  if (estado === "autenticado") {
    return <Navigate to={rutaInicialPara(usuario)} replace />;
  }

  if (estado === "registro") {
    return (
      <Navigate to="/completar-registro" replace state={{ datosFederados }} />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ganker-bg px-6">
      <div className="w-full max-w-md rounded-2xl border border-ganker-bg bg-ganker-surface p-8 text-center shadow-[0_0px_10px] shadow-ganker-purple">
        {estado === "verificando" ? (
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

export default CallbackFederadoPage;
