from app.domain.exceptions.domain_exception import DomainException


class UnauthorizedException(DomainException):
    def __init__(self, user_id: int, user_role: str, attempted_role: str):
        super().__init__(f"El usuario con ID {user_id} y rol {user_role} no está autorizado para registrar un usuario con rol {attempted_role}.", status_code=401)