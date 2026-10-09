import { Link, useNavigate } from "react-router-dom";
import Aviso from "../components/common/AvisoComponent";
import CrearEquipoFormComponent from "../components/equipos/CrearEquipoFormComponent";
import useCrearEquipo from "../hooks/useCrearEquipo";

const CLASES_BOTON_PRINCIPAL =
  "inline-block rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90";

// US 14 - Crear equipo.
const CrearEquipoPage = () => {
  const navigate = useNavigate();
  const {
    perfiles,
    formulario,
    errores,
    rangos,
    roles,
    regiones,
    rolesDelJugador,
    cargandoCatalogos,
    errorCatalogos,
    miEquipo,
    verificandoEquipo,
    enviando,
    errorEnvio,
    actualizarCampo,
    seleccionarVideojuego,
    cambiarCantidadVacantes,
    cambiarRolVacante,
    enviar,
  } = useCrearEquipo();

  const handleSubmit = async () => {
    const equipo = await enviar();
    if (!equipo) return;

    navigate("/app/equipos/mi-equipo", {
      state: {
        mensajeExito: `¡Listo! Creaste el equipo "${equipo.team_name}". Ya podés esperar a que se sumen jugadores.`,
      },
    });
  };

  let contenido;

  if (verificandoEquipo) {
    contenido = <p className="text-sm text-ganker-muted">Cargando...</p>;
  } else if (miEquipo) {
    // Regla de la US: un jugador no puede estar en dos equipos activos.
    contenido = (
      <Aviso
        titulo="Ya formás parte de un equipo"
        accion={
          <Link to="/app/equipos/mi-equipo" className={CLASES_BOTON_PRINCIPAL}>
            Ver mi equipo
          </Link>
        }
      >
        Estás en "{miEquipo.team_name}". Para crear un equipo nuevo primero
        tenés que salir de ese.
      </Aviso>
    );
  } else if (perfiles.length === 0) {
    contenido = (
      <Aviso
        titulo="Necesitás un perfil de juego"
        accion={
          <Link to="/app/perfil" className={CLASES_BOTON_PRINCIPAL}>
            Crear perfil de juego
          </Link>
        }
      >
        Para armar un equipo usamos tu rol y tu rango en ese videojuego. Creá tu
        perfil y volvé.
      </Aviso>
    );
  } else {
    contenido = (
      <CrearEquipoFormComponent
        perfiles={perfiles}
        formulario={formulario}
        errores={errores}
        rangos={rangos}
        roles={roles}
        regiones={regiones}
        rolesDelJugador={rolesDelJugador}
        cargandoCatalogos={cargandoCatalogos}
        errorCatalogos={errorCatalogos}
        enviando={enviando}
        errorEnvio={errorEnvio}
        onCampoChange={actualizarCampo}
        onVideojuegoChange={seleccionarVideojuego}
        onCantidadVacantesChange={cambiarCantidadVacantes}
        onRolVacanteChange={cambiarRolVacante}
        onSubmit={handleSubmit}
      />
    );
  }

  return (
    <section className="min-h-full bg-ganker-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-ganker-text sm:text-4xl">
            Crear equipo
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ganker-muted sm:text-base">
            Armá tu sala, definí qué rangos y roles buscás y esperá a que se
            sumen jugadores compatibles.
          </p>
        </header>

        {contenido}
      </div>
    </section>
  );
};

export default CrearEquipoPage;
