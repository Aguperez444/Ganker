from typing import TYPE_CHECKING
from app.domain.exceptions.character.character_not_found_exception import CharacterNotFoundException
from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException
from app.domain.exceptions.role.role_not_found_exception import RoleNotFoundException
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException
from app.domain.exceptions.game_profile.does_not_belong_to_profile_exception import DoesNotBelongToProfileException
from app.domain.exceptions.game_profile.game_profile_not_found_exception import GameProfileNotFoundException

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
    def get_role_and_validate_exist(role_id: int, uow: 'IUnitOfWork') -> 'Role':
        role = uow.role_repo.get_role_by_id(role_id)
        if not role:
            raise RoleNotFoundException(role_id)
        return role

    @staticmethod
    def get_rank_and_validate_exist(rank_id: int, uow: 'IUnitOfWork') -> 'Rank':
        rank = uow.rank_repo.get_rank_by_id(rank_id)
        if not rank:
            raise RankNotFoundException(rank_id)
        return rank

    @staticmethod
    def get_character_and_validate_exist(character_id: int, uow: 'IUnitOfWork') -> 'Character':
        character = uow.character_repo.get_character_by_id(character_id)
        if not character:
            raise CharacterNotFoundException(character_id)
        return character


    @staticmethod
    def validate_and_get_game_profile(game_profile_id: int, player_id: int, uow: 'IUnitOfWork') -> 'GameProfile':
        game_profile = uow.game_profile_repo.get_game_profile_by_id(game_profile_id)
        if not game_profile:
            raise GameProfileNotFoundException(game_profile_id)
        if game_profile.player_id != player_id:
            raise DoesNotBelongToProfileException("perfil de juego", f"{game_profile_id}")
        return game_profile