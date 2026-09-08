from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.character_priority import CharacterPriority
    from app.domain.models.role_profile import RoleProfile
    from app.domain.models.videogame import Videogame


class GameProfile:
    def __init__(self, game_profile_id: Optional[int],
                 player_id: int,
                 videogame: Videogame,
                 characters_priority: list['CharacterPriority'],
                 role_profiles: list['RoleProfile']
                 ):

        self._game_profile_id: Optional[int] = game_profile_id
        self._player_id: int = player_id
        self._videogame: Videogame = videogame
        self._characters_priority: list[CharacterPriority] = characters_priority
        self._role_profiles: list['RoleProfile'] = role_profiles

    @property
    def game_profile_id(self) -> Optional[int]:
        return self._game_profile_id
    @game_profile_id.setter
    def game_profile_id(self, value: Optional[int]) -> None:
        self._game_profile_id = value

    @property
    def player_id(self) -> int:
        return self._player_id
    @player_id.setter
    def player_id(self, value: int) -> None:
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

    def __repr__(self) -> str:
        return (f"GameProfile(game_profile_id={self.game_profile_id or 'sin_id'},"
                f" player_id={self.player_id}, videogame={self.videogame},"
                f" characters_priority={self.characters_priority}, role_profiles={self.role_profiles})")