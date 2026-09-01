const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "mayor a 8 caracteres" = 9 para arriba.
const REGEX_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{9,}$/;

export function esEmailValido(email) {
  return REGEX_EMAIL.test(email.trim());
}

export function esPasswordValida(password) {
  return REGEX_PASSWORD.test(password);
}

export function validarFormularioRegistro({ nombre, username, mail, password, confirmarPassword }) {
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
      "Debe tener al menos 9 caracteres, una mayúscula, una minúscula y un número.";
  }

  if (confirmarPassword !== password) {
    errores.confirmarPassword = "Las contraseñas no coinciden.";
  }

  return errores;
}