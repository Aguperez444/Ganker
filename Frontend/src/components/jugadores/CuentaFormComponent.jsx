import { useState } from "react";
import CampoTexto from "../common/CampoTexto";
import AvatarUsuarioComponent from "../common/AvatarUsuarioComponent";
import ModalRecortarAvatar from "./ModalRecortarAvatarComponent";

const ICONO_USUARIO = (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const ICONO_MAIL = (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 8l9 6 9-6M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
    />
  </svg>
);

// Formulario de datos de la cuenta (US 02).
// Permite modificar nombre de usuario, email, nombre completo y foto de perfil (avatar).
// No incluye contrasena a proposito: cambiarla es la US 34.
function CuentaFormComponent({
  user,
  valores,
  previewAvatar,
  errores = {},
  cargando,
  errorServidor,
  exito,
  onChange,
  onBlur,
  onAvatarChange,
  onQuitarAvatar,
  onSubmit,
}) {
  const [modalRecorteAbierto, setModalRecorteAbierto] = useState(false);
  const [imagenParaRecortar, setImagenParaRecortar] = useState(null);
  const [nombreArchivoOriginal, setNombreArchivoOriginal] =
    useState("avatar.png");
  const [errorImagen, setErrorImagen] = useState(null);

  function handleSeleccionarArchivo(e) {
    setErrorImagen(null);
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      setErrorImagen(
        "Por favor seleccioná un archivo de imagen válido (JPG, PNG o WEBP)."
      );
      e.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(archivo);
    setImagenParaRecortar(objectUrl);
    setNombreArchivoOriginal(archivo.name || "avatar.png");
    setModalRecorteAbierto(true);
    e.target.value = "";
  }

  function handleConfirmarRecorte(file, previewUrl) {
    if (imagenParaRecortar) {
      URL.revokeObjectURL(imagenParaRecortar);
      setImagenParaRecortar(null);
    }
    setModalRecorteAbierto(false);
    if (onAvatarChange) {
      onAvatarChange(file, previewUrl);
    }
  }

  function handleCerrarModal() {
    if (imagenParaRecortar) {
      URL.revokeObjectURL(imagenParaRecortar);
      setImagenParaRecortar(null);
    }
    setModalRecorteAbierto(false);
  }

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-2xl border border-white/10 bg-ganker-surface p-6 sm:p-8"
      >
        <div>
          <h2 className="font-heading text-lg font-semibold text-ganker-text">
            Datos personales
          </h2>
          <p className="mt-1 text-sm text-ganker-muted">
            Estos son los datos con los que te identifican otros jugadores.
          </p>
        </div>

        {/* Sección de Foto de perfil / Avatar */}
        <div className="flex flex-col gap-4 rounded-xl border border-white/5 bg-ganker-surface-light/40 p-4 sm:flex-row sm:items-center">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-ganker-purple/40 bg-gradient-to-br from-ganker-orange to-ganker-purple font-heading text-2xl font-bold text-white shadow-md">
            {previewAvatar ? (
              <img
                src={previewAvatar}
                alt="Vista previa del nuevo avatar"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <AvatarUsuarioComponent
                user={user}
                alt="Avatar actual del formulario"
              />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <label
                htmlFor="input-avatar"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-ganker-surface-light px-3.5 py-2 font-heading text-xs font-bold text-ganker-text transition hover:border-ganker-orange/50 hover:bg-white/5"
              >
                <svg
                  className="h-4 w-4 text-ganker-orange"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {previewAvatar ? "Cambiar foto" : "Subir nueva foto"}
              </label>

              {previewAvatar && (
                <button
                  type="button"
                  onClick={onQuitarAvatar}
                  className="cursor-pointer rounded-lg border border-ganker-error/30 bg-ganker-error/10 px-3 py-2 font-heading text-xs font-semibold text-ganker-error transition hover:bg-ganker-error/20"
                >
                  Descartar foto
                </button>
              )}

              <input
                id="input-avatar"
                type="file"
                accept="image/*"
                onChange={handleSeleccionarArchivo}
                className="sr-only"
              />
            </div>

            <p className="text-xs text-ganker-muted">
              Formatos soportados: JPG, PNG o WEBP. Podrás encuadrar tu imagen
              con recorte circular (entre 128x128 y 512x512 px).
            </p>

            {errorImagen && (
              <p role="alert" className="text-xs font-medium text-ganker-error">
                {errorImagen}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <CampoTexto
            label="NOMBRE DE USUARIO"
            icono={ICONO_USUARIO}
            placeholder="Tu nombre de usuario"
            value={valores.username}
            onChange={(e) => onChange("username", e.target.value)}
            onBlur={() => onBlur("username")}
            error={errores.username}
          />
          <CampoTexto
            label="EMAIL"
            icono={ICONO_MAIL}
            type="email"
            placeholder="tuemail@ejemplo.com"
            value={valores.mail}
            onChange={(e) => onChange("mail", e.target.value)}
            onBlur={() => onBlur("mail")}
            error={errores.mail}
          />
        </div>

        <CampoTexto
          label="NOMBRE COMPLETO"
          icono={ICONO_USUARIO}
          placeholder="Tu nombre completo"
          value={valores.nombre}
          onChange={(e) => onChange("nombre", e.target.value)}
          onBlur={() => onBlur("nombre")}
          error={errores.nombre}
        />

        <p className="text-xs text-ganker-muted">
          ¿Querés cambiar tu contraseña? Se hace desde una pantalla aparte, por
          seguridad.
        </p>

        {errorServidor && (
          <p
            role="alert"
            className="rounded-lg border border-ganker-error/40 bg-ganker-error/10 px-3 py-2 font-body text-sm text-ganker-error"
          >
            {errorServidor}
          </p>
        )}

        {exito && (
          <p
            role="status"
            className="rounded-lg border border-ganker-success/40 bg-ganker-success/10 px-3 py-2 font-body text-sm text-ganker-success"
          >
            {exito}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple py-3 font-heading text-sm font-bold tracking-wide text-ganker-text uppercase transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {cargando ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>

      <ModalRecortarAvatar
        isOpen={modalRecorteAbierto}
        imagenSrc={imagenParaRecortar}
        nombreArchivoOriginal={nombreArchivoOriginal}
        onClose={handleCerrarModal}
        onConfirm={handleConfirmarRecorte}
      />
    </>
  );
}

export default CuentaFormComponent;
