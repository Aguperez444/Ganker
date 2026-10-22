// Roles que dan acceso al area administrativa. Coinciden con el enum UserRole
// del backend (domain/models/user_role.py), cuyos valores son minusculas:
// "owner", "admin", "player".
export const ROLES_ADMIN = ["admin", "owner"];

// Normalizamos por las dudas: si el backend algun dia devuelve "ADMIN", una
// comparacion estricta fallaria en silencio y mandaria al admin a la home sin
// ningun error visible.
function rolDe(user) {
  return user?.role?.toLowerCase() ?? null;
}

export function esAdmin(user) {
  return ROLES_ADMIN.includes(rolDe(user));
}

// Acciones reservadas al owner (ej. eliminar un videojuego, US 23).
export function esOwner(user) {
  return rolDe(user) === "owner";
}

// Nombre visible de cada valor de UserRole.
export const NOMBRES_ROLES = {
  player: "Jugador",
  admin: "Administrador",
  owner: "Owner",
};

// US 39 - Roles que puede asignar al registrar un usuario: los de su misma
// jerarquia o inferior. Solo un owner puede registrar a otro owner.
export function rolesQuePuedeRegistrar(user) {
  if (esOwner(user)) return ["player", "admin", "owner"];
  if (esAdmin(user)) return ["player", "admin"];
  return [];
}

// A donde va un usuario recien logueado, o uno ya logueado que cae en /login.
// La regla vive aca sola para no repetirla en cada pantalla que navega.
export function rutaInicialPara(user) {
  return esAdmin(user) ? "/app/admin" : "/app";
}

// Perfil de otro jugador. `videogameId` (opcional) deja ese juego
// preseleccionado, ej. el que se estaba filtrando en Buscar jugadores.
export function rutaPerfilJugador(userId, videogameId) {
  const ruta = `/app/jugadores/${userId}`;
  return videogameId ? `${ruta}?juego=${videogameId}` : ruta;
}
