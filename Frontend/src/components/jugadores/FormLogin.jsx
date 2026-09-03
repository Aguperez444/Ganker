import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CampoTexto from "../common/CampoTexto";
import { useAuth } from "../../context/AuthContext";

const ICONO_USUARIO = (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ICONO_CANDADO = (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v2" />
  </svg>
);

function FormLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [valores, setValores] = useState({ email: "", password: "" });
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);

  function handleChange(campo, valor) {
    setValores((prev) => ({ ...prev, [campo]: valor }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErrorServidor(null);

    const erroresValidacion = {};

    if (!valores.email.trim()) {
      erroresValidacion.email = "Ingresá tu email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valores.email.trim())) {
      erroresValidacion.email = "El email no tiene un formato válido.";
    }

    if (!valores.password) {
      erroresValidacion.password = "Ingresá tu contraseña.";
    }

    setErrores(erroresValidacion);
    if (Object.keys(erroresValidacion).length > 0) return;

    setCargando(true);
    const result = await login(valores.email, valores.password);
    setCargando(false);

    if (!result.success) {
      setErrorServidor(
        "No encontramos una cuenta con ese email o la contraseña es incorrecta. Quizás deberías registrarte."
      );
      return;
    }

    navigate("/");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl border border-ganker-purple bg-ganker-surface p-8"
    >
      <CampoTexto
        label="EMAIL"
        icono={ICONO_USUARIO}
        type="email"
        placeholder="tuemail@ejemplo.com"
        value={valores.email}
        onChange={(e) => handleChange("email", e.target.value)}
        error={errores.email}
      />
      <CampoTexto
        label="CONTRASEÑA"
        icono={ICONO_CANDADO}
        type="password"
        placeholder="Tu contraseña"
        value={valores.password}
        onChange={(e) => handleChange("password", e.target.value)}
        error={errores.password}
      />

      {errorServidor && (
        <p className="rounded-lg border border-ganker-error/40 bg-ganker-error/10 px-3 py-2 text-sm text-ganker-error font-body">
          {errorServidor}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="w-full rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple py-3
          text-sm font-bold uppercase tracking-wide text-ganker-text font-heading transition
          hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
      </button>
    </form>
  );
}

export default FormLogin;


