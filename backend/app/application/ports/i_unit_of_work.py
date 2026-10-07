from abc import ABC, abstractmethod

from typing import TYPE_CHECKING



if TYPE_CHECKING:
    from app.application.ports.i_role_profile_repository import IRoleProfileRepository
    from app.application.ports.i_character_priority_repository import ICharacterPriorityRepository
    from app.application.ports.i_character_repository import ICharacterRepository
    from app.application.ports.i_game_profile_repository import IGameProfileRepository
    from app.application.ports.i_message_repository import IMessageRepository
    from app.application.ports.i_find_by_specifications_service import IFindBySpecificationRepository
    from app.application.ports.i_user_repository import IUserRepository
    from app.application.ports.i_rank_repository import IRankRepository
    from app.application.ports.i_refresh_token_repository import IRefreshTokenRepository
    from app.application.ports.i_role_repository import IRoleRepository
    from app.application.ports.i_videogame_repository import IVideogameRepository
    from app.application.ports.i_conversation_repository import IConversationRepository


#abstract class
class IUnitOfWork(ABC):
    user_repo: 'IUserRepository'
    game_profile_repo: 'IGameProfileRepository'
    videogame_repo: 'IVideogameRepository'
    role_repo: 'IRoleRepository'
    rank_repo: 'IRankRepository'
    character_repo: 'ICharacterRepository'
    refresh_token_repo: 'IRefreshTokenRepository'
    message_repo: 'IMessageRepository'
    conversation_repo: 'IConversationRepository'
    find_by_specification_repo: 'IFindBySpecificationRepository'
    role_profile_repo: 'IRoleProfileRepository'
    character_priority_repo: 'ICharacterPriorityRepository'


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