from typing import TYPE_CHECKING
from app.domain.exceptions.character.character_not_found_exception import CharacterNotFoundException
from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException
from app.domain.exceptions.role.role_not_found_exception import RoleNotFoundException
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException
from app.domain.exceptions.game_profile.does_not_belong_to_profile_exception import DoesNotBelongToProfileException
from app.domain.exceptions.game_profile.game_profile_not_found_exception import GameProfileNotFoundException
from app.domain.exceptions.character.duplicated_character_name_exception import DuplicatedCharacterNameException
from app.domain.exceptions.game_profile.game_profile_already_exist_exception import GameProfileAlreadyExistException
from app.domain.exceptions.mail.email_already_exists_exception import EmailAlreadyExistsException
from app.domain.exceptions.user.username_already_exists_exception import UsernameAlreadyExistsException
from app.domain.exceptions.videogame.videogame_already_exists_exception import VideogameAlreadyExistsException

if TYPE_CHECKING:
    from app.application.ports.i_unit_of_work import IUnitOfWork
    from app.domain.models.character import Character
    from app.domain.models.rank import Rank
    from app.domain.models.role import Role
    from app.domain.models.videogame import Videogame
    from app.domain.models.game_profile import GameProfile


class CatalogValidationService:

    @staticmethod
    def get_and_validate_exist_videogame(videogame_id: int, uow: 'IUnitOfWork') -> 'Videogame':
        game = uow.videogame_repo.get_videogame_by_id(videogame_id)
        if not game:
            raise VideogameNotFoundException(videogame_id)
        return game

    @staticmethod
    def get_and_validate_exist_role(role_id: int, uow: 'IUnitOfWork') -> 'Role':
        role = uow.role_repo.get_role_by_id(role_id)
        if not role:
            raise RoleNotFoundException(role_id)
        return role

    @staticmethod
    def get_and_validate_exist_rank(rank_id: int, uow: 'IUnitOfWork') -> 'Rank':
        rank = uow.rank_repo.get_rank_by_id(rank_id)
        if not rank:
            raise RankNotFoundException(rank_id)
        return rank

    @staticmethod
    def get_and_validate_exist_character(character_id: int, uow: 'IUnitOfWork') -> 'Character':
        character = uow.character_repo.get_character_by_id(character_id)
        if not character:
            raise CharacterNotFoundException(character_id)
        return character

    @staticmethod
    def get_and_validate_exists_game_profile(game_profile_id: int, player_id: int, uow: 'IUnitOfWork') -> 'GameProfile':
        game_profile = uow.game_profile_repo.get_game_profile_by_id(game_profile_id)
        if not game_profile:
            raise GameProfileNotFoundException(game_profile_id)
        if game_profile.player_id != player_id:
            raise DoesNotBelongToProfileException("perfil de juego", f"{game_profile_id}")
        return game_profile

    @staticmethod
    def validate_new_character_name_uniqueness(name: str, videogame_id: int, uow: 'IUnitOfWork'):
        existing_character = uow.character_repo.get_character_by_name_and_videogame(name, videogame_id)
        if existing_character:
            raise DuplicatedCharacterNameException(name, videogame_id)
        return True

    @staticmethod
    def validate_character_name_uniqueness(character_id: int, name: str, videogame_id: int, uow: 'IUnitOfWork'):
        existing_character = uow.character_repo.get_character_by_name_and_videogame(name, videogame_id)
        if existing_character and existing_character.character_id != character_id:
            raise DuplicatedCharacterNameException(name, videogame_id)
        return True

    @staticmethod
    def validate_new_videogame_name_uniqueness(cleaned_name: str, uow: 'IUnitOfWork') -> bool:
        existing_videogame = uow.videogame_repo.get_videogame_by_name(cleaned_name.lower())
        if existing_videogame:
            raise VideogameAlreadyExistsException(cleaned_name)
        return True

    @staticmethod
    def validate_videogame_name_uniqueness(cleaned_name: str, current_game_id: int, uow: 'IUnitOfWork') -> bool:
        found_videogame = uow.videogame_repo.get_videogame_by_name(cleaned_name.lower())
        if found_videogame and found_videogame.videogame_id != current_game_id:
            raise VideogameAlreadyExistsException(cleaned_name)
        return True

    @staticmethod
    def validate_username_uniqueness(username: str, current_user_id: int, uow: IUnitOfWork) -> bool:
        found_user = uow.user_repo.get_user_by_username(username)
        if found_user and found_user.user_id != current_user_id:
            raise UsernameAlreadyExistsException(username)
        return True

    @staticmethod
    def validate_mail_uniqueness(mail: str, current_user_id: int, uow: IUnitOfWork) -> bool:
        found_user = uow.user_repo.get_user_by_mail(mail)
        if found_user and found_user.user_id != current_user_id:
            raise EmailAlreadyExistsException(mail)
        return True

    @staticmethod
    def validate_not_duplicated_game_profile(player_id: int, videogame_id: int, uow: IUnitOfWork):
        existing_profile = uow.game_profile_repo.get_game_profile_by_player_and_videogame(player_id, videogame_id)
        if existing_profile:
            raise GameProfileAlreadyExistException(player_id, videogame_id)

    @staticmethod
    def is_duplicated_username(username: str, uow: 'IUnitOfWork') -> bool:
        usuario_con_ese_username = uow.user_repo.get_user_by_username(username)
        return usuario_con_ese_username is not None

    @staticmethod
    def is_duplicated_mail(mail: str, uow: IUnitOfWork) -> bool:
        usuario_con_ese_mail = uow.user_repo.get_user_by_mail(mail)
        return usuario_con_ese_mail is not None