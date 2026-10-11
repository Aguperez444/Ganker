from app.domain.exceptions.domain_exception import DomainException


class InvalidRoleProfileException(DomainException):
    """Raised when a role is already occupied in a team."""

    def __init__(self, role_id: int, game_profile_id: int):
        super().__init__(f"El game profile con ID {game_profile_id} no tiene un perfil de rol válido"
                         f" para unirse al grupo con el rol con ID {role_id}.", 409)
