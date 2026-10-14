from datetime import timedelta

from app.application.ports.i_riot_game_provider_resolver import IRiotGameProviderResolver
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.game_profile.game_profile_not_found_exception import GameProfileNotFoundException
from app.domain.services.create_riot_link_dto_service import CreateRiotLinkDTOService
from app.infrastructure.api.dto.response.get.get_riot_account_link_response import GetRiotAccountLinkResponse


class QueryRiotAccountLink:
    """Cuenta de Riot y estadísticas guardadas de un perfil de juego (las ve cualquier jugador, no consulta a Riot)."""

    def __init__(self, provider_resolver: IRiotGameProviderResolver, uow: IUnitOfWork, refresh_cooldown: timedelta):
        self.provider_resolver: IRiotGameProviderResolver = provider_resolver
        self.uow: IUnitOfWork = uow
        self.refresh_cooldown: timedelta = refresh_cooldown

    def execute(self, game_profile_id: int) -> GetRiotAccountLinkResponse:
        with self.uow as uow:
            game_profile = uow.game_profile_repo.get_game_profile_by_id(game_profile_id)
            if game_profile is None:
                raise GameProfileNotFoundException(game_profile_id)

            link = uow.riot_account_link_repo.get_by_game_profile_id(game_profile_id)

        provider = self.provider_resolver.get_provider_for(game_profile.videogame)
        if link is None or provider is None:
            return CreateRiotLinkDTOService.not_linked(provider)

        return CreateRiotLinkDTOService.create_link_response(link, provider, self.refresh_cooldown)
