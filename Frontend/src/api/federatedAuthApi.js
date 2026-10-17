import axiosClient from "./axiosClient";

/**
 * Paso 1 del login/registro federado: solicita al backend la URL firmada
 * para redirigir al usuario al proveedor externo (discord, steam, twitch, google).
 */
export function obtenerUrlAutorizacionFederada(provider) {
  return axiosClient
    .get(`/auth/v1/oauth/${provider}/authorize`)
    .then((res) => res.data); // { authorization_url, provider }
}

/**
 * Paso 2: envía el código OAuth2 o los parámetros OpenID 2.0 (Steam) junto con el state
 * para autenticar al jugador o recibir el token temporal de registro.
 */
export function procesarCallbackFederado(
  provider,
  { state, code, openidParams }
) {
  return axiosClient
    .post(`/auth/v1/oauth/${provider}/callback`, {
      state,
      code: code || null,
      openid_params: openidParams || null,
    })
    .then((res) => res.data);
}

/**
 * Paso 3 (solo primera vez): completa el registro federado con el username y nombre elegidos.
 */
export function completarRegistroFederado({
  registrationToken,
  username,
  nombre,
  mail,
}) {
  return axiosClient
    .post("/auth/v1/oauth/complete-registration", {
      registration_token: registrationToken,
      username: username.trim(),
      name: nombre.trim(),
      mail: mail && mail.trim() ? mail.trim() : null,
    })
    .then((res) => res.data); // { access_token, refresh_token, token_type }
}
