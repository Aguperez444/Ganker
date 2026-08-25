from app.domain.exceptions.domain_exception import DomainException


class UsernameAlreadyExistsException(DomainException):
    def __init__(self, username: str):
        super().__init__(
            message=f'El username: "{username}" ya está ocupado.',
            status_code=409
        )
