from app.domain.exceptions.domain_exception import DomainException


class UserNotFoundException(DomainException):
    def __init__(self, user_id: int):
        super().__init__(
            message=f'No se encontró un usuario con el ID {user_id}.',
            status_code=404
        )