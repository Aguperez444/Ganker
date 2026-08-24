from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.character import Character
    from app.domain.models.role_profile import RoleProfile
    from app.domain.models.videogame import Videogame


class GameProfile:
    def __init__(self, game_profile_id: Optional[int],
                 videogame: Videogame,
                 characters: list['Character'],
                 role_profiles: list['RoleProfile']
                 ):

        self._game_profile_id: Optional[int] = game_profile_id
        self._videogame: Videogame = videogame
        self._characters: list[Character] = characters
        self._role_profiles: list['RoleProfile'] = role_profiles

    @property
    def game_profile_id(self) -> Optional[int]:
        return self._game_profile_id
    @game_profile_id.setter
    def game_profile_id(self, value: Optional[int]) -> None:
        self._game_profile_id = value

    @property
    def videogame(self) -> 'Videogame':
        return self._videogame
    @videogame.setter
    def videogame(self, value: 'Videogame') -> None:
        self._videogame = value

    @property
    def characters(self) -> list['Character']:
        return self._characters
    @characters.setter
    def characters(self, value: list['Character']) -> None:
        self._characters = value

    @property
    def role_profiles(self) -> list['RoleProfile']:
        return self._role_profiles
    @role_profiles.setter
    def role_profiles(self, value: list['RoleProfile']) -> None:
        self._role_profiles = value

