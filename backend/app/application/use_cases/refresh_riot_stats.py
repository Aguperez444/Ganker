from datetime import datetime, timedelta

from app.application.ports.i_riot_game_provider_resolver import IRiotGameProviderResolver
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.application.use_cases.link_riot_account import apply_riot_rank, get_riot_provider_or_raise
from app.domain.exceptions.riot.riot_account_not_linked_exception import RiotAccountNotLinkedException
from app.domain.exceptions.riot.riot_stats_not_available_exception import RiotStatsNotAvailableException
from app.domain.exceptions.riot.riot_stats_refresh_too_soon_exception import RiotStatsRefreshTooSoonException
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.create_riot_link_dto_service import CreateRiotLinkDTOService
from app.infrastructure.api.dto.response.get.get_riot_account_link_response import GetRiotAccountLinkResponse


class RefreshRiotStats:
    """
    Vuelve a traer las estadísticas de la cuenta de Riot vinculada y actualiza el rango del perfil.
    Hay una espera mínima entre actualizaciones para no agotar el límite de consultas de la API de Riot.
    """

    def __init__(self, provider_resolver: IRiotGameProviderResolver, uow: IUnitOfWork, refresh_cooldown: timedelta):
        self.provider_resolver: IRiotGameProviderResolver = provider_resolver
        self.uow: IUnitOfWork = uow
        self.refresh_cooldown: timedelta = refresh_cooldown

    def execute(self, player_id: int, game_profile_id: int) -> GetRiotAccountLinkResponse:
        with self.uow as uow:
            game_profile = CatalogValidationService.get_and_validate_exists_game_profile(game_profile_id, player_id, uow)
            provider = get_riot_provider_or_raise(self.provider_resolver, game_profile.videogame)
            if not provider.provides_stats:
                raise RiotStatsNotAvailableException(game_profile.videogame.name)

            link = uow.riot_account_link_repo.get_by_game_profile_id(game_profile_id)
            if link is None:
                raise RiotAccountNotLinkedException(game_profile_id)

            now = datetime.now()
            if not link.can_refresh(now, self.refresh_cooldown):
                seconds_left = int((link.next_refresh_at(self.refresh_cooldown) - now).total_seconds())
                raise RiotStatsRefreshTooSoonException(seconds_left)

            stats = provider.fetch_stats(link.account, link.server)
            rank_sync = apply_riot_rank(game_profile, stats, uow)

            link.update_stats(stats, now)
            link = uow.riot_account_link_repo.save(link)

        return CreateRiotLinkDTOService.create_link_response(link, provider, self.refresh_cooldown, rank_sync)
