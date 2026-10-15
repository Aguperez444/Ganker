from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Optional

from app.application.ports.i_riot_game_provider import IRiotGameProvider
from app.application.ports.i_riot_game_provider_resolver import IRiotGameProviderResolver
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.riot.riot_account_already_linked_exception import RiotAccountAlreadyLinkedException
from app.domain.exceptions.riot.riot_link_not_supported_exception import RiotLinkNotSupportedException
from app.domain.models.riot_account_link import RiotAccountLink
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.create_riot_link_dto_service import CreateRiotLinkDTOService
from app.domain.services.riot_id_service import RiotIdService
from app.domain.services.riot_rank_sync_service import RankSyncStatus, RiotRankSyncService
from app.infrastructure.api.dto.response.get.get_riot_account_link_response import GetRiotAccountLinkResponse

if TYPE_CHECKING:
    from app.domain.models.game_profile import GameProfile
    from app.domain.models.lol_stats import LolStats
    from app.domain.models.rank import Rank
    from app.domain.models.videogame import Videogame


def get_riot_provider_or_raise(resolver: IRiotGameProviderResolver, videogame: 'Videogame') -> IRiotGameProvider:
    provider = resolver.get_provider_for(videogame)
    if provider is None:
        raise RiotLinkNotSupportedException(videogame.name)
    return provider


def apply_riot_rank(game_profile: 'GameProfile', stats: 'LolStats',
                    uow: IUnitOfWork) -> tuple[RankSyncStatus, Optional['Rank']]:
    """Reemplaza el rango del perfil por el de la cuenta de Riot (lo comparten vincular y actualizar)."""
    ranks = uow.rank_repo.get_ranks_by_game_id(game_profile.videogame.videogame_id)
    status, rank = RiotRankSyncService.sync_profile_rank(game_profile, stats.ranked, ranks)
    if status == RankSyncStatus.UPDATED:
        uow.game_profile_repo.update_game_profile(game_profile)
    return status, rank


class LinkRiotAccount:
    """
    Vincula una cuenta de Riot al perfil de juego del jugador (League of Legends o Valorant).
    Si Riot permite leer estadísticas de ese juego, las trae y reemplaza el rango del perfil por el de la cuenta.
    Si el perfil ya tenía otra cuenta, la reemplaza.
    """

    def __init__(self, provider_resolver: IRiotGameProviderResolver, uow: IUnitOfWork, refresh_cooldown: timedelta):
        self.provider_resolver: IRiotGameProviderResolver = provider_resolver
        self.uow: IUnitOfWork = uow
        self.refresh_cooldown: timedelta = refresh_cooldown

    def execute(self, player_id: int, game_profile_id: int, riot_id: str,
                server: Optional[str]) -> GetRiotAccountLinkResponse:
        # Separa el Riot ID en nombre de juego y tagline (ej: "Player#NA1" -> "Player", "NA1")
        game_name, tag_line = RiotIdService.parse(riot_id)

        with self.uow as uow:
            game_profile = CatalogValidationService.get_and_validate_exists_game_profile(game_profile_id, player_id, uow)
            provider = get_riot_provider_or_raise(self.provider_resolver, game_profile.videogame)


            account, account_server = provider.find_account(game_name, tag_line, server)

            # Una misma cuenta de Riot no puede quedar vinculada a dos jugadores de Ganker en el mismo juego
            for linked in uow.riot_account_link_repo.get_by_puuid(account.puuid):
                if linked.game_profile_id != game_profile_id and self._same_game(linked, game_profile, uow):
                    raise RiotAccountAlreadyLinkedException(account.riot_id)

            stats = provider.fetch_stats(account, account_server)
            rank_sync = apply_riot_rank(game_profile, stats, uow) if stats else None

            # El nombre dentro del juego pasa a ser el Riot ID verificado
            if game_profile.in_game_name != account.riot_id:
                game_profile.in_game_name = account.riot_id
                uow.game_profile_repo.update_game_profile(game_profile)

            uow.riot_account_link_repo.delete_by_game_profile_id(game_profile_id)
            link = uow.riot_account_link_repo.save(
                RiotAccountLink(link_id=None, game_profile_id=game_profile_id, account=account, server=account_server,
                                stats=stats, last_synced_at=datetime.now() if stats else None)
            )

        return CreateRiotLinkDTOService.create_link_response(link, provider, self.refresh_cooldown, rank_sync)

    @staticmethod
    def _same_game(link: RiotAccountLink, game_profile: 'GameProfile', uow: IUnitOfWork) -> bool:
        linked_profile = uow.game_profile_repo.get_game_profile_by_id(link.game_profile_id)
        return linked_profile is not None and linked_profile.videogame == game_profile.videogame
