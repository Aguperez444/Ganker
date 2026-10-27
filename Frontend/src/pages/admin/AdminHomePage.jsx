import { Link } from "react-router-dom";
import useGames from "../../hooks/useGames";
import { useBuscarBaneos } from "../../hooks/useBuscarBaneos";
import { useResumenReportes } from "../../hooks/useResumenReportes";
import BaneosRecientesComponent from "../../components/moderacion/BaneosRecientesComponent";
import FondoJuegoComponent from "../../components/inicio/FondoJuegoComponent";
import ModulosAdminComponent from "../../components/inicio/ModulosAdminComponent";
import ResumenReportesComponent from "../../components/reportes/ResumenReportesComponent";
import { esBaneoVigente } from "../../utils/baneos";
import { urlDeMedia } from "../../utils/media";

const GRUPOS_ADMIN = [
  {
    titulo: "Comunidad",
    modulos: [
      {
        titulo: "Moderación",
        descripcion: "Baneá cuentas y revisá los baneos vigentes.",
        path: "/app/admin/moderacion",
        botonTexto: "Ir a moderación",
      },
      {
        titulo: "Usuarios",
        descripcion: "Registrá o dá de baja jugadores y administradores.",
        path: "/app/admin/usuarios",
        botonTexto: "Gestionar usuarios",
      },
      {
        titulo: "Reportes de perfiles",
        descripcion: "Perfiles de jugador por videojuego, exportables.",
        path: "/app/admin/reportes",
        botonTexto: "Ver reportes",
      },
      {
        titulo: "Reportes de uso",
        descripcion: "Actividad de la plataforma por videojuego.",
        path: "/app/admin/reportes/uso",
        botonTexto: "Ver uso",
      },
    ],
  },
  {
    titulo: "Catálogo de juegos",
    modulos: [
      {
        titulo: "Videojuegos",
        descripcion: "Juegos soportados por Ganker.",
        path: "/app/admin/games",
        botonTexto: "Gestionar videojuegos",
      },
      {
        titulo: "Rangos",
        descripcion: "Divisiones y rangos por videojuego.",
        path: "/app/admin/ranks",
        botonTexto: "Gestionar rangos",
      },
      {
        titulo: "Roles",
        descripcion: "Roles disponibles por videojuego.",
        path: "/app/admin/roles",
        botonTexto: "Gestionar roles",
      },
      {
        titulo: "Personajes",
        descripcion: "Personajes y agentes de cada videojuego.",
        path: "/app/admin/characters",
        botonTexto: "Gestionar personajes",
      },
      {
        titulo: "Regiones",
        descripcion: "Regiones disponibles por videojuego.",
        path: "/app/admin/regions",
        botonTexto: "Gestionar regiones",
      },
    ],
  },
];

function TarjetaDato({ titulo, valor, detalle, acento }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ganker-surface p-5">
      <p className="text-xs font-semibold tracking-wider text-ganker-muted uppercase">
        {titulo}
      </p>
      <p className={`mt-2 font-heading text-3xl font-bold ${acento}`}>
        {valor}
      </p>
      {detalle && <p className="mt-1 text-xs text-ganker-muted">{detalle}</p>}
    </div>
  );
}

const AdminHomePage = () => {
  const { games, isLoading: cargandoJuegos, error: errorJuegos } = useGames();
  const {
    baneos,
    cargando: cargandoBaneos,
    error: errorBaneos,
  } = useBuscarBaneos();
  const resumenReportes = useResumenReportes();

  // useBuscarBaneos trae la primera pagina (los mas nuevos): el dato es sobre
  // esos, el backend no devuelve totales.
  const vigentes = baneos.filter((b) => esBaneoVigente(b.expires_at)).length;

  return (
    <section className="min-h-full bg-ganker-bg p-4 sm:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <FondoJuegoComponent className="rounded-2xl border border-white/10">
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-[0.15em] text-ganker-purple-light uppercase">
              Administración
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-ganker-text sm:text-4xl">
              Panel administrativo
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-ganker-muted">
              Moderá la comunidad y mantené al día el catálogo de juegos,
              rangos, roles y regiones de Ganker.
            </p>
          </div>
        </FondoJuegoComponent>

        <div className="grid gap-4 sm:grid-cols-3">
          <TarjetaDato
            titulo="Juegos soportados"
            valor={cargandoJuegos ? "—" : games.length}
            detalle="En el catálogo"
            acento="text-ganker-text"
          />
          <TarjetaDato
            titulo="Baneos vigentes"
            valor={cargandoBaneos || errorBaneos ? "—" : vigentes}
            detalle={`Entre los últimos ${baneos.length} baneos`}
            acento="text-ganker-error"
          />
          <TarjetaDato
            titulo="Baneos vencidos"
            valor={
              cargandoBaneos || errorBaneos ? "—" : baneos.length - vigentes
            }
            detalle={`Entre los últimos ${baneos.length} baneos`}
            acento="text-ganker-muted"
          />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BaneosRecientesComponent
              baneos={baneos}
              cargando={cargandoBaneos}
              error={errorBaneos}
            />
          </div>

          <ResumenReportesComponent
            reportes={resumenReportes.reportes}
            cargando={resumenReportes.cargando}
            error={resumenReportes.error}
          />
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold text-ganker-text">
              Catálogo
            </h2>
            <Link
              to="/app/admin/games"
              className="text-sm font-semibold text-ganker-purple-light hover:underline"
            >
              Editar →
            </Link>
          </div>
          {cargandoJuegos ? (
            <p className="text-sm text-ganker-muted">Cargando videojuegos...</p>
          ) : errorJuegos ? (
            <p className="text-sm text-ganker-error">{errorJuegos}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {games.map((juego) => (
                <li key={juego.id}>
                  <Link
                    to="/app/admin/games"
                    aria-label={`Gestionar ${juego.name}`}
                    className="group block rounded-xl transition duration-200 ease-out hover:z-10 hover:scale-105 hover:shadow-[0_0_18px] hover:shadow-ganker-purple/40 focus-visible:scale-105 focus-visible:outline-2 focus-visible:outline-ganker-purple-light"
                  >
                    <FondoJuegoComponent
                      nombreJuego={juego.name}
                      className="h-16 rounded-xl border border-white/10 transition group-hover:border-ganker-purple-light/60"
                    >
                      <div className="flex h-full items-center gap-3 px-3">
                        {juego.icon_url && (
                          <img
                            src={urlDeMedia(juego.icon_url)}
                            alt=""
                            aria-hidden="true"
                            className="h-8 w-8 rounded-lg object-contain"
                          />
                        )}
                        <span className="truncate text-sm font-semibold text-ganker-text">
                          {juego.name}
                        </span>
                      </div>
                    </FondoJuegoComponent>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <ModulosAdminComponent grupos={GRUPOS_ADMIN} />
      </div>
    </section>
  );
};

export default AdminHomePage;
