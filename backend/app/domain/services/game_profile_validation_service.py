from typing import TYPE_CHECKING
from app.domain.exceptions.does_not_belong_to_game_exception import DoesNotBelongToGameException

if TYPE_CHECKING:
    from app.domain.models.character import Character
    from app.domain.models.role import Role
    from app.domain.models.rank import Rank


class GameProfileValidationService:

    @staticmethod
    def validate_character_belongs_to_game(character: 'Character', videogame_id: int, videogame_name: str) -> None:
        if character.videogame.videogame_id != videogame_id:
            raise DoesNotBelongToGameException("personaje", character.name, videogame_name)

    @staticmethod
    def validate_role_belongs_to_game(role: 'Role', videogame_id: int, videogame_name: str) -> None:
        if role.videogame.videogame_id != videogame_id:
            raise DoesNotBelongToGameException("rol", role.name, videogame_name)

    @staticmethod
    def validate_rank_belongs_to_game(rank: 'Rank', videogame_id: int, videogame_name: str) -> None:
        if rank.videogame.videogame_id != videogame_id:
            raise DoesNotBelongToGameException("rango", rank.name, videogame_name)
