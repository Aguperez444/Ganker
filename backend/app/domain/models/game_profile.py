from typing import TYPE_CHECKING, Optional

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException
from app.domain.exceptions.invalid_id_exception import InvalidIdException


if TYPE_CHECKING:
    from app.domain.models.character_priority import CharacterPriority
    from app.domain.models.role_profile import RoleProfile
    from app.domain.models.videogame import Videogame
    from app.domain.models.region import Region
    from app.domain.models.role import Role


class GameProfile:
    def __init__(self, game_profile_id: Optional[int],
                 player_id: int,
                 videogame: 'Videogame',
                 characters_priority: list['CharacterPriority'],
                 role_profiles: list['RoleProfile'],
                 region: Optional['Region'] = None
                 ):

        self._game_profile_id: Optional[int] = game_profile_id
        self.player_id: int = player_id
        self._videogame: 'Videogame' = videogame
        self._characters_priority: list['CharacterPriority'] = characters_priority
        self._role_profiles: list['RoleProfile'] = role_profiles
        self._region: Optional['Region'] = region

    @property
    def game_profile_id(self) -> int:
        if self._game_profile_id is None:
            raise EntityNotPersistedException("GameProfile")
        return self._game_profile_id
    @game_profile_id.setter
    def game_profile_id(self, value: int) -> None:
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._game_profile_id = value

    @property
    def player_id(self) -> int:
        return self._player_id
    @player_id.setter
    def player_id(self, value: int) -> None:
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._player_id = value

    @property
    def videogame(self) -> 'Videogame':
        return self._videogame
    @videogame.setter
    def videogame(self, value: 'Videogame') -> None:
        self._videogame = value

    @property
    def characters_priority(self) -> list['CharacterPriority']:
        return self._characters_priority
    @characters_priority.setter
    def characters_priority(self, value: list['CharacterPriority']) -> None:
        self._characters_priority = value

    @property
    def role_profiles(self) -> list['RoleProfile']:
        return self._role_profiles
    @role_profiles.setter
    def role_profiles(self, value: list['RoleProfile']) -> None:
        self._role_profiles = value

    @property
    def region(self) -> Optional['Region']:
        return self._region
    @region.setter
    def region(self, value: Optional['Region']) -> None:
        self._region = value

    def is_persisted(self) -> bool:
        return self._game_profile_id is not None

    def __repr__(self) -> str:
        return (f"GameProfile(game_profile_id={self.game_profile_id or 'sin_id'},"
                f" player_id={self.player_id}, videogame={self.videogame},"
                f" characters_priority={self.characters_priority}, role_profiles={self.role_profiles}),"
                f" region={self.region or 'sin_region'})")

    def get_role_profile_by_role(self, role: 'Role') -> 'None|RoleProfile':
        for role_profile in self._role_profiles:
            if role_profile.role.role_id == role.role_id:
                return role_profile
        return None

    def get_role_profile_by_role_id(self, role_id: int) -> 'None|RoleProfile':
        for role_profile in self._role_profiles:
            if role_profile.role.role_id == role_id:
                return role_profile
        return None