import { useState } from "react";
import CampoTexto from "../components/common/CampoTexto";
import IconSelectComponent from "../components/common/IconSelectComponent";
import JugadorCardComponent from "../components/jugadores/JugadorCardComponent";
import { useChat } from "../context/ChatContext";
import { useBuscarJugadores } from "../hooks/useBuscarJugadores";

const BuscarJugadoresPage = () => {
  const { currentUserId, error: errorChat, iniciarChat } = useChat();
  const [enviandoAId, setEnviandoAId] = useState(null);

  const {
    games,
    isLoadingGames,
    gamesError,

    selectedGameId,
    selectGame,

    ranks,
    roles,
    characters,
    isLoadingGameData,
    gameDataError,

    rankId,
    roleId,
    characterId,
    username,
    setRankId,
    setRoleId,
    setCharacterId,
    setUsername,
    limpiarFiltros,
    hayFiltrosOpcionales,

    resultados,
    isLoadingResultados,
    resultadosError,

    orden,
    setOrden,

    pagina,
    totalPaginas,
    hayPaginaSiguiente,
    hayPaginaAnterior,
    paginaSiguiente,
    paginaAnterior,
  } = useBuscarJugadores();

  // US 10 - Al iniciar (o retomar) una conversacion, ChatContext ya deja
  // esa conversacion seleccionada y el panel/drawer de chat abierto: no
  // hace falta navegar a ningun lado, el jugador la ve aparecer ahi mismo.
  const handleEnviarMensaje = async (jugador) => {
    setEnviandoAId(jugador.user_id);
    await iniciarChat(jugador.user_id);
    setEnviandoAId(null);
  };

  return (
    <section className="min-h-full bg-ganker-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header>
          <h1 className="font-heading text-3xl font-bold text-ganker-text sm:text-4xl">
            Buscar jugadores
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ganker-muted sm:text-base">
            Encontrá compañeros y rivales de tu nivel para jugar partidas
            competitivas.
          </p>
        </header>

        {errorChat && (
          <div className="rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
            <p className="text-sm text-ganker-error">{errorChat}</p>
          </div>
        )}

        {/* Filtros */}
        <div className="rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
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
                  Cargando rangos, roles y personajes...
                </p>
              ) : gameDataError ? (
                <p className="text-sm text-ganker-error">{gameDataError}</p>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                        Rol
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
                        Personaje
                      </label>
                      <IconSelectComponent
                        value={characterId}
                        onChange={setCharacterId}
                        options={characters}
                        placeholder="Cualquiera"
                        buscable
                        incluirOpcionCualquiera
                        getOptionId={(character) => character.character_id}
                      />
                    </div>

                    <CampoTexto
                      label="Nombre de usuario"
                      placeholder="Buscar por username..."
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={limpiarFiltros}
                      disabled={!hayFiltrosOpcionales}
                      className="text-sm font-semibold text-ganker-purple-light transition hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-40"
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
              Seleccioná un videojuego para empezar a buscar jugadores.
            </p>
          </div>
        )}

        {selectedGameId && !isLoadingGameData && !gameDataError && (
          <>
            {isLoadingResultados && (
              <div className="rounded-2xl border border-white/10 bg-ganker-surface p-10 text-center">
                <p className="text-sm text-ganker-muted">
                  Buscando jugadores...
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
              resultados.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-ganker-surface p-10 text-center">
                  <p className="text-sm text-ganker-muted">
                    No se encontraron jugadores con esos filtros. Probá
                    cambiándolos o limpiándolos.
                  </p>
                </div>
              )}

            {!isLoadingResultados &&
              !resultadosError &&
              resultados.length > 0 && (
                <>
                  <div className="flex items-center justify-end gap-2">
                    <label
                      htmlFor="orden-resultados"
                      className="text-xs font-semibold text-ganker-muted uppercase"
                    >
                      Ordenar por
                    </label>
                    <select
                      id="orden-resultados"
                      value={orden}
                      onChange={(e) => setOrden(e.target.value)}
                      className="rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2 text-sm text-ganker-text outline-none transition focus:border-ganker-purple-light"
                    >
                      <option value="">Sin ordenar</option>
                      <option value="reciente">
                        Última conexión: más reciente primero
                      </option>
                      <option value="antiguo">
                        Última conexión: más antigua primero
                      </option>
                    </select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {resultados.map((jugador) => (
                      <JugadorCardComponent
                        key={jugador.user_id}
                        jugador={jugador}
                        currentUserId={currentUserId}
                        onEnviarMensaje={handleEnviarMensaje}
                        enviando={enviandoAId === jugador.user_id}
                        perfilJuego={{
                          characters: jugador.characters,
                          role_profiles: jugador.role_profiles,
                          characterIdFiltrado: characterId,
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={paginaAnterior}
                      disabled={!hayPaginaAnterior}
                      className="rounded-xl border border-white/10 bg-ganker-surface px-4 py-2 text-sm font-semibold text-ganker-text transition hover:border-ganker-purple/40 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Anterior
                    </button>

                    <span className="text-sm text-ganker-muted">
                      Página {pagina} de {totalPaginas}
                    </span>

                    <button
                      type="button"
                      onClick={paginaSiguiente}
                      disabled={!hayPaginaSiguiente}
                      className="rounded-xl border border-white/10 bg-ganker-surface px-4 py-2 text-sm font-semibold text-ganker-text transition hover:border-ganker-purple/40 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Siguiente
                    </button>
                  </div>
                </>
              )}
          </>
        )}
      </div>
    </section>
  );
};

export default BuscarJugadoresPage;
