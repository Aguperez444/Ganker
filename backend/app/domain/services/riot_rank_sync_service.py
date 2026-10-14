import re
import unicodedata
from enum import Enum
from typing import TYPE_CHECKING, Optional

from app.domain.models.lol_stats import LolRankedEntry

if TYPE_CHECKING:
    from app.domain.models.game_profile import GameProfile
    from app.domain.models.rank import Rank

# Cola cuyo rango se toma para el perfil, en orden de preferencia
PREFERRED_QUEUES = ("RANKED_SOLO_5x5", "RANKED_FLEX_SR")


class RankSyncStatus(str, Enum):
    UPDATED = "updated"                    # El rango del perfil pasó a ser el de Riot
    UNCHANGED = "unchanged"                # Ya tenía ese rango
    UNRANKED = "unranked"                  # La cuenta no tiene partidas clasificatorias
    NO_MATCHING_RANK = "no_matching_rank"  # El admin no cargó un rango equivalente
    NO_ROLES = "no_roles"                  # El perfil no tiene roles, que es donde se guarda el rango


def _normalize(text: str) -> str:
    ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", ascii_text).strip().lower()


class RiotRankSyncService:

    @staticmethod
    def pick_main_entry(ranked: list[LolRankedEntry]) -> Optional[LolRankedEntry]:
        for queue_type in PREFERRED_QUEUES:
            for entry in ranked:
                if entry.queue_type == queue_type:
                    return entry
        return None

    @staticmethod
    def find_matching_rank(entry: LolRankedEntry, ranks: list['Rank']) -> Optional['Rank']:
        """
        Busca en el catálogo del admin el rango equivalente al de Riot, por nombre y sin importar tildes
        ni mayúsculas. Si el admin cargó rangos con división ("Oro II") se prefiere ese; si no, la liga ("Oro").
        """
        by_name = {_normalize(rank.name): rank for rank in ranks}
        candidates = [f"{entry.tier} {entry.division}", entry.tier] if entry.division else [entry.tier]
        for candidate in candidates:
            rank = by_name.get(_normalize(candidate))
            if rank:
                return rank
        return None

    @staticmethod
    def sync_profile_rank(game_profile: 'GameProfile', ranked: list[LolRankedEntry],
                          ranks: list['Rank']) -> tuple[RankSyncStatus, Optional['Rank']]:
        """Reemplaza el rango de todos los roles del perfil por el de Riot. Devuelve el resultado y el rango aplicado."""
        entry = RiotRankSyncService.pick_main_entry(ranked)
        if entry is None:
            return RankSyncStatus.UNRANKED, None

        rank = RiotRankSyncService.find_matching_rank(entry, ranks)
        if rank is None:
            return RankSyncStatus.NO_MATCHING_RANK, None

        if not game_profile.role_profiles:
            return RankSyncStatus.NO_ROLES, rank

        if all(role_profile.rank.rank_id == rank.rank_id for role_profile in game_profile.role_profiles):
            return RankSyncStatus.UNCHANGED, rank

        for role_profile in game_profile.role_profiles:
            role_profile.rank = rank
        return RankSyncStatus.UPDATED, rank
