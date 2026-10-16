from abc import ABC, abstractmethod

from typing import TYPE_CHECKING



if TYPE_CHECKING:
    from app.application.ports.i_email_service import IEmailService # todo chequear, esto debería ir en la UOW?
    from app.application.ports.i_user_repository import IUserRepository
    from app.application.ports.i_rank_repository import IRankRepository
    from app.application.ports.i_team_repository import ITeamRepository
    from app.application.ports.i_role_repository import IRoleRepository
    from app.application.ports.i_region_repository import IRegionRepository
    from app.application.ports.i_message_repository import IMessageRepository
    from app.application.ports.i_character_repository import ICharacterRepository
    from app.application.ports.i_videogame_repository import IVideogameRepository
    from app.application.ports.i_game_profile_repository import IGameProfileRepository
    from app.application.ports.i_role_profile_repository import IRoleProfileRepository
    from app.application.ports.i_conversation_repository import IConversationRepository
    from app.application.ports.i_refresh_token_repository import IRefreshTokenRepository
    from app.application.ports.i_game_usage_report_repository import IGameUsageReportRepository
    from app.application.ports.i_riot_account_link_repository import IRiotAccountLinkRepository
    from app.application.ports.i_character_priority_repository import ICharacterPriorityRepository
    from app.application.ports.i_federated_identity_repository import IFederatedIdentityRepository
    from app.application.ports.i_game_profile_report_repository import IGameProfileReportRepository
    from app.application.ports.i_discord_account_link_repository import IDiscordAccountLinkRepository
    from app.application.ports.i_password_reset_token_repository import IPasswordResetTokenRepository
    from app.application.ports.i_find_by_specifications_service import IFindBySpecificationsRepository


#abstract class
class IUnitOfWork(ABC):
    user_repo: 'IUserRepository'
    rank_repo: 'IRankRepository'
    role_repo: 'IRoleRepository'
    team_repo: 'ITeamRepository'
    email_service: 'IEmailService'
    region_repo: 'IRegionRepository'
    message_repo: 'IMessageRepository'
    videogame_repo: 'IVideogameRepository'
    character_repo: 'ICharacterRepository'
    game_profile_repo: 'IGameProfileRepository'
    role_profile_repo: 'IRoleProfileRepository'
    conversation_repo: 'IConversationRepository'
    refresh_token_repo: 'IRefreshTokenRepository'
    reset_token_repo: 'IPasswordResetTokenRepository'
    riot_account_link_repo: 'IRiotAccountLinkRepository'
    game_usage_report_repo: 'IGameUsageReportRepository'
    character_priority_repo: 'ICharacterPriorityRepository'
    federated_identity_repo: 'IFederatedIdentityRepository'
    game_profile_report_repo: 'IGameProfileReportRepository'
    discord_account_link_repo: 'IDiscordAccountLinkRepository'
    find_by_specification_repo: 'IFindBySpecificationsRepository'


    @abstractmethod
    def __enter__(self) -> 'IUnitOfWork':
        pass

    @abstractmethod
    def __exit__(self, exc_type, exc, tb) -> None:
        pass

    @abstractmethod
    def commit(self) -> None:
        pass

    @abstractmethod
    def rollback(self) -> None:
        pass