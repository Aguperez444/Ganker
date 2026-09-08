from enum import Enum

class UserRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    PLAYER = "player"


    def is_player(self) -> bool:
        return self == UserRole.PLAYER

    def is_admin(self) -> bool:
        return self == UserRole.ADMIN or self == UserRole.OWNER

    def is_owner(self) -> bool:
        return self == UserRole.OWNER

    def __repr__(self) -> str:
        return f"UserRole(role='{self.value}')"