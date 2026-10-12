import { useCallback, useState } from "react";
import AvisoComponent from "../components/common/AvisoComponent";
import CampoTexto from "../components/common/CampoTexto";
import IconSelectComponent from "../components/common/IconSelectComponent";
import EquipoCardComponent from "../components/equipos/EquipoCardComponent";
import MiEquipoPanelComponent from "../components/equipos/MiEquipoPanelComponent";
import ModalElegirRolEquipo from "../components/equipos/ModalElegirRolEquipo";
import { useBuscarEquipos } from "../hooks/useBuscarEquipos";
import { useEquiposFeedSocket } from "../hooks/useEquiposFeedSocket";

// Opciones del filtro de vacantes: el backend filtra por "al menos N" cupos.
const OPCIONES_VACANTES = [1, 2, 3, 4, 5];

const EquiposPage = () => {
  const {
    games,
    isLoadingGames,
    gamesError,

    selectedGameId,
    selectGame,

    regions,
    ranks,
    roles,
    isLoadingGameData,
    gameDataError,

    regionId,
    setRegionId,
    rankId,
    setRankId,
    vacantSlots,
    setVacantSlots,
    roleId,
    setRoleId,
    search,
    setSearch,
    limpiarFiltros,
    hayFiltrosOpcionales,

    equipos,
    isLoadingResultados,
    isCargandoMas,
    resultadosError,
    hayMas,
    cargarMas,

    unirse,
    procesandoUnirse,
    recargar,
  } = useBuscarEquipos();

  const [equipoEligiendoRol, setEquipoEligiendoRol] = useState(null);
  const [aviso, setAviso] = useState(null);
  // Tras unirse a un equipo hay que recargar el panel "Mi equipo".
  const [recargaMiEquipo, setRecargaMiEquipo] = useState(0);

  // Feed en vivo: cuando alguien crea, modifica o cambia la membresía de un
  // equipo, refrescamos el listado general y el panel "Mi equipo" (US 04,
  // criterio 10: el listado general de equipos se actualiza).
  const manejarEventoEquipos = useCallback(() => {
    recargar();
    setRecargaMiEquipo((token) => token + 1);
  }, [recargar]);

  useEquiposFeedSocket(manejarEventoEquipos);

  const manejarUnirse = async (equipo, vacante) => {
    const resultado = await unirse(equipo, vacante);

    setAviso(
      resultado.ok
        ? { tipo: "exito", texto: resultado.mensaje }
        : { tipo: "error", texto: resultado.mensaje }
    );

    if (resultado.ok) {
      setEquipoEligiendoRol(null);
      setRecargaMiEquipo((token) => token + 1);
    }
  };

  // Botón principal de la tarjeta: una sola vacante une directo; varias
  // abren el selector de rol para no ocupar cualquier slot sin querer.
  const manejarBotonUnirse = (equipo) => {
    const vacantes = (equipo.members ?? []).filter(
      (miembro) => miembro.is_vacant
    );

    if (vacantes.length <= 1) {
      if (vacantes[0]) manejarUnirse(equipo, vacantes[0]);
      return;
    }

    setEquipoEligiendoRol(equipo);
  };

  return (
    <section className="min-h-full bg-ganker-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header>
          <h1 className="font-heading text-3xl font-bold text-ganker-text sm:text-4xl">
            Equipos
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ganker-muted sm:text-base">
            Gestioná tu equipo y encontrá otros con cupos disponibles para
            unirte a su vacante según tu rol.
          </p>
        </header>

        <AvisoComponent aviso={aviso} onCerrar={() => setAviso(null)} />

        <MiEquipoPanelComponent
          recargaToken={recargaMiEquipo}
          onEquipoActualizado={recargar}
        />

        {/* Filtros */}
        <div className="rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
          <h2 className="mb-4 font-heading text-xl font-bold text-ganker-text">
            Buscar equipos
          </h2>
          <div>
            <label className="mb-3 block text-sm font-semibold text-ganker-text">
              Videojuego
            </label>

            {isLoadingGames ? (
              <p className="text-sm text-ganker-muted">
                Cargando videojuegos...
              </p>
            ) : (
              <div className="max-w-sm">
                <IconSelectComponent
                  value={selectedGameId}
                  onChange={selectGame}
                  options={games}
                  placeholder="Seleccioná un videojuego"
                  getOptionId={(game) => game.id}
                />
              </div>
            )}

            {gamesError && (
              <p className="mt-2 text-sm text-ganker-error">{gamesError}</p>
            )}
          </div>

          {selectedGameId && (
            <div className="mt-6 border-t border-white/10 pt-6">
              {isLoadingGameData ? (
                <p className="text-sm text-ganker-muted">
                  Cargando regiones, rangos y roles...
                </p>
              ) : gameDataError ? (
                <p className="text-sm text-ganker-error">{gameDataError}</p>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-ganker-muted uppercase">
                        Región
                      </label>
                      <IconSelectComponent
                        value={regionId}
                        onChange={setRegionId}
                        options={regions}
                        placeholder="Cualquiera"
                        incluirOpcionCualquiera
                        getOptionId={(region) => region.region_id}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-ganker-muted uppercase">
                        Rango
                      </label>
                      <IconSelectComponent
                        value={rankId}
                        onChange={setRankId}
                        options={ranks}
                        placeholder="Cualquiera"
                        incluirOpcionCualquiera
                        getOptionId={(rank) => rank.rank_id}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-ganker-muted uppercase">
                        Rol disponible
                      </label>
                      <IconSelectComponent
                        value={roleId}
                        onChange={setRoleId}
                        options={roles}
                        placeholder="Cualquiera"
                        incluirOpcionCualquiera
                        getOptionId={(role) => role.role_id}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-ganker-muted uppercase">
                        Vacantes
                      </label>
                      <select
                        value={vacantSlots}
                        onChange={(e) => setVacantSlots(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-ganker-surface-light px-3 py-3 text-sm text-ganker-text outline-none transition focus:border-ganker-purple-light"
                      >
                        <option value="">Cualquiera</option>
                        {OPCIONES_VACANTES.map((cantidad) => (
                          <option key={cantidad} value={cantidad}>
                            Al menos {cantidad}
                          </option>
                        ))}
                      </select>
                    </div>

                    <CampoTexto
                      label="Buscar"
                      placeholder="Nombre o descripción..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={limpiarFiltros}
                      disabled={!hayFiltrosOpcionales}
                      className="cursor-pointer text-sm font-semibold text-ganker-purple-light transition hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Resultados */}
        {!selectedGameId && (
          <div className="rounded-2xl border border-white/10 bg-ganker-surface p-10 text-center">
            <p className="text-sm text-ganker-muted">
              Seleccioná un videojuego para buscar equipos.
            </p>
          </div>
        )}

        {selectedGameId && !isLoadingGameData && !gameDataError && (
          <>
            {isLoadingResultados && (
              <div className="rounded-2xl border border-white/10 bg-ganker-surface p-10 text-center">
                <p className="text-sm text-ganker-muted">
                  Buscando equipos...
                </p>
              </div>
            )}

            {!isLoadingResultados && resultadosError && (
              <div className="rounded-2xl border border-ganker-error/20 bg-ganker-error/10 p-10 text-center">
                <p className="text-sm text-ganker-error">{resultadosError}</p>
              </div>
            )}

            {!isLoadingResultados &&
              !resultadosError &&
              equipos.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-ganker-surface p-10 text-center">
                  <p className="text-sm text-ganker-muted">
                    No se encontraron equipos con esos filtros. Probá
                    cambiándolos o limpiándolos.
                  </p>
                </div>
              )}

            {!isLoadingResultados &&
              !resultadosError &&
              equipos.length > 0 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {equipos.map((equipo) => (
                      <EquipoCardComponent
                        key={equipo.team_id}
                        equipo={equipo}
                        procesandoUnirse={
                          procesandoUnirse === equipo.team_id
                        }
                        onBotonUnirse={() => manejarBotonUnirse(equipo)}
                        onUnirseVacante={(vacante) =>
                          manejarUnirse(equipo, vacante)
                        }
                      />
                    ))}
                  </div>

                  {hayMas && (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={cargarMas}
                        disabled={isCargandoMas}
                        className="cursor-pointer rounded-xl border border-white/10 bg-ganker-surface px-6 py-2.5 text-sm font-semibold text-ganker-text transition hover:border-ganker-purple/40 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isCargandoMas
                          ? "Cargando..."
                          : "Cargar más equipos"}
                      </button>
                    </div>
                  )}
                </>
              )}
          </>
        )}
      </div>

      <ModalElegirRolEquipo
        equipo={equipoEligiendoRol}
        procesandoUnirse={
          equipoEligiendoRol && procesandoUnirse === equipoEligiendoRol.team_id
        }
        onSeleccionarVacante={(vacante) =>
          manejarUnirse(equipoEligiendoRol, vacante)
        }
        onCancelar={() => setEquipoEligiendoRol(null)}
      />
    </section>
  );
};

export default EquiposPage;