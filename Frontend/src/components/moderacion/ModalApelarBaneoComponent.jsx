import { useEffect, useRef, useState } from "react";
import { enviarApelacion, obtenerMiApelacion } from "../../api/apelacionesApi";
import {
  ESTADOS_APELACION,
  mensajeErrorApelacion,
  validarImagenesApelacion,
} from "../../utils/apelaciones";
import { urlDeMedia } from "../../utils/media";
import ModalModeracionComponent from "./ModalModeracionComponent";

function VistaPrevia({ archivo, onQuitar }) {
  const [url] = useState(() => URL.createObjectURL(archivo));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <li className="flex items-center gap-3 rounded-lg border border-white/10 p-2">
      <img
        src={url}
        alt={`Vista previa de ${archivo.name}`}
        className="h-14 w-14 rounded object-cover"
      />
      <span className="min-w-0 flex-1 truncate text-xs text-ganker-muted">
        {archivo.name}
      </span>
      <button
        type="button"
        onClick={onQuitar}
        className="cursor-pointer text-sm text-ganker-error"
        aria-label={`Quitar ${archivo.name}`}
      >
        Quitar
      </button>
    </li>
  );
}

export default function ModalApelarBaneoComponent({ token, onClose }) {
  const [consulta, setConsulta] = useState({});
  const [reintento, setReintento] = useState(0);
  const [texto, setTexto] = useState("");
  const [imagenes, setImagenes] = useState([]);
  const secuencia = useRef(0);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [enviada, setEnviada] = useState(null);
  const cargando = consulta.token !== token || consulta.reintento !== reintento;

  useEffect(() => {
    let activo = true;
    obtenerMiApelacion(token).then(
      (datos) => {
        if (activo) setConsulta({ datos, token, reintento });
      },
      (fallo) => {
        if (activo)
          setConsulta({
            error: mensajeErrorApelacion(fallo),
            token,
            reintento,
          });
      }
    );
    return () => {
      activo = false;
    };
  }, [token, reintento]);

  function seleccionarImagenes(evento) {
    const archivos = [
      ...imagenes.map((item) => item.archivo),
      ...Array.from(evento.target.files ?? []),
    ];
    const validacion = validarImagenesApelacion(archivos);
    setError(validacion);
    if (!validacion)
      setImagenes(
        archivos.map((archivo) => ({ archivo, id: secuencia.current++ }))
      );
    evento.target.value = "";
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (enviando) return;
    if (!texto.trim() || texto.trim().length > 3000) {
      setError("La apelación debe tener entre 1 y 3000 caracteres.");
      return;
    }
    setError("");
    setEnviando(true);
    try {
      setEnviada(
        await enviarApelacion({
          token,
          texto,
          imagenes: imagenes.map((item) => item.archivo),
        })
      );
      setImagenes([]);
    } catch (fallo) {
      setError(mensajeErrorApelacion(fallo));
      if (fallo.response?.status === 409) setReintento((previo) => previo + 1);
    } finally {
      setEnviando(false);
    }
  }

  const apelacion = enviada || consulta.datos?.appeal;
  return (
    <ModalModeracionComponent
      titulo="Apelar mi baneo"
      subtitulo="Revisión de la sanción"
      onClose={onClose}
      bloqueado={enviando}
    >
      <div className="space-y-5 p-5 sm:p-6">
        {cargando ? (
          <p className="text-sm text-ganker-muted">Consultando tu baneo...</p>
        ) : consulta.error ? (
          <div role="alert" className="space-y-3 text-sm text-ganker-error">
            <p>{consulta.error}</p>
            <button
              type="button"
              onClick={() => setReintento((previo) => previo + 1)}
              className="cursor-pointer underline"
            >
              Volver a intentar
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-white/10 bg-ganker-surface-light p-4 text-sm text-ganker-text">
              <p className="font-semibold">@{consulta.datos.ban.username}</p>
              <p className="mt-1 break-words text-ganker-muted">
                Motivo del baneo: {consulta.datos.ban.reason}
              </p>
            </div>
            {apelacion ? (
              <div className="space-y-4">
                <p
                  role="status"
                  className="text-sm font-semibold text-ganker-purple-light"
                >
                  {enviada
                    ? "Apelación enviada. "
                    : "Ya presentaste una apelación. "}
                  Estado: {ESTADOS_APELACION[apelacion.status]}.
                </p>
                <p className="text-sm break-words whitespace-pre-wrap text-ganker-text">
                  {apelacion.text}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {apelacion.images.map((url, index) => (
                    <a
                      key={url}
                      href={urlDeMedia(url)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={urlDeMedia(url)}
                        alt={`Imagen ${index + 1} de tu apelación`}
                        className="max-h-48 w-full rounded-lg object-contain"
                      />
                    </a>
                  ))}
                </div>
                {apelacion.status === "accepted" && (
                  <p className="text-sm text-ganker-success">
                    La apelación fue aceptada. Podés volver a iniciar sesión.
                  </p>
                )}
                {apelacion.status === "rejected" && (
                  <p className="text-sm text-ganker-muted">
                    La apelación fue rechazada y la sanción se mantiene hasta su
                    vencimiento.
                  </p>
                )}
              </div>
            ) : !consulta.datos.ban.active ? (
              <p className="text-sm text-ganker-muted">
                El baneo ya no está vigente. Volvé a iniciar sesión.
              </p>
            ) : (
              <form onSubmit={enviar} className="space-y-4" noValidate>
                <label
                  className="block text-sm font-semibold text-ganker-text"
                  htmlFor="apelacion-texto"
                >
                  Explicá por qué apelás tu baneo
                </label>
                <textarea
                  id="apelacion-texto"
                  rows={6}
                  maxLength={3000}
                  value={texto}
                  onChange={(evento) => setTexto(evento.target.value)}
                  disabled={enviando}
                  className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2 text-sm text-ganker-text focus:outline-ganker-purple-light"
                />
                <p className="text-right text-xs text-ganker-muted">
                  {texto.length}/3000
                </p>
                <label
                  className="block text-sm font-semibold text-ganker-text"
                  htmlFor="apelacion-imagenes"
                >
                  Imágenes (opcional)
                </label>
                <p className="text-xs text-ganker-muted">
                  Hasta 3 imágenes PNG, JPG o WebP de hasta 2 MB cada una.
                </p>
                <input
                  id="apelacion-imagenes"
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  onChange={seleccionarImagenes}
                  disabled={enviando}
                  className="w-full text-sm text-ganker-muted"
                />
                <ul className="space-y-2">
                  {imagenes.map((item) => (
                    <VistaPrevia
                      key={item.id}
                      archivo={item.archivo}
                      onQuitar={() =>
                        setImagenes((previas) =>
                          previas.filter((actual) => actual.id !== item.id)
                        )
                      }
                    />
                  ))}
                </ul>
                {error && (
                  <p role="alert" className="text-sm text-ganker-error">
                    {error}
                  </p>
                )}
                <p className="text-xs text-ganker-muted">
                  Podés presentar una apelación por baneo. Revisá el texto y las
                  imágenes antes de enviarla.
                </p>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={enviando}
                    className="cursor-pointer rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {enviando ? "Enviando..." : "Enviar apelación"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </ModalModeracionComponent>
  );
}
