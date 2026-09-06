from app.domain.exceptions.domain_exception import DomainException



class DuplicateRoleNameException(DomainException):
    def __init__(self, name: str):
        super().__init__(
            message=f'El nombre de rol: "{name}" ya existe.',
            status_code=409
        )
