from enum import Enum

class UserRole(str, Enum):

    ADMIN = "admin"
    PLAYER = "player"
    OWNER = "owner"

    def is_player(self) -> bool:
        return self == UserRole.PLAYER

    def is_admin(self) -> bool:
        return self == UserRole.ADMIN or self == UserRole.OWNER

    def is_owner(self) -> bool:
        return self == UserRole.OWNER