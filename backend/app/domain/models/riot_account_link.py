from datetime import datetime, timedelta
from typing import Optional

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException
from app.domain.models.lol_stats import LolStats
from app.domain.models.riot_account import RiotAccount


class RiotAccountLink:
    """
    Cuenta de Riot vinculada a un perfil de juego (League of Legends o Valorant).
    `server` es el servidor (LoL, ej. "la2") o la región (Valorant, ej. "latam") de la cuenta.
    `stats` solo existe en los juegos de los que Riot permite leer estadísticas (hoy, LoL).
    """

    def __init__(self, link_id: Optional[int], game_profile_id: int, account: RiotAccount, server: str,
                 stats: Optional[LolStats] = None, last_synced_at: Optional[datetime] = None):
        self._link_id: Optional[int] = link_id
        self._game_profile_id: int = game_profile_id
        self._account: RiotAccount = account
        self._server: str = server
        self._stats: Optional[LolStats] = stats
        self._last_synced_at: Optional[datetime] = last_synced_at

    @property
    def link_id(self) -> int:
        if self._link_id is None:
            raise EntityNotPersistedException("RiotAccountLink")
        return self._link_id

    @property
    def game_profile_id(self) -> int:
        return self._game_profile_id

    @property
    def account(self) -> RiotAccount:
        return self._account

    @property
    def server(self) -> str:
        return self._server

    @property
    def stats(self) -> Optional[LolStats]:
        return self._stats

    @property
    def last_synced_at(self) -> Optional[datetime]:
        return self._last_synced_at

    def update_stats(self, stats: LolStats, synced_at: datetime) -> None:
        self._stats = stats
        self._last_synced_at = synced_at

    def next_refresh_at(self, cooldown: timedelta) -> Optional[datetime]:
        if self._last_synced_at is None:
            return None
        return self._last_synced_at + cooldown

    def can_refresh(self, now: datetime, cooldown: timedelta) -> bool:
        next_refresh = self.next_refresh_at(cooldown)
        return next_refresh is None or now >= next_refresh

    def is_persisted(self) -> bool:
        return self._link_id is not None

    def __repr__(self) -> str:
        return (f"RiotAccountLink(link_id={self._link_id or 'sin_id'}, game_profile_id={self.game_profile_id},"
                f" riot_id='{self.account.riot_id}', server={self.server}, last_synced_at={self.last_synced_at})")
