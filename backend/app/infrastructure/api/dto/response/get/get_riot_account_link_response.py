from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class RiotRankedEntryResponse(BaseModel):
    queue: str = Field(..., description="Cola clasificatoria (Solo/Dúo o Flexible)")
    tier: str = Field(..., description="Liga (ej. Oro)")
    division: Optional[str] = Field(None, description="División (I a IV); vacía en Maestro o superior")
    league_points: int = Field(..., description="Puntos de liga")
    wins: int = Field(..., description="Victorias de la temporada en esa cola")
    losses: int = Field(..., description="Derrotas de la temporada en esa cola")
    winrate: float = Field(..., description="Porcentaje de victorias")


class RiotChampionMasteryResponse(BaseModel):
    champion_name: str = Field(..., description="Nombre del campeón")
    icon_url: Optional[str] = Field(None, description="Ícono del campeón")
    level: int = Field(..., description="Nivel de maestría")
    points: int = Field(..., description="Puntos de maestría")


class RiotChampionRecentStatsResponse(BaseModel):
    champion_name: str = Field(..., description="Nombre del campeón")
    icon_url: Optional[str] = Field(None, description="Ícono del campeón")
    games: int = Field(..., description="Partidas jugadas con el campeón entre las últimas")
    wins: int = Field(..., description="Victorias con el campeón entre las últimas")
    winrate: float = Field(..., description="Porcentaje de victorias con el campeón")
    kda: float = Field(..., description="KDA con el campeón")


class RiotRecentSummaryResponse(BaseModel):
    games: int = Field(..., description="Cantidad de partidas analizadas")
    wins: int = Field(..., description="Victorias")
    losses: int = Field(..., description="Derrotas")
    winrate: float = Field(..., description="Porcentaje de victorias")
    avg_kills: float = Field(..., description="Asesinatos promedio por partida")
    avg_deaths: float = Field(..., description="Muertes promedio por partida")
    avg_assists: float = Field(..., description="Asistencias promedio por partida")
    kda: float = Field(..., description="KDA de las últimas partidas")
    main_role: Optional[str] = Field(None, description="Rol más jugado en las últimas partidas")
    most_played: list[RiotChampionRecentStatsResponse] = Field(..., description="Campeones más jugados en las últimas partidas")


class RiotMatchResponse(BaseModel):
    match_id: str = Field(..., description="ID de la partida en Riot")
    champion_name: str = Field(..., description="Campeón jugado")
    champion_icon_url: Optional[str] = Field(None, description="Ícono del campeón")
    kills: int = Field(..., description="Asesinatos")
    deaths: int = Field(..., description="Muertes")
    assists: int = Field(..., description="Asistencias")
    win: bool = Field(..., description="Indica si ganó la partida")
    role: Optional[str] = Field(None, description="Rol jugado")
    cs: int = Field(..., description="Súbditos y monstruos asesinados")
    duration_seconds: int = Field(..., description="Duración de la partida en segundos")
    queue: str = Field(..., description="Modo de juego")
    played_at: datetime = Field(..., description="Fecha y hora de la partida")


class RiotStatsResponse(BaseModel):
    summoner_level: int = Field(..., description="Nivel de invocador")
    profile_icon_url: Optional[str] = Field(None, description="Ícono de invocador")
    ranked: list[RiotRankedEntryResponse] = Field(..., description="Rangos de la temporada actual")
    top_masteries: list[RiotChampionMasteryResponse] = Field(..., description="Campeones con más maestría")
    recent: RiotRecentSummaryResponse = Field(..., description="Resumen de las últimas partidas")
    matches: list[RiotMatchResponse] = Field(..., description="Historial de las últimas partidas")


class RankSyncResponse(BaseModel):
    status: str = Field(..., description="Resultado: updated, unchanged, unranked, no_matching_rank o no_roles")
    rank_name: Optional[str] = Field(None, description="Rango del catálogo que se aplicó al perfil")
    message: str = Field(..., description="Explicación para mostrarle al jugador")


class GetRiotAccountLinkResponse(BaseModel):
    supported: bool = Field(..., description="Indica si a este perfil de juego se le puede vincular una cuenta de Riot")
    linked: bool = Field(..., description="Indica si tiene una cuenta de Riot vinculada")
    requires_server: bool = Field(False, description="Indica si al vincular hay que elegir el servidor (LoL) o lo informa Riot (Valorant)")
    provides_stats: bool = Field(False, description="Indica si Riot permite consultar estadísticas de este juego")
    riot_id: Optional[str] = Field(None, description="Riot ID vinculado (Nombre#TAG)")
    server: Optional[str] = Field(None, description="Servidor (LoL, ej. 'la2') o región (Valorant, ej. 'latam') de la cuenta")
    last_synced_at: Optional[datetime] = Field(None, description="Última vez que se actualizaron las estadísticas")
    next_refresh_at: Optional[datetime] = Field(None, description="Desde cuándo se pueden volver a actualizar")
    rank_sync: Optional[RankSyncResponse] = Field(None, description="Qué pasó con el rango del perfil (solo al vincular o actualizar)")
    stats: Optional[RiotStatsResponse] = Field(None, description="Estadísticas de la cuenta")
