from app.domain.exceptions.domain_exception import DomainException


class UserNotFoundException(DomainException):
    def __init__(self, user_id: int):
        super().__init__(
            message=f"User with ID {user_id} not found.",
            status_code=404
        )
