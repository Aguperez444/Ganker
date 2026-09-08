from typing import Optional
from app.domain.exceptions.domain_exception import DomainException


class UserNotFoundException(DomainException):
    def __init__(self, user_id: Optional[int] = None):
        msg = f"User with ID {user_id} not found." if user_id is not None else "User not found."
        super().__init__(
            message=msg,
            status_code=404
        )
