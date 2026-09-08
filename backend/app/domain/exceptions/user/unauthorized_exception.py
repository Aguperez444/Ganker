from app.domain.exceptions.domain_exception import DomainException


class UnauthorizedException(DomainException):
    def __init__(self, user_id: int, user_role: str, attempted_role: str):
        super().__init__(f"User with ID {user_id} and role {user_role} is not authorized to register a user with role {attempted_role}.", status_code=403)