from app.domain.exceptions.domain_exception import DomainException


class DuplicatedRoleInRequest(DomainException):
    def __init__(self):
        super().__init__(f"Se Envió un rol duplicado en la solicitud.", status_code=400)