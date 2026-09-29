/**
 * GET /api/v1/users/me no devuelve el id del jugador (ver AuthContext.jsx),
 * pero lo necesitamos en el front para saber "es mi propia tarjeta" en el
 * chat. El id SI viaja en el claim "sub" del access token (ver
 * JwtTokenService.generate_tokens en el backend), asi que lo leemos de ahi.
 *
 * Solo decodificamos el payload, no validamos la firma: no hace falta,
 * el backend ya valida el token en cada pedido y esto es unicamente para
 * decidir que mostrar en pantalla.
 */
export function obtenerIdUsuarioDesdeToken(token) {
  if (!token || typeof token !== "string") return null;

  const partes = token.split(".");
  if (partes.length !== 3) return null;

  try {
    const base64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(decodeURIComponent(escape(atob(base64))));
    const id = Number(payload.sub);

    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}
