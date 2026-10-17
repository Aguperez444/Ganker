import { useState } from "react";
import { obtenerUrlAutorizacionFederada } from "../api/federatedAuthApi";

// Paso 1 del login/registro federado: pide al backend la URL firmada del
// proveedor y saca al usuario de la app hacia ella. Lo usan tanto el login
// como el registro, porque el backend decide después si la cuenta es nueva.
export function useAuthFederado() {
  const [proveedorCargando, setProveedorCargando] = useState(null);
  const [errorFederado, setErrorFederado] = useState(null);

  async function conectar(proveedorId) {
    setErrorFederado(null);
    setProveedorCargando(proveedorId);

    try {
      const { authorization_url } =
        await obtenerUrlAutorizacionFederada(proveedorId);
      // No limpiamos proveedorCargando: el navegador ya se va de la página y
      // así los botones quedan deshabilitados mientras tanto.
      window.location.assign(authorization_url);
    } catch (error) {
      setErrorFederado(
        error.response?.data?.error ??
          "No pudimos iniciar la conexión con el proveedor seleccionado. Probá de nuevo."
      );
      setProveedorCargando(null);
    }
  }

  return { proveedorCargando, errorFederado, conectar };
}
