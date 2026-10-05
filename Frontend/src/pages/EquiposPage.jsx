import { useState } from "react";
import CampoTexto from "../components/common/CampoTexto";
import IconSelectComponent from "../components/common/IconSelectComponent";
import EquipoCardComponent from "../components/equipos/EquipoCardComponent";
import CrearEquipoModalComponent from "../components/equipos/CrearEquipoModalComponent";
import UnirseEquipoModalComponent from "../components/equipos/UnirseEquipoModalComponent";
import useEquipos from "../hooks/useEquipos";

const OPCIONES_VACANTES = [
  { id: "", name: "Cualquiera" },
  { id: "1", name: "Al menos 1 vacante" },
  { id: "2", name: "Al menos 2 vacantes" },
  { id: "3", name: "Al menos 3 vacantes" },
  { id: "4", name: "Al menos 4 vacantes" },
];

export function EquiposPage() {
  const {
    games,
    isLoadingGames,
    gamesError,
    selectedGameId,
    setSelectedGameId,
    regions,
    ranks,
    roles,
    isLoadingGameCatalogs,

    filterRegionId,
    setFilterRegionId,
    filterRankId,
    setFilterRankId,
    filterVacantSlots,
    setFilterVacantSlots,
    filterRoleId,
    setFilterRoleId,
    searchTerm,
    setSearchTerm,
    limpiarFiltros,
    hayFiltrosActivos,

    teams,
    isLoadingTeams,
    teamsError,

    user,
    miEquipoActivo,
    estaEnEquipoActivo,

    registrarEquipo,
    solicitarUnirseAEquipo,
    abrirChatDeEquipo,

    successNotification,
    setSuccessNotification,
    actionError,
    setActionError,
  } = useEquipos();

  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [equipoParaUnirse, setEquipoParaUnirse] = useState(null);

  const handleAbrirCrear = () => {
    setActionError("");
    setSuccessNotification("");
    setModalCrearAbierto(true);
  };

  const handleCrearEquipo = async (formData) => {
    const res = await registrarEquipo(formData);
    return res;
  };

  const handleAbrirUnirse = (team) => {
    setActionError("");
    setSuccessNotification("");
    setEquipoParaUnirse(team);
  };

  const handleConfirmarUnirse = async (team, targetRoleId) => {
    const res = await solicitarUnirseAEquipo(team, targetRoleId);
    return res;
  };

  return (
    <section className="min-h-full bg-ganker-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* Encabezado */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-ganker-text sm:text-4xl">
              Equipos
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-ganker-muted sm:text-base">
              Encontrá salas y grupos competitivos con cupos vacantes, o
              registrá tu propio equipo para reclutar jugadores.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAbrirCrear}
            className="cursor-pointer shrink-0 rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-ganker-purple/20 transition hover:opacity-90"
          >
            + Registrar equipo
          </button>
        </header>

        {/* Notificación de éxito */}
        {successNotification && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-ganker-success/30 bg-ganker-success/10 px-4 py-3">
            <p className="text-sm text-ganker-success font-medium">
              ✓ {successNotification}
            </p>
            {miEquipoActivo && (
              <button
                type="button"
                onClick={() => abrirChatDeEquipo(miEquipoActivo)}
                className="cursor-pointer shrink-0 rounded-lg bg-ganker-success/20 px-3 py-1.5 text-xs font-semibold text-ganker-success hover:bg-ganker-success/30"
              >
                Abrir chat del equipo
              </button>
            )}
          </div>
        )}

        {/* Notificación de error de acción */}
        {actionError && (
          <div className="rounded-xl border border-ganker-error/30 bg-ganker-error/10 px-4 py-3">
            <p className="text-sm text-ganker-error font-medium">
              ✕ {actionError}
            </p>
          </div>
        )}

        {/* Banner de Mi Equipo Activo (si ya forma parte de un equipo) */}
        {miEquipoActivo && (
          <div className="rounded-2xl border border-ganker-purple/40 bg-gradient-to-r from-ganker-purple/15 to-ganker-surface p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-ganker-purple/20 px-2.5 py-0.5 text-[11px] font-semibold text-ganker-purple-light uppercase tracking-wider">
                  Tu equipo activo
                </span>
                <h3 className="mt-1 font-heading text-lg font-bold text-ganker-text sm:text-xl">
                  {miEquipoActivo.team_name}
                </h3>
                <p className="text-xs text-ganker-muted">
                  {miEquipoActivo.player_count}/{miEquipoActivo.max_players}{" "}
                  integrantes
                  {miEquipoActivo.videogame_name
                    ? ` · ${miEquipoActivo.videogame_name}`
                    : ""}
                  {miEquipoActivo.region_name
                    ? ` (${miEquipoActivo.region_name})`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => abrirChatDeEquipo(miEquipoActivo)}
                className="cursor-pointer shrink-0 rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-4 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90"
              >
                Ir al chat grupal
              </button>
            </div>
          </div>
        )}

        {/* Sección de Filtros y Búsqueda */}
        <div className="rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
            <h2 className="font-heading text-base font-semibold text-ganker-text">
              Filtros del Lobby
            </h2>

            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-ganker-muted">Feed en vivo</span>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Filtro Videojuego */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-ganker-muted">
                Videojuego
              </label>
              {isLoadingGames ? (
                <p className="text-xs text-ganker-muted">Cargando juegos...</p>
              ) : (
                <IconSelectComponent
                  value={selectedGameId}
                  onChange={setSelectedGameId}
                  options={games}
                  placeholder="Todos los juegos"
                  incluirOpcionCualquiera
                  getOptionId={(g) => g.id}
                />
              )}
              {gamesError && (
                <p className="mt-1 text-xs text-ganker-error">{gamesError}</p>
              )}
            </div>

            {/* Filtro Región */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-ganker-muted">
                Región
              </label>
              <IconSelectComponent
                value={filterRegionId}
                onChange={setFilterRegionId}
                options={regions}
                placeholder="Cualquiera"
                incluirOpcionCualquiera
                disabled={!selectedGameId || isLoadingGameCatalogs}
                getOptionId={(r) => r.region_id}
              />
            </div>

            {/* Filtro Rango */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-ganker-muted">
                Rango
              </label>
              <IconSelectComponent
                value={filterRankId}
                onChange={setFilterRankId}
                options={ranks}
                placeholder="Cualquiera"
                incluirOpcionCualquiera
                disabled={!selectedGameId || isLoadingGameCatalogs}
                getOptionId={(r) => r.rank_id}
              />
            </div>

            {/* Filtro Espacios Vacantes */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-ganker-muted">
                Espacios vacantes
              </label>
              <IconSelectComponent
                value={filterVacantSlots}
                onChange={setFilterVacantSlots}
                options={OPCIONES_VACANTES}
                placeholder="Cualquiera"
                getOptionId={(o) => o.id}
              />
            </div>

            {/* Filtro Rol Buscado en Vacantes */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-ganker-muted">
                Rol en vacantes
              </label>
              <IconSelectComponent
                value={filterRoleId}
                onChange={setFilterRoleId}
                options={roles}
                placeholder="Cualquiera"
                incluirOpcionCualquiera
                disabled={!selectedGameId || isLoadingGameCatalogs}
                getOptionId={(r) => r.role_id}
              />
            </div>

            {/* Búsqueda por texto */}
            <div>
              <CampoTexto
                label="Búsqueda por texto"
                placeholder="Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={limpiarFiltros}
              disabled={!hayFiltrosActivos}
              className="cursor-pointer text-sm font-semibold text-ganker-purple-light transition hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-40"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Listado de Equipos */}
        <div>
          {isLoadingTeams && (
            <div className="rounded-2xl border border-white/10 bg-ganker-surface p-12 text-center">
              <p className="text-sm text-ganker-muted">
                Cargando salas y equipos...
              </p>
            </div>
          )}

          {!isLoadingTeams && teamsError && (
            <div className="rounded-2xl border border-ganker-error/20 bg-ganker-error/10 p-12 text-center">
              <p className="text-sm text-ganker-error">{teamsError}</p>
            </div>
          )}

          {!isLoadingTeams && !teamsError && teams.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-ganker-surface p-12 text-center">
              <p className="text-base font-semibold text-ganker-text">
                No se encontraron equipos disponibles con esos criterios.
              </p>
              <p className="mt-1 text-sm text-ganker-muted">
                Probá cambiando o limpiando los filtros para ver todos los
                equipos del Lobby.
              </p>
              {hayFiltrosActivos && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="mt-4 cursor-pointer rounded-xl border border-white/10 bg-ganker-surface-light px-4 py-2 text-sm font-semibold text-ganker-purple-light hover:text-ganker-text"
                >
                  Restablecer filtros
                </button>
              )}
            </div>
          )}

          {!isLoadingTeams && !teamsError && teams.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <EquipoCardComponent
                  key={team.team_id}
                  team={team}
                  user={user}
                  ranks={ranks}
                  estaEnEquipoActivo={estaEnEquipoActivo}
                  onUnirse={handleAbrirUnirse}
                  onAbrirChat={abrirChatDeEquipo}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modales */}
        <CrearEquipoModalComponent
          isOpen={modalCrearAbierto}
          onClose={() => setModalCrearAbierto(false)}
          games={games}
          user={user}
          estaEnEquipoActivo={estaEnEquipoActivo}
          onSubmit={handleCrearEquipo}
        />

        <UnirseEquipoModalComponent
          isOpen={Boolean(equipoParaUnirse)}
          team={equipoParaUnirse}
          user={user}
          ranks={ranks}
          estaEnEquipoActivo={estaEnEquipoActivo}
          onClose={() => setEquipoParaUnirse(null)}
          onConfirm={handleConfirmarUnirse}
        />
      </div>
    </section>
  );
}

export default EquiposPage;
