from app.domain.exceptions.domain_exception import DomainException


class RoleNotFoundException(DomainException):
    def __init__(self, role_id: int):
        super().__init__(
            message=f'The role with id {role_id} not found.',
            status_code=404
        )