const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Al menos 8 caracteres, una mayuscula, una minuscula y un numero: la misma
// regla que valida el backend al registrar (PasswordSecurityService).
const REGEX_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function esEmailValido(email) {
  return REGEX_EMAIL.test(email.trim());
}

export function esPasswordValida(password) {
  return REGEX_PASSWORD.test(password);
}

// US 34 - Cambiar contraseña: "al menos 8 caracteres", la misma regla que
// valida el backend al restablecer (PasswordSecurityService). Ojo: el
// registro de arriba pide 9.
const REGEX_PASSWORD_NUEVA = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function esPasswordNuevaValida(password) {
  return REGEX_PASSWORD_NUEVA.test(password);
}

export function validarFormularioRecuperarContrasena({ email }) {
  const errores = {};

  if (!email.trim()) {
    errores.email = "Ingresá tu email.";
  } else if (!esEmailValido(email)) {
    errores.email = "El email no tiene un formato válido.";
  }

  return errores;
}

export function validarFormularioNuevaContrasena({
  password,
  confirmarPassword,
}) {
  const errores = {};

  if (!password) {
    errores.password = "Ingresá tu nueva contraseña.";
  } else if (!esPasswordNuevaValida(password)) {
    errores.password =
      "Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.";
  }

  if (confirmarPassword !== password) {
    errores.confirmarPassword = "Las contraseñas no coinciden.";
  }

  return errores;
}

export function validarFormularioRegistro({
  nombre,
  username,
  mail,
  password,
  confirmarPassword,
}) {
  const errores = {};

  if (!nombre.trim()) errores.nombre = "Ingresá tu nombre completo.";
  if (!username.trim()) errores.username = "Elegí un nombre de usuario.";

  if (!mail.trim()) {
    errores.mail = "Ingresá tu email.";
  } else if (!esEmailValido(mail)) {
    errores.mail = "El email no tiene un formato válido.";
  }

  if (!password) {
    errores.password = "Elegí una contraseña.";
  } else if (!esPasswordValida(password)) {
    errores.password =
      "Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.";
  }

  if (confirmarPassword !== password) {
    errores.confirmarPassword = "Las contraseñas no coinciden.";
  }

  return errores;
}

export function validarFormularioLogin({ email, password }) {
  const errores = {};

  if (!email.trim()) {
    errores.email = "Ingresá tu email.";
  } else if (!esEmailValido(email)) {
    errores.email = "El email no tiene un formato válido.";
  }

  if (!password) {
    errores.password = "Ingresá tu contraseña.";
  }

  return errores;
}
// US 02 - Modificar mis datos.
// La contrasena NO se valida ni se toca aca: cambiarla es la US 34 y tiene su
// propia pantalla.
export function validarFormularioCuenta({ nombre, username, mail }) {
  const errores = {};

  if (!nombre.trim()) errores.nombre = "Ingresá tu nombre completo.";
  if (!username.trim()) errores.username = "Ingresá un nombre de usuario.";

  if (!mail.trim()) {
    errores.mail = "Ingresá tu email.";
  } else if (!esEmailValido(mail)) {
    errores.mail = "El email no tiene un formato válido.";
  }

  return errores;
}

export function validarFormularioRegistroFederado({ nombre, username, mail }) {
  const errores = {};

  if (!nombre || !nombre.trim()) {
    errores.nombre = "Ingresá tu nombre completo.";
  }
  if (!username || !username.trim()) {
    errores.username = "Elegí un nombre de usuario.";
  }
  if (mail && mail.trim() && !esEmailValido(mail)) {
    errores.mail = "El email no tiene un formato válido.";
  }

  return errores;
}
