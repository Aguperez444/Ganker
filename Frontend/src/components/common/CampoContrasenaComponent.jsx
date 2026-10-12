import { useState } from "react";
import CampoTexto from "./CampoTexto";

const ICONO_OJO = (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const ICONO_OJO_TACHADO = (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

// Campo de contraseña con el boton del "ojito": un switch on/off que muestra
// el texto en vez de los asteriscos. Acepta las mismas props que CampoTexto
// (label, icono, error, value, onChange, onBlur, placeholder...).
function CampoContrasenaComponent(props) {
  const [visible, setVisible] = useState(false);

  return (
    <CampoTexto
      {...props}
      type={visible ? "text" : "password"}
      extra={
        <button
          type="button"
          onClick={() => setVisible((actual) => !actual)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-ganker-muted transition hover:text-ganker-text"
        >
          {visible ? ICONO_OJO_TACHADO : ICONO_OJO}
        </button>
      }
    />
  );
}

export default CampoContrasenaComponent;
