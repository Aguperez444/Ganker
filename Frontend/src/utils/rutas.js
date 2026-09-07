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

// A donde va un usuario recien logueado, o uno ya logueado que cae en /login.
// La regla vive aca sola para no repetirla en cada pantalla que navega.
export function rutaInicialPara(user) {
  return esAdmin(user) ? "/app/admin" : "/app";
}
