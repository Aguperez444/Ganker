from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models.character import Character
    from app.domain.models.rank import Rank
    from app.domain.models.role import Role
    from app.domain.models.role_profile import RoleProfile
    from app.domain.models.videogame import Videogame


class GameProfile:
    def __init__(self, profile_id: int,
                 videogame: Videogame, roles: list['Role'],
                 characters: list['Character'],
                 rank: Rank | None,
                 role_profiles: list['RoleProfile']
                 ):

        self._profile_id: int = profile_id
        self._videogame: Videogame = videogame
        self._roles: list[Role] = roles
        self._characters: list[Character] = characters
        self._rank: Rank | None = rank
        self._role_profiles: list['RoleProfile'] = role_profiles