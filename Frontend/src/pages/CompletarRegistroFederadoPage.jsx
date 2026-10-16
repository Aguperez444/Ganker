import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { completarRegistroFederado } from "../api/federatedAuthApi";
import AuthLayout from "../components/common/AuthLayout";
import CampoTexto from "../components/common/CampoTexto";
import { PROVEEDORES_FEDERADOS } from "../components/jugadores/BotonesAuthFederado";
import { useAuth } from "../context/AuthContext";
import { rutaInicialPara } from "../utils/rutas";
import { validarFormularioRegistroFederado } from "../utils/validaciones";
import { CLAVE_REGISTRO_FEDERADO } from "./FederatedCallbackPage";

const ICONO_USUARIO = (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const ICONO_MAIL = (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 8l9 6 9-6M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
    />
  </svg>
);

function leerDatosFederados(locationState) {
  if (locationState?.datosFederados?.registration_token) {
    return locationState.datosFederados;
  }
  try {
    const guardado = sessionStorage.getItem(CLAVE_REGISTRO_FEDERADO);
    if (!guardado) return null;
    const parseado = JSON.parse(guardado);
    return parseado?.registration_token ? parseado : null;
  } catch {
    return null;
  }
}

function CompletarRegistroFederadoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { guardarSesion } = useAuth();

  const [datosFederados] = useState(() => leerDatosFederados(location.state));
  const [valores, setValores] = useState(() => ({
    username: datosFederados?.suggested_username || "",
    nombre: datosFederados?.suggested_name || "",
    mail: datosFederados?.email || "",
  }));
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);

  if (!datosFederados) {
    return <Navigate to="/registro" replace />;
  }

  const infoProveedor = PROVEEDORES_FEDERADOS.find(
    (p) => p.id === datosFederados.provider
  );
  const nombreProveedor = infoProveedor?.nombre || datosFederados.provider;

  function handleChange(campo, valor) {
    const nuevos = { ...valores, [campo]: valor };
    setValores(nuevos);
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
  }

  function handleBlur(campo) {
    const erroresActuales = validarFormularioRegistroFederado(valores);
    setErrores((prev) => ({ ...prev, [campo]: erroresActuales[campo] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorServidor(null);

    const erroresValidacion = validarFormularioRegistroFederado(valores);
    setErrores(erroresValidacion);
    if (Object.keys(erroresValidacion).length > 0) return;

    setCargando(true);
    try {
      const tokens = await completarRegistroFederado({
        registrationToken: datosFederados.registration_token,
        username: valores.username,
        nombre: valores.nombre,
        mail: valores.mail,
      });

      sessionStorage.removeItem(CLAVE_REGISTRO_FEDERADO);
      const usuario = await guardarSesion(tokens);
      navigate(rutaInicialPara(usuario), { replace: true });
    } catch (error) {
      const mensaje = error.response?.data?.error;
      if (error.response?.status === 409) {
        const texto = mensaje?.toLowerCase() ?? "";
        if (texto.includes("username")) {
          setErrores((prev) => ({ ...prev, username: mensaje }));
        } else if (texto.includes("email") || texto.includes("correo")) {
          setErrores((prev) => ({ ...prev, mail: mensaje }));
        } else {
          setErrorServidor(mensaje ?? "Esos datos ya están en uso por otra cuenta.");
        }
      } else {
        setErrorServidor(
          mensaje ?? "No se pudo completar el registro. Probá de nuevo."
        );
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthLayout>
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-ganker-bg bg-ganker-surface p-8 shadow-[0_0px_10px] shadow-ganker-purple"
      >
        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-ganker-bg/60 p-4">
          {datosFederados.avatar_url ? (
            <img
              src={datosFederados.avatar_url}
              alt={`Avatar de ${nombreProveedor}`}
              className="h-12 w-12 shrink-0 rounded-full border border-ganker-purple/50 object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ganker-purple/30 text-ganker-text">
              {infoProveedor?.icono}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {infoProveedor?.icono}
              <h2 className="font-heading text-base font-bold text-ganker-text">
                Completá tu registro con {nombreProveedor}
              </h2>
            </div>
            <p className="mt-0.5 font-body text-xs text-ganker-muted">
              Elegí tu nombre de usuario y tu nombre visible antes de entrar a Ganker.
            </p>
          </div>
        </div>

        <CampoTexto
          label="NOMBRE DE USUARIO"
          icono={ICONO_USUARIO}
          placeholder="Elegí tu nombre de usuario"
          value={valores.username}
          onChange={(e) => handleChange("username", e.target.value)}
          onBlur={() => handleBlur("username")}
          error={errores.username}
        />

        <CampoTexto
          label="NOMBRE COMPLETO"
          icono={ICONO_USUARIO}
          placeholder="Tu nombre completo"
          value={valores.nombre}
          onChange={(e) => handleChange("nombre", e.target.value)}
          onBlur={() => handleBlur("nombre")}
          error={errores.nombre}
        />

        <CampoTexto
          label="EMAIL (OPCIONAL)"
          icono={ICONO_MAIL}
          type="email"
          placeholder="tuemail@ejemplo.com"
          value={valores.mail}
          onChange={(e) => handleChange("mail", e.target.value)}
          onBlur={() => handleBlur("mail")}
          error={errores.mail}
        />

        {errorServidor && (
          <p
            role="alert"
            className="rounded-lg border border-ganker-error/40 bg-ganker-error/10 px-3 py-2 font-body text-sm text-ganker-error"
          >
            {errorServidor}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="w-full cursor-pointer rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple py-3 font-heading text-sm font-bold tracking-wide text-ganker-text uppercase transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cargando ? "Creando cuenta..." : "Finalizar registro y entrar"}
        </button>

        <div className="text-center">
          <Link
            to="/login"
            onClick={() => sessionStorage.removeItem(CLAVE_REGISTRO_FEDERADO)}
            className="font-body text-xs text-ganker-muted transition hover:text-ganker-text"
          >
            Cancelar y volver al inicio de sesión
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default CompletarRegistroFederadoPage;
