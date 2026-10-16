from app.domain.exceptions.domain_exception import DomainException


class InvalidFederatedStateException(DomainException):
    def __init__(self):
        super().__init__(
            message="La solicitud de inicio de sesión externo no es válida o venció. Volvé a intentarlo.",
            status_code=400
        )
