from typing import Optional
from app.domain.exceptions.domain_exception import DomainException


class UserNotFoundException(DomainException):
    def __init__(self, user_id: Optional[int] = None):
        msg = f"El usuario con ID {user_id} no fue encontrado." if user_id is not None else "Usuario no encontrado."
        super().__init__(
            message=msg,
            status_code=404
        )
