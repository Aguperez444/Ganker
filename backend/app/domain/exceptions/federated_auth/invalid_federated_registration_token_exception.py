from app.domain.exceptions.domain_exception import DomainException


class InvalidFederatedRegistrationTokenException(DomainException):
    def __init__(self):
        super().__init__(
            message="La sesión de registro externo no es válida o venció. Volvé a iniciar sesión con tu proveedor.",
            status_code=400
        )
