from app.domain.exceptions.domain_exception import DomainException


class RoleNotFoundException(DomainException):
    def __init__(self, role_id: int):
        super().__init__(
            message=f'El rol con id {role_id} no fue encontrado.',
            status_code=404
        )