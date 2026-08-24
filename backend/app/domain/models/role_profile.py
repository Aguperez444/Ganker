
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models.character import Character
    from app.domain.models.rank import Rank
    from app.domain.models.role import Role


class RoleProfile:
    def __init__(self,
                 role: Role,
                 characters: list[Character],
                 rank: Rank
                 ):
        self._role: Role = role
        self._characters: list[Character] = characters
        self._rank: Rank = rank

    @property
    def role(self) -> Role:
        return self._role
    @role.setter
    def role(self, value: Role) -> None:
        self._role = value

    @property
    def characters(self) -> list[Character]:
        return self._characters
    @characters.setter
    def characters(self, value: list[Character]) -> None:
        self._characters = value

    @property
    def rank(self) -> Rank:
        return self._rank
    @rank.setter
    def rank(self, value: Rank) -> None:
        self._rank = value